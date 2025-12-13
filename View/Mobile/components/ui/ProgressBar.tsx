import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
interface ProgressBarProps {
  /** Progress value (0-100) */
  progress: number;
  /** Height of the progress bar */
  height?: number;
  /** Color of the filled portion */
  fillColor?: string;
  /** Color of the background track */
  trackColor?: string;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ProgressBar - A horizontal progress indicator
 * 
 * Usage:
 * ```tsx
 * <ProgressBar progress={70} />
 * <ProgressBar progress={50} fillColor="#9DE2D0" height={8} />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 10,
  fillColor = '#9DE2D0',
  trackColor = '#E0E0E0',
  style,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: trackColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            backgroundColor: fillColor,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});

export default ProgressBar;
