import React, { useEffect } from 'react';
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
import { familyViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter } from 'expo-router';

/**
 * AlbumScreen - Main Family Photo Album interface
 * 
 * UC-300: MANAGE FAMILY MEMORIES
 * Displays family photos/videos organized by date
 * Allows upload, download, remove, and caption management
 * 
 * FR 3.1.1 - 3.1.12
 */
export const AlbumScreen = observer(() => {
  const router = useRouter();
  const { mediaItems, isLoading, errorMessage, successMessage, canAccessFamilyAlbum } = familyViewModel;

  useEffect(() => {
    // Initialize if needed (fallback if not initialized from login)
    const initializeIfNeeded = async () => {
      if (!familyViewModel.currentRelationship) {
        // Try to load from authViewModel or stored userId
        const userId = authViewModel.authState.currentUserId;
        if (userId) {
          await familyViewModel.initialize(userId);
        }
      }
      // Load media when relationship is available
      if (familyViewModel.currentRelationship) {
        familyViewModel.loadMedia(familyViewModel.currentRelationship.id);
      }
    };
    initializeIfNeeded();
  }, [familyViewModel.currentRelationship?.id]);

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

  const handleMediaSelect = (media: any) => {
    familyViewModel.selectMedia(media);
    router.push({
      pathname: '/family/album/image-detail',
      params: { mediaId: media.id },
    });
  };

  const renderMediaItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.mediaCard}
      onPress={() => handleMediaSelect(item)}
    >
      <Image
        source={{ uri: item.file_url }}
        style={styles.mediaThumbnail}
      />
      <View style={styles.mediaOverlay}>
        <ThemedText style={styles.mediaDate}>
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

        {mediaItems.length === 0 ? (
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
              data={mediaItems}
              renderItem={renderMediaItem}
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
  mediaCard: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mediaThumbnail: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  mediaDate: {
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
