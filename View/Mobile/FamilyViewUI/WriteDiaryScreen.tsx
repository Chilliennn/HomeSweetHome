import React, { useState, useRef } from 'react';
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
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { familyViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter } from 'expo-router';
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
 * WriteDiaryScreen - Create new diary entry
 * 
 * UC-301: Write Personal Diary
 * Allows text or voice input, mood selection
 * Validates entry is not empty before saving
 * 
 * FR 3.3.1, 3.3.2, 3.3.3, 3.3.4, 3.3.5, 3.3.8, 3.3.9, 3.3.10
 */
export const WriteDiaryScreen = observer(() => {
  const router = useRouter();
  const { currentRelationship, isLoading, errorMessage, isTranscribing, transcriptionError } = familyViewModel;
  const { transcribeAudio } = useVoiceTranscription();
  const recordingRef = useRef<Audio.Recording | null>(null);

  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('happy');
  const [isRecording, setIsRecording] = useState(false);

  // Initialize relationship if not loaded
  React.useEffect(() => {
    const initializeIfNeeded = async () => {
      if (!currentRelationship) {
        const { authViewModel: auth } = await import('@home-sweet-home/viewmodel');
        const userId = auth.authState.currentUserId;
        if (userId) {
          await familyViewModel.initialize(userId);
        }
      }
    };
    initializeIfNeeded();
  }, [currentRelationship]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Diary entry cannot be empty');
      return;
    }

    if (!currentRelationship) {
      Alert.alert('Error', 'No active relationship');
      return;
    }

    const userId = authViewModel.authState.currentUserId;
    if (!userId) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    await familyViewModel.createDiaryEntry(
      userId,
      currentRelationship.id,
      content,
      selectedMood
    );

    if (!familyViewModel.errorMessage) {
      router.back();
    }
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
        playThroughEarpiece: false,
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
          setContent(prev => {
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

  return (
    <View style={styles.container}>
      <Header
        title="Write New Diary"
        showBackButton={true}
      />

      {errorMessage && (
        <AlertBanner
          type="error"
          message={errorMessage}
          onDismiss={() => familyViewModel.clearError()}
        />
      )}

      {transcriptionError && (
        <AlertBanner
          type="error"
          message={transcriptionError}
          onDismiss={() => {
            // Error auto-clears, but provide manual dismiss option
          }}
        />
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mood Selection */}
        <View style={styles.moodSection}>
          <ThemedText style={styles.sectionLabel}>How are you feeling?</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodContainer}
          >
            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodButton,
                  selectedMood === mood.value && styles.moodButtonActive,
                ]}
                onPress={() => setSelectedMood(mood.value)}
              >
                <ThemedText style={styles.moodEmoji}>{mood.emoji}</ThemedText>
                <ThemedText style={styles.moodLabel}>{mood.label}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input Method Selection */}
        <View style={styles.inputMethodSection}>
          <ThemedText style={styles.sectionLabel}>Write or Record</ThemedText>
          <View style={styles.inputMethodButtons}>
            <Button
              title="✏️ Text Input"
              onPress={() => {}}
              variant="primary"
            />
            {!isRecording ? (
              <Button
                title="🎤 Voice Input"
                onPress={handleStartVoiceInput}
                variant="outline"
                disabled={isTranscribing || familyViewModel.isTranscribing}
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

        {/* Diary Entry Text Input */}
        <View style={styles.textInputSection}>
          <TextInput
            style={styles.textInput}
            placeholder="Write your thoughts and feelings here..."
            placeholderTextColor="#999"
            value={content}
            onChangeText={setContent}
            multiline
            maxLength={10000}
            editable={!isRecording}
          />
          <ThemedText style={styles.characterCount}>
            {content.length}/10000
          </ThemedText>
        </View>

        {/* Recording Status */}
        {isRecording && (
          <View style={styles.recordingStatus}>
            <ActivityIndicator size="small" color="#9DE2D0" />
            <ThemedText style={styles.recordingText}>Recording audio...</ThemedText>
          </View>
        )}

        {/* Transcribing Status */}
        {familyViewModel.isTranscribing && (
          <View style={styles.recordingStatus}>
            <ActivityIndicator size="small" color="#9DE2D0" />
            <ThemedText style={styles.recordingText}>Transcribing voice with Whisper AI...</ThemedText>
          </View>
        )}

        {/* Save Button */}
        <View style={styles.actionButtons}>
          <Button
            title={isLoading ? 'Saving...' : 'Save Entry'}
            onPress={handleSave}
            disabled={!content.trim() || isLoading}
            loading={isLoading}
            variant="primary"
          />
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
  moodSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 12,
  },
  moodContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  moodButton: {
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    minWidth: 60,
  },
  moodButtonActive: {
    backgroundColor: '#9DE2D0',
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 11,
    color: '#687076',
    fontWeight: '500',
  },
  inputMethodSection: {
    marginBottom: 24,
  },
  inputMethodButtons: {
    gap: 12,
  },
  textInputSection: {
    marginBottom: 24,
  },
  textInput: {
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
  recordingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 12,
  },
  recordingText: {
    fontSize: 14,
    color: '#11181C',
    fontWeight: '500',
  },
  actionButtons: {
    marginVertical: 24,
  },
});
