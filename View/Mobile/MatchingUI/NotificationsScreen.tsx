import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotificationItem, IconCircle } from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
type NotificationType = 'interest_sent' | 'interest_declined' | 'interest_accepted' | 'message' | 'reminder' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  highlightName?: string;
  timestamp: string;
  isActionable?: boolean;
}

interface NotificationsScreenProps {
  /** List of notifications to display */
  notifications?: Notification[];
  /** Called when back button is pressed */
  onBack?: () => void;
  /** Called when delete all button is pressed */
  onDeleteAll?: () => void;
  /** Called when a notification is pressed */
  onNotificationPress?: (notificationId: string) => void;
}

// ============================================================================
// MOCK DATA - For UI demonstration
// ============================================================================
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'interest_sent',
    title: 'Interest Sent',
    message: 'Your interest has been send to Ah Ma Mei.',
    highlightName: 'Ah Ma Mei',
    timestamp: '2 hours ago',
    isActionable: false,
  },
  {
    id: '2',
    type: 'interest_declined',
    title: 'Interest Declined',
    message: 'Chillien Chung has declined your interest. You can browse other profiles and express new interest.',
    highlightName: 'Chillien Chung',
    timestamp: '1 hours ago',
    isActionable: false,
  },
  {
    id: '3',
    type: 'interest_accepted',
    title: 'Interest Accepted',
    message: 'Ah Ma Mei has accepted your interest. You can now continue getting to know each other.',
    highlightName: 'Ah Ma Mei',
    timestamp: 'Just Now',
    isActionable: true,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * NotificationsScreen - Screen showing list of all notifications
 * 
 * Features:
 * - Back button
 * - Delete all button
 * - List of NotificationItems
 * - Actionable notifications show arrow
 * 
 * ViewModel bindings needed:
 * - notifications: Notification[] (from NotificationViewModel)
 * - onNotificationPress: (id) => void (triggers navigation or action)
 * - onDeleteAll: () => void (clears all notifications)
 * 
 * Usage:
 * ```tsx
 * <NotificationsScreen
 *   notifications={notificationViewModel.notifications}
 *   onBack={() => navigation.goBack()}
 *   onDeleteAll={() => notificationViewModel.clearAll()}
 *   onNotificationPress={(id) => notificationViewModel.handlePress(id)}
 * />
 * ```
 */
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  notifications = MOCK_NOTIFICATIONS,
  onBack,
  onDeleteAll,
  onNotificationPress,
}) => {
  const renderNotification = ({ item }: { item: Notification }) => (
    <NotificationItem
      type={item.type}
      title={item.title}
      message={item.message}
      highlightName={item.highlightName}
      timestamp={item.timestamp}
      showArrow={item.isActionable}
      onPress={item.isActionable ? () => onNotificationPress?.(item.id) : undefined}
      style={styles.notificationItem}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDeleteAll}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>

      {/* Notification List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9DE2D0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EB8F80',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notificationItem: {
    marginBottom: 0,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default NotificationsScreen;
