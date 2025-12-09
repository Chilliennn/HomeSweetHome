import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface FeatureCheckItemProps {
  /** Feature label */
  label: string;
  /** Whether the feature is checked/unlocked */
  checked?: boolean;
  /** Check circle color */
  checkColor?: string;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * FeatureCheckItem - A simple checklist item with checkmark circle
 * 
 * Usage:
 * ```tsx
 * <FeatureCheckItem label="Real Identity Revealed" checked />
 * <FeatureCheckItem label="Video Calls" checked checkColor="#9DE2D0" />
 * <FeatureCheckItem label="Photo Sharing" checked />
 * ```
 */
export const FeatureCheckItem: React.FC<FeatureCheckItemProps> = ({
  label,
  checked = true,
  checkColor = '#D4E5AE',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.checkCircle, { backgroundColor: checkColor }]}>
        {checked && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A7C23',
  },
  label: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
});

export default FeatureCheckItem;
