import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { familyViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter } from 'expo-router';
import type { MoodType, DiaryEntry } from '@home-sweet-home/model';

const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
  { value: 'excited', label: 'Excited', emoji: '🤩' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'grateful', label: 'Grateful', emoji: '🙏' },
];

/**
 * DiaryScreen - Personal Diary entries view
 * 
 * UC-301: WRITE PERSONAL DIARY
 * Displays all diary entries, allows filtering by mood
 * Allows creating, editing, and deleting entries
 * 
 * FR 3.3.1 - 3.3.10
 */
export const DiaryScreen = observer(() => {
  const router = useRouter();
  const { diaryEntries, selectedMoodFilter, isLoading, errorMessage, successMessage } = familyViewModel;

  useEffect(() => {
    const initializeIfNeeded = async () => {
      if (!familyViewModel.currentRelationship) {
        const userId = authViewModel.authState.currentUserId;
        if (userId) {
          await familyViewModel.initialize(userId);
        }
      }
      // Load diary entries
      if (familyViewModel.currentRelationship) {
        const userId = authViewModel.authState.currentUserId;
        if (userId) {
          familyViewModel.loadDiaryEntries(
            userId,
            familyViewModel.currentRelationship.id
          );
        }
      }
    };
    initializeIfNeeded();
  }, [familyViewModel.currentRelationship?.id]);

  const handleWriteNew = () => {
    router.push('/family/diary/write');
  };

  const handleSelectEntry = (entry: DiaryEntry) => {
    familyViewModel.selectDiaryEntry(entry);
    router.push({
      pathname: '/family/diary/detail',
      params: { entryId: entry.id },
    });
  };

  const handleFilterByMood = (mood: MoodType | null) => {
    familyViewModel.filterByMood(mood);
  };

  const getMoodInfo = (mood: MoodType) => {
    return MOOD_OPTIONS.find(m => m.value === mood);
  };

  const renderDiaryEntry = ({ item }: { item: any }) => {
    const moodInfo = getMoodInfo(item.mood);
    const preview = item.content.substring(0, 100) + (item.content.length > 100 ? '...' : '');

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => handleSelectEntry(item)}
      >
        <View style={styles.entryHeader}>
          <View>
            <ThemedText style={styles.entryDate}>
              {new Date(item.created_at).toLocaleDateString()}
            </ThemedText>
            <ThemedText style={styles.entryTime}>
              {new Date(item.created_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          </View>
          <View style={[styles.moodBadge, { backgroundColor: getMoodColor(item.mood) }]}>
            <ThemedText style={styles.moodEmoji}>{moodInfo?.emoji}</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.entryPreview}>{preview}</ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Personal Diary" />

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
        {/* Write New Diary Button */}
        <View style={styles.actionSection}>
          <Button
            title="Write New Diary"
            onPress={handleWriteNew}
            variant="primary"
          />
        </View>

        {/* Mood Filter */}
        <View style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Filter by mood:</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.moodFilterContainer}
          >
            <TouchableOpacity
              style={[
                styles.moodChip,
                selectedMoodFilter === null && styles.moodChipActive,
              ]}
              onPress={() => handleFilterByMood(null)}
            >
              <ThemedText
                style={[
                  styles.moodChipText,
                  selectedMoodFilter === null && styles.moodChipTextActive,
                ]}
              >
                All
              </ThemedText>
            </TouchableOpacity>

            {MOOD_OPTIONS.map((mood) => (
              <TouchableOpacity
                key={mood.value}
                style={[
                  styles.moodChip,
                  selectedMoodFilter === mood.value && styles.moodChipActive,
                ]}
                onPress={() => handleFilterByMood(mood.value)}
              >
                <ThemedText style={styles.moodChipEmoji}>{mood.emoji}</ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Diary Entries List */}
        {diaryEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No diary entries yet. Start writing to express your feelings!
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={diaryEntries}
            renderItem={renderDiaryEntry}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ScrollView>
    </View>
  );
});

const getMoodColor = (mood: string): string => {
  const colors: Record<string, string> = {
    happy: '#FFD93D',
    sad: '#6BA3FF',
    neutral: '#C0C0C0',
    excited: '#FF6B9D',
    anxious: '#FFA07A',
    grateful: '#98D8C8',
  };
  return colors[mood] || '#E0E0E0';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  actionSection: {
    marginBottom: 24,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 12,
  },
  moodFilterContainer: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  moodChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  moodChipActive: {
    backgroundColor: '#9DE2D0',
    borderColor: '#9DE2D0',
  },
  moodChipText: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '500',
  },
  moodChipTextActive: {
    color: '#fff',
  },
  moodChipEmoji: {
    fontSize: 18,
  },
  listContent: {
    paddingBottom: 32,
    gap: 12,
  },
  entryCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#9DE2D0',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  entryTime: {
    fontSize: 12,
    color: '#687076',
    marginTop: 2,
  },
  moodBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: 20,
  },
  entryPreview: {
    fontSize: 13,
    color: '#687076',
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 16,
  },
});
