import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * ImageDetailScreen - View, edit, download, and remove media
 * 
 * UC-300: Image details and management
 * Shows full image, allows caption editing, download, and removal
 * 
 * FR 3.1.3, 3.1.4, 3.1.7, 3.1.10
 */
export const ImageDetailScreen = observer(() => {
  const router = useRouter();
  const { mediaId } = useLocalSearchParams();
  const { selectedMedia, isLoading, errorMessage, successMessage } = familyViewModel;

  const [editingCaption, setEditingCaption] = useState(false);
  const [newCaption, setNewCaption] = useState(selectedMedia?.caption || '');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (selectedMedia?.caption !== undefined) {
      setNewCaption(selectedMedia.caption || '');
    }
  }, [selectedMedia?.caption]);

  if (!selectedMedia) {
    return (
      <View style={styles.container}>
        <Header title="Image Details" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ThemedText>Loading image...</ThemedText>
        </View>
      </View>
    );
  }

  const handleSaveCaption = async () => {
    try {
      await familyViewModel.updateMediaCaption(selectedMedia.id, newCaption);
      setEditingCaption(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save caption');
    }
  };
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Determine file extension from URL or media type
      const url = selectedMedia.file_url || '';
      const urlExt = (url.split('?')[0].split('.').pop() || '').toLowerCase();
      let ext = urlExt;
      if (!ext) {
        ext = selectedMedia.media_type === 'video' ? 'mp4' : 'jpg';
      } else if (selectedMedia.media_type !== 'video' && (ext === 'jpeg' || ext === 'jpg' || ext === 'png')) {
        // keep as is
      } else if (selectedMedia.media_type === 'video' && ext !== 'mp4') {
        ext = 'mp4';
      }

      const filename = `HomeSweetHome_${selectedMedia.id}.${ext}`;
      
      // Download to app's document directory
      const dest = FileSystem.documentDirectory + filename;
      console.log('[Download] Destination:', dest);
      
      const result = await FileSystem.downloadAsync(
        selectedMedia.file_url,
        dest,
        {
          headers: {
            Accept: '*/*',
          },
        } as any
      );

      console.log('[Download] Download result status:', result.status);

      if (!result || result.status !== 200) {
        throw new Error(`Download failed with status ${result?.status}`);
      }

      // Verify file exists
      const fileInfo = await FileSystem.getInfoAsync(dest);
      if (!fileInfo.exists) {
        throw new Error('File was not saved');
      }

      // Register with gallery (silently ignore if it fails)
      MediaLibrary.createAssetAsync(dest).catch((err) => {
        console.log('[Download] Gallery registration note:', err.message);
      });

      Alert.alert(
        'Download Complete',
        `${filename}\n\nThe file has been saved to your device.`
      );
    } catch (error: any) {
      console.error('[Download] Error occurred:', error);
      const msg = error?.message || 'Unknown error';
      Alert.alert('Error', `Failed to download: ${msg}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove Memory',
      'Are you sure you want to remove it from timeline? This action cannot be undone!',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: async () => {
            await familyViewModel.removeMedia(selectedMedia.id);
            router.back();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Memory Details" showBackButton={true} />

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
        {/* Full Image */}
        <Image
          source={{ uri: selectedMedia.file_url }}
          style={styles.fullImage}
        />

        <View style={styles.infoSection}>
          {/* Date and Type */}
          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Date:</ThemedText>
            <ThemedText style={styles.metaValue}>
              {new Date(selectedMedia.uploaded_at).toLocaleString()}
            </ThemedText>
          </View>

          <View style={styles.metaRow}>
            <ThemedText style={styles.metaLabel}>Type:</ThemedText>
            <ThemedText style={styles.metaValue}>
              {selectedMedia.media_type === 'video' ? 'Video' : 'Photo'}
            </ThemedText>
          </View>

          {/* Caption Section */}
          <View style={styles.captionSection}>
            <View style={styles.captionHeader}>
              <ThemedText style={styles.sectionTitle}>Caption</ThemedText>
              {!editingCaption && (
                <TouchableOpacity onPress={() => setEditingCaption(true)}>
                  <ThemedText style={styles.editButton}>Edit</ThemedText>
                </TouchableOpacity>
              )}
            </View>

            {editingCaption ? (
              <View>
                <TextInput
                  style={styles.captionInput}
                  placeholder="Add caption..."
                  placeholderTextColor="#999"
                  value={newCaption}
                  onChangeText={setNewCaption}
                  multiline
                  maxLength={500}
                />
                <ThemedText style={styles.characterCount}>
                  {newCaption.length}/500
                </ThemedText>

                <View style={styles.editButtons}>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setNewCaption(selectedMedia.caption || '');
                      setEditingCaption(false);
                    }}
                    variant="outline"
                  />
                  <Button
                    title="Save"
                    onPress={handleSaveCaption}
                    loading={isLoading}
                    variant="primary"
                  />
                </View>
              </View>
            ) : (
              <ThemedText style={styles.captionText}>
                {selectedMedia.caption || 'No caption added'}
              </ThemedText>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Download"
              onPress={handleDownload}
              loading={isDownloading}
              variant="primary"
            />
            <Button
              title="Remove"
              onPress={handleRemove}
              variant="outline"
            />
          </View>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: 400,
    backgroundColor: '#f5f5f5',
  },
  infoSection: {
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  metaLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
  },
  metaValue: {
    fontSize: 14,
    color: '#687076',
  },
  captionSection: {
    marginVertical: 20,
  },
  captionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  editButton: {
    color: '#9DE2D0',
    fontSize: 14,
    fontWeight: '600',
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#11181C',
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  captionText: {
    fontSize: 14,
    color: '#11181C',
    lineHeight: 20,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginBottom: 12,
  },
  editButtons: {
    gap: 12,
    marginTop: 12,
  },
  actionButtons: {
    gap: 12,
    marginTop: 24,
  },
});
