import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { observer } from 'mobx-react-lite';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { familyViewModel } from '@home-sweet-home/viewmodel';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/Button';
import { AlertBanner } from '@/components/ui/AlertBanner';
import { Header } from '@/components/ui/Header';
import { useRouter } from 'expo-router';

/**
 * UploadImageScreen - Upload photos/videos to family album
 * 
 * UC-300: Upload media
 * Handles file selection from device/camera
 * Validates file format and size
 * Allows caption input
 * 
 */
export const UploadImageScreen = observer(() => {
  const router = useRouter();
  const { isUploading, errorMessage, successMessage } = familyViewModel;

  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const addSelectedAssets = (assets: any[]) => {
    if (!assets || assets.length === 0) return;
    setSelectedFiles((prev) => {
      const existing = new Set(prev.map(p => p.uri));
      const merged: any[] = [...prev];
      for (const a of assets) {
        if (!existing.has(a.uri)) merged.push(a);
        if (merged.length >= 5) break;
      }
      return merged.slice(0, 5);
    });
    setUploadProgress(0);
  };

  const handlePickFromLibrary = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll access is required to pick images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 0.8,
        allowsEditing: true,
        allowsMultipleSelection: true as any,
        selectionLimit: 5 as any,
      });

      console.log('[ImagePicker] Library result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addSelectedAssets(result.assets);
      }
    } catch (error: any) {
      console.error('[ImagePicker] Library error:', error);
      Alert.alert('Error', `Failed to pick image: ${error.message || 'Unknown error'}`);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request permission first
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera access is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        aspect: [4, 3],
        quality: 0.8,
        allowsEditing: true,
      });

      console.log('[ImagePicker] Camera result:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        addSelectedAssets(result.assets);
      }
    } catch (error: any) {
      console.error('[ImagePicker] Camera error:', error);
      Alert.alert('Error', `Failed to take photo: ${error.message || 'Unknown error'}`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      Alert.alert('Error', 'Please select a file first');
      return;
    }

    if (!familyViewModel.currentRelationship) {
      Alert.alert('Error', 'No active relationship');
      return;
    }

    // Determine MIME type from file extension if type is missing or incomplete
    // Prepare all files with base64 data (View layer responsibility)
    setUploadProgress(10);

    const filesData = [];
    const filesToProcess = selectedFiles.slice(0, 5);

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const sf = filesToProcess[i];

        // Determine type
        let type: string | undefined = sf.type;
        const fileName = (sf.fileName || sf.uri || '').toLowerCase();
        if (!type || type === 'application/octet-stream' || !type.includes('/')) {
          if (fileName.endsWith('.png')) type = 'image/png';
          else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) type = 'image/jpeg';
          else if (fileName.endsWith('.mp4')) type = 'video/mp4';
          else {
            const uriExt = sf.uri.split('.').pop()?.toLowerCase();
            if (uriExt === 'png') type = 'image/png';
            else if (uriExt === 'jpg' || uriExt === 'jpeg') type = 'image/jpeg';
            else if (uriExt === 'mp4') type = 'video/mp4';
            else if (type?.startsWith('image')) type = 'image/jpeg';
            else if (type?.startsWith('video')) type = 'video/mp4';
            else type = 'image/jpeg';
          }
        }

        // Read file as base64 (View layer handles platform-specific file reading)
        const base64 = await FileSystem.readAsStringAsync(sf.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        filesData.push({
          base64,
          type: type!,
          name: sf.fileName || 'upload',
          size: sf.size || 0,
        });

        // Update progress during file reading
        setUploadProgress(10 + Math.round((i + 1) / filesToProcess.length * 40));
      }

      // Upload files as memory - groups multiple files under one memory entry
      await familyViewModel.uploadMultipleMediaAsMemory(
        filesData,
        caption || undefined
      );

      if (!familyViewModel.errorMessage) {
        setUploadProgress(100);
        // Navigate back after success
        setTimeout(() => {
          router.back();
        }, 1500);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to read files');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Upload Memory"
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
        {selectedFiles.length === 0 ? (
          <View style={styles.uploadOptions}>
            <ThemedText style={styles.instruction}>
              Select photos or videos to add to your family album
            </ThemedText>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={handlePickFromLibrary}
              >
                <ThemedText style={styles.optionTitle}>
                  📱 Choose from Library
                </ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Select from your device storage
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={handleTakePhoto}
              >
                <ThemedText style={styles.optionTitle}>
                  📷 Take a Photo
                </ThemedText>
                <ThemedText style={styles.optionDescription}>
                  Capture a new photo with camera
                </ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <ThemedText style={styles.infoTitle}>File Requirements:</ThemedText>
              <ThemedText style={styles.infoBullet}>
                • Formats: JPG, PNG, MP4
              </ThemedText>
              <ThemedText style={styles.infoBullet}>
                • Max size: 10MB for photos, 50MB for videos
              </ThemedText>
              <ThemedText style={styles.infoBullet}>• Max 5 files per upload</ThemedText>
            </View>
          </View>
        ) : (
          <View style={styles.previewSection}>
            <ThemedText type="subtitle">Preview ({selectedFiles.length}/5)</ThemedText>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 16 }}>
              {selectedFiles.map((f, idx) => (
                <Image key={f.uri + idx} source={{ uri: f.uri }} style={styles.previewThumb} />
              ))}
            </ScrollView>

            <View style={styles.captionSection}>
              <ThemedText style={styles.label}>Add Caption (Optional)</ThemedText>
              <TextInput
                style={styles.captionInput}
                placeholder="Add a note or caption..."
                placeholderTextColor="#999"
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={500}
              />
              <ThemedText style={styles.characterCount}>
                {caption.length}/500
              </ThemedText>
            </View>

            <View style={styles.buttonGroup}>
              <Button
                title="Clear Selection"
                onPress={() => setSelectedFiles([])}
                variant="outline"
              />
              <Button
                title={isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
                onPress={handleUpload}
                disabled={isUploading}
                loading={isUploading}
                variant="primary"
              />
            </View>

            {uploadProgress > 0 && (
              <View style={styles.progressSection}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${uploadProgress}%` },
                    ]}
                  />
                </View>
                <ThemedText style={styles.progressText}>
                  {uploadProgress}%
                </ThemedText>
              </View>
            )}
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
  content: {
    flex: 1,
    padding: 16,
  },
  uploadOptions: {
    marginVertical: 16,
  },
  instruction: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#9DE2D0',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  optionDescription: {
    fontSize: 14,
    color: '#687076',
  },
  infoBox: {
    backgroundColor: '#F0F8F6',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#9DE2D0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 13,
    color: '#687076',
    marginBottom: 6,
  },
  previewSection: {
    marginVertical: 16,
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    marginVertical: 16,
  },
  previewThumb: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#F5F5F5',
  },
  fileName: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 20,
  },
  captionSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#11181C',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'right',
  },
  buttonGroup: {
    gap: 12,
    marginVertical: 24,
  },
  progressSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#9DE2D0',
  },
  progressText: {
    fontSize: 14,
    color: '#687076',
  },
});
