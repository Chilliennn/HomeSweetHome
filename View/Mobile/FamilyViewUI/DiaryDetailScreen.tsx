import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { Audio } from 'expo-av';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useVoiceTranscription } from '@/hooks/useVoiceTranscription';
import type { MoodType } from '@home-sweet-home/model';

const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

/**
 * DiaryDetailScreen - View and manage individual diary entry
 * 
 * UC-301: Edit/Delete existing diary
 * Shows full entry content, allows editing, deletion with confirmation
 * 
 */
export const DiaryDetailScreen = observer(() => {
  const router = useRouter();
  const { entryId } = useLocalSearchParams();
  const { selectedDiary, isEditingDiary, isLoading, errorMessage, successMessage, isTranscribing } = familyViewModel;
  const { transcribeAudio } = useVoiceTranscription();
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<MoodType>('happy');
  const [isRecording, setIsRecording] = useState(false);

  // Load diary entry if not already selected
  useEffect(() => {
    const loadEntry = async () => {
      if (!selectedDiary && entryId && typeof entryId === 'string') {
        await familyViewModel.loadDiaryEntry(entryId);
      }
    };
    loadEntry();
  }, [entryId, selectedDiary]);

  useEffect(() => {
    if (selectedDiary) {
      setEditContent(selectedDiary.content);
      setEditMood(selectedDiary.mood);
    }
  }, [selectedDiary]);

  if (!selectedDiary) {
    return (
      <View style={styles.container}>
        <Header title="Diary Entry" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading entry...</ThemedText>
        </View>
      </View>
    );
  }

  const getMoodInfo = (mood: MoodType) => {
    return MOOD_OPTIONS.find(m => m.value === mood);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      Alert.alert('Error', 'Diary entry cannot be empty');
      return;
    }

    await familyViewModel.updateDiaryEntry(
      selectedDiary.id,
      editContent,
      editMood
    );
  };

  const handleStartVoiceInput = async () => {
    try {
      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Permission denied to access microphone. Please enable microphone access in settings.');
        return;
      }

      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
      setIsRecording(false);
    }
  };

  const handleStopVoiceInput = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        // Use hook to read file and ViewModel to transcribe
        try {
          const result = await transcribeAudio(uri);

          // Append transcribed text to content
          setEditContent(prev => {
            const newContent = prev.trim() ? prev + '\n' + result.text : result.text;
            return newContent;
          });

          // Show success feedback
          Alert.alert('Success', 'Voice transcribed successfully!');
        } catch (transcriptionError) {
          console.error('Error transcribing voice:', transcriptionError);
          Alert.alert(
            'Transcription Failed',
            'Could not transcribe voice. Please check your internet connection and try again.'
          );
        }
      }
    } catch (error) {
      console.error('Error stopping voice recording:', error);
      Alert.alert('Error', 'Failed to process voice recording. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry? This action cannot be undone!',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: async () => {
            await familyViewModel.deleteDiaryEntry(selectedDiary.id);
            router.back();
          },
          style: 'destructive',
        },
      ]
    );
  };

  const moodInfo = getMoodInfo(selectedDiary.mood);

  return (
    <View style={styles.container}>
      <Header
        title={isEditingDiary ? 'Edit Diary' : 'Diary Entry'}
        showBackButton={true}
      />

      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onDismiss={() => familyViewModel.clearError()}
        />
      )}

      {successMessage && (
        <AlertBanner
          type="success"
          message={successMessage}
          onDismiss={() => familyViewModel.clearSuccessMessage()}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Entry Info */}
        <View style={styles.infoSection}>
          <View style={styles.dateRow}>
            <ThemedText style={styles.label}>Date:</ThemedText>
            <ThemedText style={styles.value}>
              {new Date(selectedDiary.created_at).toLocaleString()}
            </ThemedText>
          </View>

          <View style={styles.moodRow}>
            <ThemedText style={styles.label}>Mood:</ThemedText>
            {isEditingDiary ? (
              <View style={styles.moodEditContainer}>
                {MOOD_OPTIONS.map((mood) => (
                  <TouchableOpacity
                    key={mood.value}
                    style={[
                      styles.moodEditButton,
                      editMood === mood.value && styles.moodEditButtonActive,
                    ]}
                    onPress={() => setEditMood(mood.value)}
                  >
                    <ThemedText style={styles.moodEditEmoji}>{mood.emoji}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.moodDisplay}>
                <ThemedText style={styles.moodEmoji}>{moodInfo?.emoji}</ThemedText>
                <ThemedText style={styles.value}>{moodInfo?.label}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentSection}>
          <ThemedText style={styles.contentLabel}>Entry</ThemedText>
          {isEditingDiary ? (
            <View>
              {/* Input Method Selection */}
              <View style={styles.inputMethodSection}>
                <ThemedText style={styles.sectionLabel}>Write or Record</ThemedText>
                <View style={styles.inputMethodButtons}>
                  <Button
                    title="✏️ Text Input"
                    onPress={() => { }}
                    variant="primary"
                  />
                  {!isRecording ? (
                    <Button
                      title="🎤 Voice Input"
                      onPress={handleStartVoiceInput}
                      variant="outline"
                      disabled={isTranscribing}
                    />
                  ) : (
                    <Button
                      title="⏹️ Stop Recording"
                      onPress={handleStopVoiceInput}
                      variant="primary"
                      disabled={isTranscribing}
                    />
                  )}
                </View>
              </View>

              {/* Recording Status */}
              {isRecording && (
                <View style={styles.recordingStatus}>
                  <ActivityIndicator size="small" color="#9DE2D0" />
                  <ThemedText style={styles.recordingText}>Recording audio...</ThemedText>
                </View>
              )}

              {/* Transcribing Status */}
              {isTranscribing && (
                <View style={styles.recordingStatus}>
                  <ActivityIndicator size="small" color="#9DE2D0" />
                  <ThemedText style={styles.recordingText}>Transcribing voice with Whisper AI...</ThemedText>
                </View>
              )}

              {/* Text Input */}
              <TextInput
                style={styles.editInput}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                maxLength={10000}
                editable={!isRecording}
              />
              <ThemedText style={styles.characterCount}>
                {editContent.length}/10000
              </ThemedText>
            </View>
          ) : (
            <ThemedText style={styles.contentText}>{selectedDiary.content}</ThemedText>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isEditingDiary ? (
            <>
              <Button
                title="Cancel"
                onPress={() => familyViewModel.toggleEditDiary()}
                variant="outline"
              />
              <Button
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={isLoading}
                variant="primary"
              />
            </>
          ) : (
            <>
              <Button
                title="Edit"
                onPress={() => familyViewModel.toggleEditDiary()}
                variant="primary"
              />
              <Button
                title="Delete"
                onPress={handleDelete}
                variant="outline"
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoSection: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  moodRow: {
    paddingTop: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  value: {
    fontSize: 14,
    color: '#687076',
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodEditContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 8,
  },
  moodEditButton: {
    width: '30%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moodEditButtonActive: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  moodEditEmoji: {
    fontSize: 24,
  },
  contentSection: {
    marginBottom: 24,
  },
  contentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  contentText: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#11181C',
    minHeight: 200,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
  },
  inputMethodSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  inputMethodButtons: {
    gap: 12,
  },
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  recordingText: {
    fontSize: 14,
    color: '#11181C',
    fontWeight: '500',
  },
  actionButtons: {
    gap: 12,
    marginVertical: 24,
  },
});
