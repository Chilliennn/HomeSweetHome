import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { IconCircle } from './IconCircle';
import { Card } from './Card';
import { Button } from './Button';
import { Colors } from '@/constants/theme';

// ============================================================================
// TYPES
// ============================================================================
type NotificationType =
  | 'interest_sent'
  | 'interest_declined'
  | 'interest_accepted'
  | 'interest_received'  // NEW: For elderly receiving interest
  | 'application_submitted' // NEW: For formal application
  | 'message'
  | 'reminder'
  | 'system';

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
  /** Whether this notification is expandable (has action buttons) */
  expandable?: boolean;
  /** Expanded content - youth profile details for elderly notifications */
  expandedContent?: {
    profileName?: string;
    profileInfo?: string;
    location?: string;
    interests?: string[];
    motivation?: string;
  };
  /** Action handlers for interest notifications */
  actions?: {
    onAccept?: () => void;
    onDecline?: () => void;
    onViewProfile?: () => void;
  };
  /** Loading state for action buttons */
  isLoading?: boolean;
  /** Whether notification is read */
  isRead?: boolean;
}

// ============================================================================
// NOTIFICATION CONFIG
// ============================================================================
const NOTIFICATION_CONFIG: Record<NotificationType, { icon: string; color: string }> = {
  interest_sent: { icon: '💕', color: Colors.light.secondary }, // #9DE2D0
  interest_declined: { icon: '✕', color: '#C8ADD6' },
  interest_accepted: { icon: '✓', color: Colors.light.secondary },
  interest_received: { icon: '❤️', color: '#FDE8E8' }, // Pink for received interest
  application_submitted: { icon: '📝', color: '#E3F2FD' }, // Blue for application
  message: { icon: '💬', color: Colors.light.secondary },
  reminder: { icon: '⏰', color: Colors.light.warning }, // #FADE9F
  system: { icon: '🔔', color: '#E8F5E9' },
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * NotificationItem - A card for displaying notification in a list
 * 
 * Now supports:
 * - Expandable content with action buttons (Accept/Decline)
 * - Interest received notifications for elderly users
 * - Application submitted notifications
 * 
 * Usage:
 * ```tsx
 * <NotificationItem
 *   type="interest_received"
 *   title="Interest Received"
 *   message="Carmen Wong is interested in becoming your companion"
 *   highlightName="Carmen Wong"
 *   timestamp="2 hours ago"
 *   expandable={true}
 *   expandedContent={{
 *     profileName: "Carmen Wong",
 *     profileInfo: "25 years old",
 *     location: "Kuala Lumpur",
 *     interests: ["Cooking", "Reading"],
 *     motivation: "I would love to help..."
 *   }}
 *   actions={{
 *     onAccept: () => handleAccept(),
 *     onViewProfile: () => handleViewProfile()
 *   }}
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
  expandable = false,
  expandedContent,
  actions,
  isLoading = false,
  isRead = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.system;

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

  const handlePress = () => {
    if (expandable) {
      setIsExpanded(!isExpanded);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={onPress || expandable ? 0.7 : 1}
      disabled={!onPress && !expandable}
      style={style}
    >
      <Card style={[styles.container, !isRead && styles.unreadContainer]}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          {/* Icon */}
          <IconCircle
            icon={config.icon}
            size={50}
            backgroundColor={config.color}
            contentScale={0.45}
          />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {renderMessage()}
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>

          {/* Arrow or Expand indicator */}
          {(showArrow || expandable) && (
            <Text style={styles.arrow}>{expandable ? (isExpanded ? '▼' : '▶') : '›'}</Text>
          )}
        </View>

        {/* Expanded Content */}
        {expandable && isExpanded && expandedContent && (
          <View style={styles.expandedSection}>
            {/* Profile Section */}
            <View style={styles.profileRow}>
              <IconCircle
                icon="👤"
                size={60}
                backgroundColor={Colors.light.secondary}
              />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{expandedContent.profileName}</Text>
                <Text style={styles.profileDetails}>
                  {expandedContent.profileInfo} • {expandedContent.location}
                </Text>
              </View>
            </View>

            {/* Interests */}
            {expandedContent.interests && expandedContent.interests.length > 0 && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Interests</Text>
                <Text style={styles.value}>{expandedContent.interests.slice(0, 3).join(', ')}</Text>
              </View>
            )}

            {/* Motivation */}
            {expandedContent.motivation && (
              <View style={styles.motivationBox}>
                <Text style={styles.motivationText}>
                  "{expandedContent.motivation.substring(0, 120)}{expandedContent.motivation.length > 120 ? '...' : ''}"
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            {actions && (
              <View style={styles.actionRow}>
                {actions.onViewProfile && (
                  <Button
                    title="View Profile"
                    onPress={actions.onViewProfile}
                    variant="outline"
                    style={styles.actionButton}
                    disabled={isLoading}
                  />
                )}
                {actions.onAccept && (
                  <Button
                    title="Accept"
                    onPress={actions.onAccept}
                    variant="primary"
                    style={styles.actionButton}
                    loading={isLoading}
                    disabled={isLoading}
                  />
                )}
              </View>
            )}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 12,
  },
  unreadContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: Colors.light.textLight,
    lineHeight: 20,
    marginBottom: 4,
  },
  highlightName: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  arrow: {
    fontSize: 14,
    color: '#999',
    marginLeft: 8,
    alignSelf: 'center',
  },
  // Expanded Section
  expandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileInfo: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    textAlign: 'right',
    marginLeft: 16,
  },
  motivationBox: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  motivationText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});

export default NotificationItem;
