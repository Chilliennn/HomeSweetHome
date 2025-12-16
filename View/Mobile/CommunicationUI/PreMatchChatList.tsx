import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'expo-router';
import { communicationViewModel } from '@home-sweet-home/viewmodel';
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

  const currentUserId = vm.currentUser;
  const currentUserType = vm.currentUserType;

  // Tab navigation hook
  const { handleTabPress } = useTabNavigation('chat');

  // Pull-to-refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Load chats on mount (only once)
  useEffect(() => {
    if (!currentUserId || !currentUserType) {
      Alert.alert('Error', 'User not logged in');
      return;
    }

    // Load active chats (ViewModel uses internal currentUser)
    vm.loadActiveChats();
  }, [currentUserId, currentUserType]);

  // Manual refresh handler
  const handleRefresh = async () => {
    if (!currentUserId || !currentUserType) {
      return;
    }

    setRefreshing(true);
    try {
      await vm.refreshChats();
    } catch (error) {
      console.error('[PreMatchChatList] Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handler: Open chat
  const handleChat = (applicationId: string) => {
    router.push(`/(main)/chat?applicationId=${applicationId}`);
  };

  // Handler: View application details - navigate to decision screen
  const handleViewDetails = (applicationId: string) => {
    router.push({ pathname: '/pre-match-decision', params: { applicationId } } as any);
  };

  // Handler: End pre-match - navigate to end confirmation
  const handleEnd = (applicationId: string) => {
    router.push({ pathname: '/end-pre-match', params: { applicationId } } as any);
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

    // Check if this is youth or elderly side
    const isYouth = currentUserType === 'youth';
    const isElderly = currentUserType === 'elderly';

    // Check application status for elderly side
    // When youth submits formal application, status becomes 'pending_ngo_review'
    const isPendingReview = application.status === 'pending_ngo_review';
    const isBothAccepted = application.status === 'both_accepted';

    // For elderly: lock chat when youth has submitted formal application
    const isChatLocked = isElderly && isPendingReview;

    return (
      <Card style={styles.chatCard}>
        {/* Header with Avatar and Name */}
        <View style={styles.cardHeader}>
          <IconCircle
            icon={partner.profile_data?.avatar_meta?.type === 'default' ? (isYouth ? '👵' : '🧑') : '👤'}
            size={64}
            backgroundColor={isYouth ? '#C8ADD6' : '#B8D4E3'}
            contentScale={0.6}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{partner.full_name || 'Partner'}</Text>
            <View style={styles.badgeRow}>
              {isChatLocked ? (
                <>
                  <View style={[styles.onlineIndicator, { backgroundColor: '#FF9800' }]} />
                  <Text style={[styles.onlineText, { color: '#FF9800' }]}>Application Pending</Text>
                </>
              ) : (
                <>
                  <View style={styles.onlineIndicator} />
                  <Text style={styles.onlineText}>Online</Text>
                </>
              )}
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
              {isChatLocked
                ? '⏳ Waiting for review...'
                : canApply
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

        {/* Elderly: Pending Review Message */}
        {isChatLocked && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingIcon}>📋</Text>
            <View style={styles.pendingTextContainer}>
              <Text style={styles.pendingTitle}>Formal Application Submitted</Text>
              <Text style={styles.pendingSubtext}>
                {partner.full_name || 'The youth'} has submitted a formal adoption application.
                Please review it in your notifications.
              </Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {/* Chat Button - disabled for elderly if pending review */}
          <Button
            title={isChatLocked ? 'Chat Locked' : 'Chat'}
            onPress={() => handleChat(application.id)}
            variant="primary"
            style={styles.chatButton}
            disabled={isChatLocked}
          />

          {/* Youth side: View Details or End button */}
          {isYouth && (
            canApply ? (
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
            )
          )}

          {/* Elderly side: Review button if pending */}
          {isElderly && isPendingReview && (
            <Button
              title="Review"
              onPress={() => router.push({ pathname: '/review-application', params: { applicationId: application.id } } as any)}
              variant="secondary"
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
      <FlatList
        data={vm.activePreMatchChats}
        renderItem={renderPreMatchCard}
        keyExtractor={(item) => item.application.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#9DE2D0']}
            tintColor="#9DE2D0"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No active chats yet</Text>
            <Text style={styles.emptySubtext}>
              When elderly users accept your interest, your chat will appear here
            </Text>
          </View>
        }
      />

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
  pendingBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  pendingIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  pendingTextContainer: {
    flex: 1,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    marginBottom: 4,
  },
  pendingSubtext: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
});

export default PreMatchChatList;
