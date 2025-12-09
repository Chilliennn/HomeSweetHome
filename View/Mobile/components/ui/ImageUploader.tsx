import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface ImageUploaderProps {
  /** Currently selected image URI */
  imageUri: string | null;
  /** Callback when upload area is pressed */
  onPress: () => void;
  /** Placeholder text */
  placeholder?: string;
  /** Hint text below placeholder */
  hint?: string;
  /** Whether the uploader is disabled */
  disabled?: boolean;
  /** Custom container style */
  style?: ViewStyle;
  /** Height of the upload box (only used when no image) */
  height?: number;
  /** Shape of the uploaded image preview */
  previewShape?: 'square' | 'circle';
  /** Size of the preview image (for circle shape) */
  previewSize?: number;
  /** Border color when image is selected */
  selectedBorderColor?: string;
  /** Upload icon */
  icon?: string;
  /** Aspect ratio for square preview (width / height), e.g., 4/3, 1, 16/9 */
  aspectRatio?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ImageUploader - A reusable image upload component
 * 
 * Features:
 * - Dashed border upload area
 * - Preview of selected image
 * - Customizable placeholder text and hints
 * - Support for square or circular preview
 * 
 * Usage:
 * ```tsx
 * <ImageUploader
 *   imageUri={selectedImage}
 *   onPress={handlePickImage}
 *   placeholder="Tap to select files"
 *   hint="JPG, PNG • Max 10MB"
 *   previewShape="circle"
 * />
 * ```
 */
export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageUri,
  onPress,
  placeholder = 'Tap to select files',
  hint = 'JPG, PNG • Max 10MB',
  disabled = false,
  style,
  height = 160,
  previewShape = 'square',
  previewSize = 100,
  selectedBorderColor = '#9DE2D0',
  icon = '↑',
  aspectRatio = 4 / 3,
}) => {
  const hasImage = !!imageUri;

  return (
    <TouchableOpacity
      style={[
        styles.uploadBox,
        !hasImage && { minHeight: height },
        hasImage && { borderColor: selectedBorderColor, borderStyle: 'solid' },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {hasImage ? (
        previewShape === 'circle' ? (
          // Circle preview - fixed size, centered
          <View style={[styles.previewContainer, { paddingVertical: 16 }]}>
            <Image
              source={{ uri: imageUri }}
              style={{
                width: previewSize,
                height: previewSize,
                borderRadius: previewSize / 2,
              }}
              resizeMode="cover"
            />
            <View style={styles.changeOverlayCircle}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </View>
        ) : (
          // Square preview - aspect ratio based
          <View style={styles.squarePreviewContainer}>
            <View style={{ width: '100%', aspectRatio }}>
              <Image
                source={{ uri: imageUri }}
                style={styles.squarePreviewImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.changeOverlay}>
              <Text style={styles.changeText}>Tap to change</Text>
            </View>
          </View>
        )
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.uploadIcon}>{icon}</Text>
          <Text style={styles.uploadText}>{placeholder}</Text>
          <Text style={styles.uploadHint}>{hint}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    padding: 20,
  },
  uploadIcon: {
    fontSize: 32,
    color: '#666',
    marginBottom: 12,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  uploadHint: {
    fontSize: 12,
    color: '#999',
  },
  previewContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  squarePreviewContainer: {
    width: '100%',
    position: 'relative',
  },
  squarePreviewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeOverlayCircle: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ImageUploader;
