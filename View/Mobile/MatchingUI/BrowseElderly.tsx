import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { observer } from 'mobx-react-lite';
import { youthMatchingViewModel, communicationViewModel } from '@home-sweet-home/viewmodel';
import { User } from '@home-sweet-home/model';
import { useTabNavigation, getAvatarDisplay } from '@/hooks';
import {
  NotificationBell,
  JourneyProgressDropdown,
  BottomTabBar,
  DEFAULT_TABS,
  Card,
  IconCircle,
  Chip,
  LoadingSpinner,
} from '@/components/ui';
import { Colors } from '@/constants/theme';
import { FilterModal } from './FilterModal';

interface BrowseElderlyProps {
  /** Called when notification bell is pressed */
  onNotificationPress?: () => void;
  /** Called when filter button is pressed */
  onFilterPress?: () => void;
  /** Called when an elderly profile is selected */
  onProfilePress?: (profileId: string) => void;
  /** Called when "Learn more" about journey is pressed */
  onLearnMorePress?: () => void;
  /** Called when a tab is pressed */
  onTabPress?: (tabKey: string) => void;
  /** Current active tab */
  activeTab?: string;
  /** Current journey step (1-4) */
  currentJourneyStep?: number;
  /** Optional fallback count if not loading from VM */
  notificationCount?: number;
}

// Tabs that are disabled (no function yet)
const DISABLED_TABS = ['diary', 'memory'];

// FIXED: Helper to map User -> Display Data with proper avatar handling
const mapUserToProfile = (user: User) => {
  // Priority: profile_photo_url (real photo) > preset avatar from avatar_meta
  const hasRealPhoto = !!user.profile_photo_url;
  // Use user's actual user_type to get correct emoji/image arrays
  // Filter out 'admin' type and cast to 'youth' | 'elderly'
  const userTypeForAvatar: 'youth' | 'elderly' = 
    user.user_type === 'youth' || user.user_type === 'elderly' 
      ? user.user_type 
      : 'elderly';
  
  const avatarConfig = hasRealPhoto 
    ? { icon: undefined, imageSource: { uri: user.profile_photo_url! }, backgroundColor: '#9DE2D0' }
    : getAvatarDisplay(user.profile_data, userTypeForAvatar);
  
  return {
    id: user.id,
    name: user.full_name || 'Anonymous',  // FIXED: Only use full_name
    age: user.profile_data?.verified_age || '60+',
    location: user.location || 'Unknown',
    // Avatar properties: real photo OR preset avatar
    avatarIcon: avatarConfig.icon,
    avatarImageSource: avatarConfig.imageSource,
    avatarColor: avatarConfig.backgroundColor,
    interests: (user.profile_data?.interests || []).map(i => ({ label: i, color: Colors.light.secondary })),
  };
};

export const BrowseElderly: React.FC<BrowseElderlyProps> = observer(({
  onNotificationPress,
  onFilterPress,
  onProfilePress,
  onLearnMorePress,
  onTabPress,
  activeTab: propActiveTab,
  currentJourneyStep = 1,
  notificationCount: propNotificationCount,
}) => {
  const vm = youthMatchingViewModel;
  // ✅ MVVM: Get userId from ViewModel (synced by Layout from authViewModel)
  const currentUserId = vm.currentUserId;

  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Use activeTab from prop or default to 'matching'
  const activeTab = propActiveTab || 'matching';

  // Use tab navigation hook
  const { handleTabPress: hookHandleTabPress } = useTabNavigation(activeTab);

  useEffect(() => {
    console.log('🟦 [BrowseElderly] useEffect triggered, currentUserId:', currentUserId);
    
    if (currentUserId) {
      console.log('✅ [BrowseElderly] UserId available, ViewModel will handle profile loading');
      vm.loadNotifications(currentUserId);
    } else {
      console.log('⏳ [BrowseElderly] Waiting for userId...');
    }
    
    return () => {
      vm.dispose();
    }
  }, [currentUserId]);

  const handleTabPress = (key: string) => {
    if (DISABLED_TABS.includes(key)) {
      return;
    }
    // Use custom handler if provided, otherwise use hook
    if (onTabPress) {
      onTabPress(key);
    } else {
      hookHandleTabPress(key);
    }
  };

  // Count active filters
  const activeFilterCount = Object.keys(vm.filters).filter(key => {
    const value = (vm.filters as any)[key];
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  const notificationCount = propNotificationCount ?? vm.unreadNotificationCount;

  const renderProfileCard = ({ item }: { item: User }) => {
    const profile = mapUserToProfile(item);
    const hasExpressed = vm.hasExpressedInterest(item.id);

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.profileCardWrapper}
        activeOpacity={hasExpressed ? 1 : 0.7}
        onPress={() => !hasExpressed && onProfilePress?.(item.id)}
        disabled={hasExpressed}
      >
        <Card style={[styles.cardContainer, hasExpressed && styles.cardDisabled]}>
          {/* Avatar - FIXED: Uses proper avatar from profile */}
          <IconCircle
            icon={profile.avatarIcon}
            imageSource={profile.avatarImageSource}
            size={64}
            backgroundColor={profile.avatarColor}
            contentScale={0.65}
          />

          {/* Info */}
          <View style={styles.cardInfoContainer}>
            <Text style={[styles.cardName, hasExpressed && styles.textDisabled]}>{profile.name}
              {hasExpressed && (
                <View style={styles.expressedBadge}>
                  <Text style={styles.expressedText}>✓ Interest Sent</Text>
                </View>
              )}
            </Text>
            {/* Expressed Badge */}
            <Text style={[styles.cardDetails, hasExpressed && styles.textDisabled]}>
              {profile.age} years • {profile.location}
            </Text>

            {/* Interest Tags */}
            {profile.interests.length > 0 && (
              <View style={styles.tagsContainer}>
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest.label}
                    color={interest.color}
                    size="small"
                  />
                ))}
              </View>
            )}

          </View>

          {/* Arrow or Check */}
          <Text style={[styles.arrow, hasExpressed && styles.textDisabled]}>
            {hasExpressed ? '✓' : '›'}
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  if (vm.isLoading && vm.profiles.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header Section */}
      <View style={styles.header}>
        <NotificationBell
          count={notificationCount}
          onPress={onNotificationPress}
          size={48}
        />
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterModal(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.filterText}>
            Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Find Your Grandparent</Text>
        <Text style={styles.subtitle}>
          {vm.profiles.length} of {vm.totalProfileCount} elders
        </Text>
      </View>

      {/* Journey Progress Dropdown */}
      <View style={styles.journeySection}>
        <JourneyProgressDropdown
          currentStep={communicationViewModel.currentJourneyStep}
          currentDescription="Browse elders to find your match"
          nextDescription="Choose & chat anonymously for 7-14 days"
          onLearnMore={onLearnMorePress}
        />
      </View>

      {/* Profile List */}
      <FlatList
        data={vm.profiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={() => (
          <View style={styles.footerContainer}>
            {vm.hasMoreProfiles && (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={() => vm.loadMoreProfiles()}
                disabled={vm.isLoading}
              >
                {vm.isLoading ? (
                  <ActivityIndicator size="small" color={Colors.light.primary} />
                ) : (
                  <Text style={styles.loadMoreText}>Load More Elders</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(filters) => vm.setFilters(filters)}
        currentFilters={vm.filters}
      />

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab={activeTab}
        onTabPress={handleTabPress}
        disabledTabs={DISABLED_TABS}
      />
    </SafeAreaView>
  );
});

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDF5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFDF5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  filterButton: {
    backgroundColor: '#9DE2D0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  journeySection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  profileCardWrapper: {
    marginBottom: 0,
  },
  separator: {
    height: 12,
  },
  // Inlined ProfileCard Styles
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardInfoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  cardDetails: {
    fontSize: 14,
    color: Colors.light.textLight,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  arrow: {
    fontSize: 28,
    color: '#999',
    marginLeft: 8,
  },
  cardDisabled: {
    opacity: 0.6,
    backgroundColor: '#F5F5F5',
  },
  textDisabled: {
    color: '#999',
  },
  expressedBadge: {
    backgroundColor: '#D4E5AE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 1,
  },
  expressedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4A7C23',
  },
  // New styles for filter and pagination
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
  },
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadMoreButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    minWidth: 180,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});

export default BrowseElderly;