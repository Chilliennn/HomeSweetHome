import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { communicationViewModel, authViewModel } from '@home-sweet-home/viewmodel';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import { Card, IconCircle, NotificationBell, ProgressBar, Button } from '@/components/ui';
import { BottomTabBar, DEFAULT_TABS } from '@/components/ui/BottomTabBar';
import { Colors } from '@/constants/theme';

/**
 * PreMatchChatList - UC101_6: Pre-match chat list screen
 * 
 * Combined component with logic and UI (follows qualityAttribute.txt)
 * - Loads chat data from CommunicationViewModel
 * - Displays chat cards using reusable components from components/ui
 * - Handles navigation to individual chats
 * 
 * Architecture:
 * - Observer component (reactive to ViewModel state)
 * - Uses Card, IconCircle, ProgressBar, Button from components/ui
 * - Self-contained logic (no unnecessary separation)
 */
export const PreMatchChatList = observer(function PreMatchChatList() {
  const router = useRouter();
  const vm = communicationViewModel;
  const authVM = authViewModel;

  const currentUserId = authVM.authState.currentUserId;
  const currentUserType = authVM.userType;

  // Tab navigation hook
  const { handleTabPress } = useTabNavigation('chat');

  // Load chats on mount
  useEffect(() => {
    if (!currentUserId || !currentUserType) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    // Admin users don't have pre-match chats
    if (currentUserType === 'admin') {
      return;
    }

    // Load active chats
    vm.loadActiveChats(currentUserId, currentUserType);
  }, [currentUserId, currentUserType]);

  // Handler: Open chat
  const handleChat = (applicationId: string) => {
    router.push(`/(main)/chat?applicationId=${applicationId}`);
  };

  // Handler: View application details
  const handleViewDetails = (applicationId: string) => {
    Alert.alert('Application Details', 'View application details feature coming soon!');
  };

  // Handler: End pre-match
  const handleEnd = (applicationId: string) => {
    Alert.alert(
      'End Pre-Match',
      'Are you sure you want to end this pre-match? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: () => {
            Alert.alert('End Pre-Match', 'This feature is coming soon!');
          },
        },
      ]
    );
  };

  // Handler: Notification press
  const handleNotificationPress = () => {
    router.push('/(main)/notification' as any);
  };

  // Render pre-match card
  const renderPreMatchCard = ({ item }: { item: any }) => {
    const partner = item.partnerUser;
    const application = item.application;

    // Calculate days
    const applicationDate = new Date(application.applied_at);
    const now = new Date();
    const daysPassed = Math.floor((now.getTime() - applicationDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const daysRemaining = Math.max(0, 14 - daysPassed);
    const daysUntilCanApply = Math.max(0, 7 - daysPassed);

    // Count messages and voice calls
    const messagesExchanged = item.messages.length;
    const voiceCalls = item.messages.filter((m: any) => m.message_type === 'voice').length;
    const canApply = daysPassed >= 7;

    return (
      <Card style={styles.chatCard}>
        {/* Header with Avatar and Name */}
        <View style={styles.cardHeader}>
          <IconCircle
            icon={partner.profile_data?.avatar_meta?.type === 'default' ? '👵' : '👤'}
            size={64}
            backgroundColor="#C8ADD6"
            contentScale={0.6}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{partner.full_name || 'Partner'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.onlineIndicator} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Pre-Match Progress</Text>
            <Text style={styles.dayCounter}>{`Day ${daysPassed}/14`}</Text>
          </View>
          <ProgressBar
            progress={(daysPassed / 14) * 100}
            fillColor={canApply ? Colors.light.success : Colors.light.secondary}
            height={10}
          />
          <View style={styles.progressFooter}>
            <Text style={styles.progressSubtext}>
              {canApply
                ? '✅ Minimum period completed'
                : `${daysUntilCanApply} days until you can apply`}
            </Text>
            <Text style={styles.daysRemaining}>{daysRemaining} days left</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{messagesExchanged}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{voiceCalls}</Text>
            <Text style={styles.statLabel}>Voice Calls</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Chat"
            onPress={() => handleChat(application.id)}
            variant="primary"
            style={styles.chatButton}
          />
          {canApply ? (
            <Button
              title="View Details"
              onPress={() => handleViewDetails(application.id)}
              variant="secondary"
              style={styles.actionButton}
            />
          ) : (
            <Button
              title="End"
              onPress={() => handleEnd(application.id)}
              variant="destructive"
              style={styles.actionButton}
            />
          )}
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Pre-Match Chats</Text>
        <NotificationBell
          count={vm.unreadCount}
          onPress={handleNotificationPress}
        />
      </View>

      <View style={styles.headerDivider} />

      {/* Chat List */}
      {vm.activePreMatchChats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Active Chats</Text>
          <Text style={styles.emptySubtext}>
            Your pre-match conversations will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={vm.activePreMatchChats}
          renderItem={renderPreMatchCard}
          keyExtractor={(item) => item.application.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab="chat"
        onTabPress={handleTabPress}
        disabledTabs={['diary', 'memory']}
      />
    </SafeAreaView>
  );
});


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
  chatCard: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 13,
    color: '#4CAF50',
    marginLeft: 6,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: 20,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  dayCounter: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  progressSubtext: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  daysRemaining: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
  },
  actionButton: {
    flex: 1,
  },
});

export default PreMatchChatList;
