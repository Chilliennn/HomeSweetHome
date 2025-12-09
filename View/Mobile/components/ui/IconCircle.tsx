import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { Image } from 'expo-image';

// ============================================================================
// TYPES
// ============================================================================
interface IconCircleProps {
  /** Emoji to display in the center */
  icon?: string;
  /** Image source (local require or URI) */
  imageSource?: ImageSourcePropType;
  /** Size of the circle (diameter) */
  size?: number;
  /** Background color of the circle */
  backgroundColor?: string;
  /** Scale of the image/icon relative to circle size (0-2, default varies) */
  contentScale?: number;
  /** Whether this circle is currently selected */
  selected?: boolean;
  /** Color of the selection border and checkmark badge */
  selectionColor?: string;
  /** Width of the selection border */
  selectionBorderWidth?: number;
  /** Callback when the circle is pressed */
  onPress?: () => void;
  /** Whether the press is disabled */
  disabled?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * IconCircle - A versatile circular component for displaying icons, emojis, or images
 * 
 * Features:
 * - Supports both emoji and image sources
 * - Customizable content scale for images
 * - Optional selection effect with border and checkmark badge
 * - Optional press handling for interactive use
 * 
 * Usage:
 * ```tsx
 * // Simple icon display
 * <IconCircle icon="👋" size={80} backgroundColor="#9DE2D0" />
 * 
 * // Image with custom scale
 * <IconCircle 
 *   imageSource={require('./avatar.png')} 
 *   size={72} 
 *   contentScale={0.7}
 * />
 * 
 * // Selectable avatar
 * <IconCircle
 *   imageSource={avatarImage}
 *   size={72}
 *   selected={isSelected}
 *   selectionColor="#EB8F80"
 *   onPress={() => setSelected(true)}
 * />
 * ```
 */
export const IconCircle: React.FC<IconCircleProps> = ({
  icon,
  imageSource,
  size = 80,
  backgroundColor = '#7ECEC5',
  contentScale,
  selected = false,
  selectionColor = '#EB8F80',
  selectionBorderWidth = 3,
  onPress,
  disabled = false,
  style,
}) => {
  // Default scales: image = 0.7, emoji = 0.4 (legacy behavior for emoji)
  // For images that should overflow (like the old 1.5x), use contentScale > 1
  const effectiveScale = contentScale ?? (imageSource ? 0.7 : 0.4);
  const contentSize = size * effectiveScale;

  const circleContent = (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
          borderWidth: selectionBorderWidth,
          borderColor: selected ? selectionColor : 'transparent',
          overflow: effectiveScale > 1 ? 'visible' : 'hidden',
        },
        style,
      ]}
    >
      {icon && (
        <Text style={[styles.icon, { fontSize: contentSize }]}>
          {icon}
        </Text>
      )}
      {imageSource && (
        <Image
          source={imageSource}
          style={{ width: contentSize, height: contentSize }}
          contentFit="contain"
        />
      )}

      {/* Selection checkmark badge */}
      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: selectionColor }]}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>
      )}
    </View>
  );

  // Wrap in TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {circleContent}
      </TouchableOpacity>
    );
  }

  return circleContent;
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  icon: {
    textAlign: 'center',
  },
  checkBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkIcon: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});

export default IconCircle;