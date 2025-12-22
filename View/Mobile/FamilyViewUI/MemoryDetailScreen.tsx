import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Text,
  Dimensions,
  TextInput,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { observer } from 'mobx-react-lite';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * MemoryDetailScreen - View grouped memory with all associated media
 * 
 * UC-300: VIEW MEMORY DETAILS
 * Displays:
 * - Large photo (active index)
 * - Horizontal thumbnail preview bar (clickable to switch)
 * - Date/metadata row
 * - Batch download and remove buttons
 * 
 */
export const MemoryDetailScreen = observer(() => {
  const router = useRouter();
  const { memoryId } = useLocalSearchParams<{ memoryId: string }>();
  const { selectedMemory, isLoading, errorMessage, successMessage } = familyViewModel;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [editingCaption, setEditingCaption] = useState(false);
  const [newCaption, setNewCaption] = useState('');

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const loadMemory = async () => {
      setIsLoadingScreen(true);
      if (memoryId) {
        await familyViewModel.selectMemory(memoryId as string);
      }
      setIsLoadingScreen(false);
    };
    loadMemory();
  }, [memoryId]);

  useEffect(() => {
    if (selectedMemory?.caption !== undefined) {
      setNewCaption(selectedMemory.caption || '');
    }
  }, [selectedMemory?.caption]);

  if (isLoadingScreen || !selectedMemory) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading memory...</ThemedText>
        </View>
      </View>
    );
  }

  const media = selectedMemory.media || [];
  const currentMedia = media[activeIndex];

  const handlePreviousPhoto = () => {
    setActiveIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setActiveIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };

  const handleRemoveMemory = () => {
    Alert.alert(
      'Remove Memory',
      `This will delete all ${media.length} item(s) in this memory. This cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await familyViewModel.removeMemory(selectedMemory.id);
            if (!familyViewModel.errorMessage) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleSaveCaption = async () => {
    try {
      await familyViewModel.updateMemoryCaption(selectedMemory.id, newCaption);
      setEditingCaption(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save caption');
    }
  };

  // Handle download in View layer (platform-specific)
  const handleDownloadAll = async () => {
    if (!selectedMemory) return;

    // Request permission with error handling
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Please grant permission to save files to your gallery.');
        return;
      }
    } catch (permError: any) {
      // If permission request fails, continue anyway - user may have already granted it
      console.log('[MemoryDetailScreen] Permission request error (continuing):', permError.message);
    }

    // Get downloadable media URLs from ViewModel
    const downloadableMedia = await familyViewModel.downloadMemory(selectedMemory.id);
    if (!downloadableMedia || downloadableMedia.length === 0) {
      Alert.alert('Error', familyViewModel.errorMessage || 'No media to download');
      return;
    }

    let successCount = 0;
    const failures: string[] = [];

    for (const item of downloadableMedia) {
      try {
        const dest = FileSystem.documentDirectory + item.filename;

        // Download file
        const result = await FileSystem.downloadAsync(item.url, dest, {
          headers: { Accept: '*/*' },
        } as any);

        if (!result || result.status !== 200) {
          failures.push(item.filename);
          continue;
        }

        // Verify file exists
        const fileInfo = await FileSystem.getInfoAsync(dest);
        if (!fileInfo.exists) {
          failures.push(item.filename);
          continue;
        }

        // Register with gallery
        try {
          await MediaLibrary.createAssetAsync(dest);
        } catch {
          // Continue even if gallery registration fails
        }

        successCount++;
      } catch {
        failures.push(item.filename);
      }
    }

    if (failures.length === 0) {
      Alert.alert('Success', `Downloaded ${successCount} file(s) to your gallery.`);
    } else {
      Alert.alert('Partial Success', `Downloaded ${successCount}/${downloadableMedia.length}. Failed: ${failures.join(', ')}`);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Details</Text>
        <View style={styles.headerRight} />
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
        {/* Large Photo/Video Display */}
        <View style={[styles.photoContainer, { height: screenHeight * 0.4 }]}>
          {currentMedia && (
            currentMedia.media_type === 'video' ? (
              <Video
                source={{ uri: currentMedia.file_url }}
                style={styles.largePhoto}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                isLooping={false}
              />
            ) : (
              <Image
                source={{ uri: currentMedia.file_url }}
                style={styles.largePhoto}
                resizeMode="cover"
              />
            )
          )}

          {/* Navigation Arrows (on sides of large photo/video) */}
          {media.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.navArrow, styles.leftArrow]}
                onPress={handlePreviousPhoto}
              >
                <Text style={styles.arrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.navArrow, styles.rightArrow]}
                onPress={handleNextPhoto}
              >
                <Text style={styles.arrowText}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Photo Counter */}
          <View style={styles.photoCounter}>
            <ThemedText style={styles.photoCounterText}>
              {activeIndex + 1} / {media.length}
            </ThemedText>
          </View>
        </View>

        {/* Thumbnail Preview Bar */}
        {media.length > 1 && (
          <View style={styles.previewBarContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.previewBar}
              contentContainerStyle={styles.previewBarContent}
            >
              {media.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.previewThumb,
                    index === activeIndex && styles.previewThumbActive,
                  ]}
                  onPress={() => setActiveIndex(index)}
                >
                  <Image
                    source={{ uri: item.file_url }}
                    style={styles.previewThumbImage}
                  />
                  {item.media_type === 'video' && (
                    <View style={styles.videoBadge}>
                      <Text style={styles.videoBadgeIcon}>▶</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Metadata Row */}
        <View style={styles.metadataRow}>
          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataLabel}>Uploaded</ThemedText>
            <ThemedText style={styles.metadataValue}>
              {new Date(selectedMemory.uploaded_at).toLocaleDateString()}
            </ThemedText>
          </View>
          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataLabel}>Items</ThemedText>
            <ThemedText style={styles.metadataValue}>
              {media.length}
            </ThemedText>
          </View>
          <View style={styles.metadataItem}>
            <ThemedText style={styles.metadataLabel}>Type</ThemedText>
            <ThemedText style={styles.metadataValue}>
              {currentMedia?.media_type === 'video' ? 'Video' : 'Photo'}
            </ThemedText>
          </View>
        </View>

        {/* Caption */}
        <View style={styles.captionSection}>
          {editingCaption ? (
            <View style={styles.captionEditContainer}>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a caption..."
                placeholderTextColor="#999"
                multiline
                value={newCaption}
                onChangeText={setNewCaption}
                maxLength={500}
              />
              <View style={styles.captionButtonsRow}>
                <TouchableOpacity
                  style={[styles.captionButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingCaption(false);
                    setNewCaption(selectedMemory.caption || '');
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.captionButton, styles.saveButton]}
                  onPress={handleSaveCaption}
                >
                  <ThemedText style={styles.saveButtonText}>Save</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.captionHeader}>
                <ThemedText style={styles.captionLabel}>Caption</ThemedText>
                <TouchableOpacity onPress={() => setEditingCaption(true)}>
                  <ThemedText style={styles.editButton}>Edit</ThemedText>
                </TouchableOpacity>
              </View>
              {selectedMemory.caption ? (
                <ThemedText style={styles.captionText}>
                  {selectedMemory.caption}
                </ThemedText>
              ) : (
                <ThemedText style={styles.noCaptionText}>
                  No caption added. Tap Edit to add one.
                </ThemedText>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonsContainer}>
          <Button
            title={`Download All (${media.length})`}
            onPress={handleDownloadAll}
            variant="primary"
          />
          <Button
            title="Remove Memory"
            onPress={handleRemoveMemory}
            variant="outline"
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerRight: {
    width: 40,
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Large Photo Display
  photoContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#f0f0f0',
  },
  largePhoto: {
    width: '100%',
    height: '100%',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    marginTop: -22,
  },
  leftArrow: {
    left: 12,
  },
  rightArrow: {
    right: 12,
  },
  arrowText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  photoCounter: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  photoCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Thumbnail Preview Bar
  previewBarContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewBar: {
    height: 80,
  },
  previewBarContent: {
    paddingHorizontal: 4,
  },
  previewThumb: {
    width: 80,
    height: 80,
    borderRadius: 4,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  previewThumbActive: {
    borderColor: '#7ECEC5',
  },
  previewThumbImage: {
    width: '100%',
    height: '100%',
  },
  videoBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoBadgeIcon: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Metadata Row
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },

  // Caption Section
  captionSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 8,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  captionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    fontSize: 12,
    color: '#7ECEC5',
    fontWeight: '600',
  },
  captionText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCaptionText: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  captionEditContainer: {
    gap: 12,
  },
  captionInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  captionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  captionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#7ECEC5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Action Buttons
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
});
