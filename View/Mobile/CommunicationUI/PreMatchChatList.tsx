import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NotificationBell,
  BottomTabBar,
  TabItem,
} from '@/components/ui';
import { PreMatchCard } from '@/components/ui/PreMatchCard';

// ============================================================================
// TYPES
// ============================================================================
interface PreMatchStats {
  currentDay: number;
  totalDays: number;
  messagesExchanged: number;
  voiceCalls: number;
  daysUntilCanApply: number;
  daysRemaining: number;
  canApply: boolean;
}

interface PreMatch {
  id: string;
  name: string;
  avatarEmoji?: string;
  avatarColor?: string;
  isOnline?: boolean;
  stats: PreMatchStats;
}

interface PreMatchChatListProps {
  /** List of pre-matches to display */
  preMatches?: PreMatch[];
  /** Notification count */
  notificationCount?: number;
  /** Called when notification bell is pressed */
  onNotificationPress?: () => void;
  /** Called when Chat button is pressed */
  onChat?: (preMatchId: string) => void;
  /** Called when View Details button is pressed */
  onViewDetails?: (preMatchId: string) => void;
  /** Called when End button is pressed */
  onEnd?: (preMatchId: string) => void;
  /** Called when a tab is pressed */
  onTabPress?: (tabKey: string) => void;
  /** Current active tab */
  activeTab?: string;
}

// ============================================================================
// MOCK DATA - For UI demonstration
// ============================================================================
const MOCK_PRE_MATCHES: PreMatch[] = [
  {
    id: '1',
    name: 'Ah Ma Mei',
    avatarEmoji: '👵',
    avatarColor: '#D4E5AE',
    isOnline: true,
    stats: {
      currentDay: 8,
      totalDays: 14,
      messagesExchanged: 23,
      voiceCalls: 2,
      daysUntilCanApply: 0,
      daysRemaining: 6,
      canApply: true,
    },
  },
  {
    id: '2',
    name: 'Uncle Tan',
    avatarEmoji: '👴',
    avatarColor: '#C8ADD6',
    isOnline: true,
    stats: {
      currentDay: 3,
      totalDays: 14,
      messagesExchanged: 12,
      voiceCalls: 0,
      daysUntilCanApply: 4,
      daysRemaining: 11,
      canApply: false,
    },
  },
];

// Default tabs for bottom navigation
const TABS: TabItem[] = [
  { key: 'matching', icon: '👥', label: 'Matching' },
  { key: 'journey', icon: '📖', label: 'Journey' },
  { key: 'gallery', icon: '🖼️', label: 'Gallery' },
  { key: 'chat', icon: '💬', label: 'Chat' },
  { key: 'settings', icon: '⚙️', label: 'Settings' },
];

// Tabs that are disabled (no function yet)
const DISABLED_TABS = ['journey', 'gallery'];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * PreMatchChatList - Screen showing list of active pre-match conversations
 * 
 * Features:
 * - Notification bell with badge
 * - "Pre-Match Chat" title
 * - List of PreMatchCards
 * - Bottom tab navigation
 * 
 * ViewModel bindings needed:
 * - preMatches: PreMatch[] (from CommunicationViewModel.preMatches)
 * - onChat: (id) => void (navigates to chat screen)
 * - onViewDetails: (id) => void (navigates to application form when ready)
 * - onEnd: (id) => void (triggers end pre-match confirmation)
 * 
 * Usage:
 * ```tsx
 * <PreMatchChatList
 *   preMatches={communicationViewModel.preMatches}
 *   onChat={(id) => navigateToChat(id)}
 *   onViewDetails={(id) => navigateToApplication(id)}
 *   onEnd={(id) => showEndConfirmation(id)}
 * />
 * ```
 */
export const PreMatchChatList: React.FC<PreMatchChatListProps> = ({
  preMatches = MOCK_PRE_MATCHES,
  notificationCount = 1,
  onNotificationPress,
  onChat,
  onViewDetails,
  onEnd,
  onTabPress,
  activeTab = 'chat',
}) => {
  const handleTabPress = (key: string) => {
    if (DISABLED_TABS.includes(key)) {
      return;
    }
    onTabPress?.(key);
  };

  const renderPreMatchCard = ({ item }: { item: PreMatch }) => (
    <PreMatchCard
      id={item.id}
      name={item.name}
      avatarEmoji={item.avatarEmoji}
      avatarColor={item.avatarColor}
      isOnline={item.isOnline}
      stats={item.stats}
      onChat={() => onChat?.(item.id)}
      onViewDetails={() => onViewDetails?.(item.id)}
      onEnd={() => onEnd?.(item.id)}
      style={styles.preMatchCard}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={notificationCount}
          onPress={onNotificationPress}
          size={48}
        />
        <Text style={styles.headerTitle}>Pre-Match Chat</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Divider */}
      <View style={styles.headerDivider} />

      {/* Pre-Match List */}
      <FlatList
        data={preMatches}
        renderItem={renderPreMatchCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active pre-matches</Text>
            <Text style={styles.emptySubtext}>
              Express interest in elderly profiles to start chatting
            </Text>
          </View>
        }
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={TABS}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        disabledTabs={DISABLED_TABS}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  headerDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  preMatchCard: {
    marginBottom: 0,
  },
  separator: {
    height: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default PreMatchChatList;
