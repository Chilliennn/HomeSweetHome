import React, { useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Text,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';

/**
 * AlbumScreen - Main Family Photo Album interface
 * 
 * UC-300: MANAGE FAMILY MEMORIES
 * Displays family memories (grouped media) organized by date
 * One card per memory showing thumbnail + media count
 * Allows upload, view details, and batch operations
 * 
 */
export const AlbumScreen = observer(() => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { memories, isLoading, errorMessage, successMessage, canAccessFamilyAlbum, currentUserId } = familyViewModel;
  const userId = (params.userId as string) || currentUserId;

  // Re-initialize when userId changes (e.g., logout and login with different account)
  useEffect(() => {
    console.log('[AlbumScreen] userId changed:', { userId, previousUserId: currentUserId });
    if (userId) {
      familyViewModel.initialize(userId);
    }
  }, [userId]);

  // Reload memories when screen gains focus (e.g., after saving from chat)
  useFocusEffect(
    useCallback(() => {
      if (familyViewModel.currentRelationship) {
        console.log('[AlbumScreen] Screen focused, reloading memories...');
        familyViewModel.loadMemories();
      }
    }, [familyViewModel.currentRelationship?.id])
  );

  const handleCalendarPress = () => {
    router.push('/family/calendar');
  };

  if (!canAccessFamilyAlbum()) {
    return (
      <View style={styles.lockedContainer}>
        <Header title="Family Album" />
        <View style={styles.lockedContent}>
          <ThemedText style={styles.lockedText}>
            Family Album is available from Stage 2 onwards
          </ThemedText>
        </View>
      </View>
    );
  }

  const handleUploadPress = () => {
    router.push('/family/album/upload');
  };

  const handleMemorySelect = (memory: any) => {
    familyViewModel.selectMemory(memory.id);
    router.push({
      pathname: '/family/album/memory-detail',
      params: { memoryId: memory.id },
    });
  };

  const renderMemoryCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.memoryCard}
      onPress={() => handleMemorySelect(item)}
    >
      <Image
        source={{ uri: item.thumbnail_url }}
        style={styles.memoryThumbnail}
      />
      {item.media_count > 1 && (
        <View style={styles.mediaCountBadge}>
          <ThemedText style={styles.mediaCountText}>
            +{item.media_count - 1}
          </ThemedText>
        </View>
      )}
      <View style={styles.memoryOverlay}>
        <ThemedText style={styles.memoryDate}>
          {new Date(item.uploaded_at).toLocaleDateString()}
        </ThemedText>
      </View>
      {item.caption && (
        <View style={styles.captionPreview}>
          <ThemedText numberOfLines={1} style={styles.caption}>
            {item.caption}
          </ThemedText>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Custom Header with Calendar Icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Family Album</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => router.push('/family/calendar')}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

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
        <View style={styles.uploadSection}>
          <Button
            title="Upload New Memory"
            onPress={handleUploadPress}
            variant="primary"
          />
        </View>

        {memories.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText style={styles.emptyText}>
              No memories yet. Start by uploading your first photo or video!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.timelineContainer}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Timeline
            </ThemedText>
            <FlatList
              data={memories}
              renderItem={renderMemoryCard}
              keyExtractor={(item) => item.id}
              numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: '#fff',
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7ECEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFF',
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7ECEC5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarIcon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadSection: {
    marginBottom: 24,
  },
  timelineContainer: {
    marginBottom: 32,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#11181C',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 16,
  },
  memoryCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  memoryThumbnail: {
    width: '100%',
    height: '100%',
  },
  mediaCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  memoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  memoryDate: {
    color: '#fff',
    fontSize: 12,
  },
  captionPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 6,
  },
  caption: {
    color: '#fff',
    fontSize: 11,
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
  lockedContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  lockedContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  lockedText: {
    textAlign: 'center',
    color: '#687076',
    fontSize: 18,
  },
});
