import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { IconCircle } from './IconCircle';

// ============================================================================
// TYPES
// ============================================================================
type NotificationType = 'interest_sent' | 'interest_declined' | 'interest_accepted' | 'message' | 'reminder' | 'system';

interface NotificationItemProps {
  /** Type of notification - determines icon and color */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message - can include name highlight */
  message: string;
  /** Name to highlight in bold within the message */
  highlightName?: string;
  /** Time since notification (e.g., "2 hours ago", "Just Now") */
  timestamp: string;
  /** Whether to show arrow indicator (for actionable notifications) */
  showArrow?: boolean;
  /** Callback when notification is pressed */
  onPress?: () => void;
  /** Custom container style */
  style?: ViewStyle;
}

// ============================================================================
// NOTIFICATION CONFIG
// ============================================================================
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  interest_sent: { icon: '💕', color: '#9DE2D0' },
  interest_declined: { icon: '✕', color: '#C8ADD6' },
  interest_accepted: { icon: '✓', color: '#9DE2D0' },
  message: { icon: '💬', color: '#9DE2D0' },
  reminder: { icon: '⏰', color: '#FADE9F' },
  system: { icon: 'ℹ️', color: '#E0E0E0' },
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * NotificationItem - A card for displaying notification in a list
 * 
 * Usage:
 * ```tsx
 * <NotificationItem
 *   type="interest_accepted"
 *   title="Interest Accepted"
 *   message="Ah Ma Mei has accepted your interest. You can now continue getting to know each other."
 *   highlightName="Ah Ma Mei"
 *   timestamp="Just Now"
 *   showArrow={true}
 *   onPress={() => handleNotificationPress()}
 * />
 * ```
 */
export const NotificationItem: React.FC<NotificationItemProps> = ({
  type,
  title,
  message,
  highlightName,
  timestamp,
  showArrow = false,
  onPress,
  style,
}) => {
  const config = NOTIFICATION_CONFIG[type];

  // Render message with highlighted name
  const renderMessage = () => {
    if (!highlightName) {
      return <Text style={styles.message}>{message}</Text>;
    }

    const parts = message.split(highlightName);
    return (
      <Text style={styles.message}>
        {parts[0]}
        <Text style={styles.highlightName}>{highlightName}</Text>
        {parts[1]}
      </Text>
    );
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      {/* Icon */}
      <IconCircle
        icon={config.icon}
        size={56}
        backgroundColor={config.color}
        contentScale={0.45}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {renderMessage()}
        <Text style={styles.timestamp}>{timestamp}</Text>
      </View>

      {/* Arrow (optional) */}
      {showArrow && (
        <Text style={styles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 4,
  },
  highlightName: {
    fontWeight: '700',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 28,
    color: '#999',
    marginLeft: 8,
    alignSelf: 'center',
  },
});

export default NotificationItem;
