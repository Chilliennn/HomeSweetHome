import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
type ChipVariant = 'filled' | 'outlined';

interface ChipProps {
  /** Text to display in the chip */
  label: string;
  /** Visual variant */
  variant?: ChipVariant;
  /** Background color (for filled) or border color (for outlined) */
  color?: string;
  /** Text color */
  textColor?: string;
  /** Size of the chip */
  size?: 'small' | 'medium';
  /** Custom container style */
  style?: ViewStyle;
  /** Custom text style */
  textStyle?: TextStyle;
}

// ============================================================================
// DEFAULT COLORS - matches app theme
// ============================================================================
const CHIP_COLORS = {
  teal: '#9DE2D0',
  purple: '#C8ADD6',
  yellow: '#FADE9F',
  green: '#D4E5AE',
  coral: '#EB8F80',
  gray: '#E0E0E0',
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Chip - A compact element for tags, interests, or categories
 * 
 * Usage:
 * ```tsx
 * <Chip label="Cooking" color="#9DE2D0" />
 * <Chip label="Gardening" variant="outlined" color="#C8ADD6" />
 * ```
 */
export const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'filled',
  color = CHIP_COLORS.teal,
  textColor,
  size = 'medium',
  style,
  textStyle,
}) => {
  const isFilled = variant === 'filled';
  const defaultTextColor = isFilled ? '#333333' : color;

  return (
    <View
      style={[
        styles.container,
        size === 'small' && styles.containerSmall,
        isFilled
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          size === 'small' && styles.labelSmall,
          { color: textColor || defaultTextColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 12,
  },
});

export default Chip;
