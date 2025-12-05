import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  NotificationBell,
  Button,
  ProfileCard,
  JourneyProgressDropdown,
  BottomTabBar,
  TabItem,
} from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ElderlyProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  avatarEmoji?: string;
  avatarColor?: string;
  interests: Array<{ label: string; color?: string }>;
}

interface BrowseElderlyProps {
  /** Notification count */
  notificationCount?: number;
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
  /** List of elderly profiles to display */
  elderlyProfiles?: ElderlyProfile[];
  /** Total count of available elders */
  totalElderCount?: number;
}

// ============================================================================
// MOCK DATA - For UI demonstration
// ============================================================================
const MOCK_ELDERLY_PROFILES: ElderlyProfile[] = [
  {
    id: '1',
    name: 'Ah Ma Mei',
    age: 68,
    location: 'Penang',
    avatarEmoji: '👵',
    avatarColor: '#C8ADD6',
    interests: [
      { label: 'Cooking', color: '#9DE2D0' },
      { label: 'Gardening', color: '#D4E5AE' },
    ],
  },
  {
    id: '2',
    name: 'Uncle Tan',
    age: 72,
    location: 'Kuala Lumpur',
    avatarEmoji: '👴',
    avatarColor: '#9DE2D0',
    interests: [
      { label: 'Chess', color: '#9DE2D0' },
      { label: 'Tai Chi', color: '#EB8F80' },
    ],
  },
  {
    id: '3',
    name: 'Puan Fatimah',
    age: 65,
    location: 'Johor Bahru',
    avatarEmoji: '👵',
    avatarColor: '#FADE9F',
    interests: [
      { label: 'Baking', color: '#EB8F80' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
  },
  {
    id: '4',
    name: 'Harrison Wong',
    age: 90,
    location: 'Kuala Lumpur',
    avatarEmoji: '👳',
    avatarColor: '#D4E5AE',
    interests: [
      { label: 'Music', color: '#FADE9F' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
  },
  {
    id: '5',
    name: 'Marion',
    age: 80,
    location: 'Johor Bahru',
    avatarEmoji: '👵',
    avatarColor: '#FADE9F',
    interests: [
      { label: 'Planting', color: '#EB8F80' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
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
 * BrowseElderly - Main screen for youth to browse available elderly profiles
 * 
 * Features:
 * - Notification bell with badge
 * - Filter button
 * - Collapsible journey progress dropdown
 * - Scrollable list of elderly profile cards
 * - Bottom tab navigation bar
 * 
 * Usage:
 * ```tsx
 * <BrowseElderly
 *   notificationCount={3}
 *   onProfilePress={(id) => navigateToProfile(id)}
 *   onFilterPress={() => openFilterModal()}
 * />
 * ```
 */
export const BrowseElderly: React.FC<BrowseElderlyProps> = ({
  notificationCount = 1,
  onNotificationPress,
  onFilterPress,
  onProfilePress,
  onLearnMorePress,
  onTabPress,
  activeTab = 'matching',
  currentJourneyStep = 1,
  elderlyProfiles = MOCK_ELDERLY_PROFILES,
  totalElderCount,
}) => {
  const displayCount = totalElderCount ?? elderlyProfiles.length;

  const handleTabPress = (key: string) => {
    // Ignore press on disabled tabs
    if (DISABLED_TABS.includes(key)) {
      return;
    }
    onTabPress?.(key);
  };

  const renderProfileCard = ({ item }: { item: ElderlyProfile }) => (
    <ProfileCard
      key={item.id}
      name={item.name}
      age={item.age}
      location={item.location}
      avatarEmoji={item.avatarEmoji}
      avatarColor={item.avatarColor}
      interests={item.interests}
      onPress={() => onProfilePress?.(item.id)}
      style={styles.profileCard}
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header Section */}
      <View style={styles.header}>
        <NotificationBell
          count={notificationCount}
          onPress={onNotificationPress}
          size={48}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Find Your Grandparent</Text>
        <Text style={styles.subtitle}>
          {displayCount} elders available near you
        </Text>
      </View>

      {/* Journey Progress Dropdown */}
      <View style={styles.journeySection}>
        <JourneyProgressDropdown
          currentStep={currentJourneyStep}
          currentDescription="Browse elders to find your match"
          nextDescription="Choose & chat anonymously for 7-14 days"
          onLearnMore={onLearnMorePress}
        />
      </View>

      {/* Profile List */}
      <FlatList
        data={elderlyProfiles}
        renderItem={renderProfileCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  profileCard: {
    marginBottom: 0,
  },
  separator: {
    height: 12,
  },
});

export default BrowseElderly;