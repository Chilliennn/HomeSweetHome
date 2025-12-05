import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

// ============================================================================
// TYPES
// ============================================================================
type TimelineStatus = 'completed' | 'current' | 'pending';

interface TimelineItemProps {
  /** Icon or emoji to display */
  icon?: string;
  /** Title of the timeline step */
  title: string;
  /** Subtitle or timestamp */
  subtitle: string;
  /** Status of this step */
  status: TimelineStatus;
  /** Whether to show connecting line below */
  showLine?: boolean;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// STATUS COLORS
// ============================================================================
const STATUS_COLORS = {
  completed: {
    background: '#D4E5AE',
    text: '#4A7C23',
    icon: '✓',
  },
  current: {
    background: '#FADE9F',
    text: '#8B7C3B',
    icon: '⏳',
  },
  pending: {
    background: '#E8E8E8',
    text: '#888888',
    icon: '○',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * TimelineItem - A step in a timeline/progress flow
 * 
 * Usage:
 * ```tsx
 * <TimelineItem
 *   icon="✓"
 *   title="Application Submitted"
 *   subtitle="Just now"
 *   status="completed"
 *   showLine
 * />
 * <TimelineItem
 *   icon="⏳"
 *   title="Admin Review"
 *   subtitle="24-48 hours"
 *   status="current"
 *   showLine
 * />
 * <TimelineItem
 *   title="Elderly Review"
 *   subtitle="After admin approval"
 *   status="pending"
 * />
 * ```
 */
export const TimelineItem: React.FC<TimelineItemProps> = ({
  icon,
  title,
  subtitle,
  status,
  showLine = true,
  style,
}) => {
  const colors = STATUS_COLORS[status];
  const displayIcon = icon || colors.icon;

  return (
    <View style={[styles.container, style]}>
      {/* Icon Circle */}
      <View style={styles.iconColumn}>
        <View style={[styles.iconCircle, { backgroundColor: colors.background }]}>
          <Text style={[styles.iconText, { color: colors.text }]}>
            {displayIcon}
          </Text>
        </View>
        {showLine && <View style={styles.line} />}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    minHeight: 60,
  },
  iconColumn: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 14,
    fontWeight: '600',
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
});

export default TimelineItem;
