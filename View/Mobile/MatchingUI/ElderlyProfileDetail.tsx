import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  IconCircle,
  Chip,
  Card,
  ProfileInfoRow,
  Button,
  BottomTabBar,
  DEFAULT_TABS
} from '@/components/ui';

// ============================================================================
// TYPES
// ============================================================================
interface ElderlyDetailData {
  id: string;
  name: string;
  age: number;
  location: string;
  profilePhotoUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  isOnline?: boolean;
  interests: Array<{ label: string; color?: string }>;
  aboutMe: string;
  languages: string[];
  communicationStyle?: string[];
  availability?: string;
}

interface ElderlyProfileDetailProps {
  /** Elderly profile data */
  profile?: ElderlyDetailData;
  /** Called when back button is pressed */
  onBack?: () => void;
  /** Called when Express Interest button is pressed */
  onExpressInterest?: () => void;
  /** Called when a tab is pressed */
  onTabPress?: (tabKey: string) => void;
  /** Current active tab */
  activeTab?: string;
}

// ============================================================================
// MOCK DATA - For UI demonstration
// ============================================================================
const MOCK_PROFILE: ElderlyDetailData = {
  id: '1',
  name: 'Ah Ma Mei',
  age: 68,
  location: 'Penang',
  profilePhotoUrl: undefined,
  avatarEmoji: '👵',
  avatarColor: '#C8ADD6',
  isOnline: true,
  interests: [
    { label: 'Cooking', color: '#9DE2D0' },
    { label: 'Gardening', color: '#D4E5AE' },
    { label: 'Knitting', color: '#E0E0E0' },
  ],
  aboutMe: 'Retired teacher who loves sharing stories. Looking for a young companion to share recipes and life wisdom.',
  languages: ['Mandarin', 'English', 'Hokkien'],
  communicationStyle: ['Video Calls', 'Voice Messages'],
  availability: 'Daily, mornings preferred',
};

// Tabs that are disabled (no function yet)
const DISABLED_TABS = ['journey', 'gallery'];

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * ElderlyProfileDetail - Detailed view of an elderly profile
 * 
 * Features:
 * - Back navigation
 * - Avatar with online status
 * - Basic info (name, age, location)
 * - Interest chips
 * - Detailed info card (About Me, Languages, Communication Style, Availability)
 * - Express Interest button
 * - Bottom tab navigation
 * 
 * Usage:
 * ```tsx
 * <ElderlyProfileDetail
 *   profile={elderlyProfile}
 *   onBack={() => navigation.goBack()}
 *   onExpressInterest={() => handleExpressInterest()}
 * />
 * ```
 */
export const ElderlyProfileDetail: React.FC<ElderlyProfileDetailProps> = ({
  profile = MOCK_PROFILE,
  onBack,
  onExpressInterest,
  onTabPress,
  activeTab = 'matching',
}) => {
  const handleTabPress = (key: string) => {
    if (DISABLED_TABS.includes(key)) {
      return;
    }
    onTabPress?.(key);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          activeOpacity={0.7}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          {profile.profilePhotoUrl ? (
            <Image
              source={{ uri: profile.profilePhotoUrl }}
              style={styles.profilePhoto}
            />
          ) : (
            <IconCircle
              icon={profile.avatarEmoji}
              size={120}
              backgroundColor={profile.avatarColor}
              contentScale={0.65}
            />
          )}
        </View>

        {/* Name and Basic Info */}
        <View style={styles.basicInfoSection}>
          <Text style={styles.name}>{profile.name}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>
              {profile.age} years • {profile.location}
            </Text>
            {profile.isOnline && (
              <>
                <Text style={styles.metaDot}> • </Text>
                <View style={styles.onlineIndicator} />
                <Text style={styles.onlineText}>Online</Text>
              </>
            )}
          </View>
        </View>

        {/* Interest Tags */}
        <View style={styles.interestsSection}>
          {profile.interests.map((interest, index) => (
            <Chip
              key={index}
              label={interest.label}
              color={interest.color}
              size="medium"
            />
          ))}
        </View>

        {/* Details Card */}
        <Card style={styles.detailsCard}>
          <ProfileInfoRow
            icon="ℹ️"
            iconColor="#C8ADD6"
            title="About Me"
            content={profile.aboutMe}
          />

          {profile.location && (
            <>
              <View style={styles.divider} />
              <ProfileInfoRow
                icon="📍"
                iconColor="#C8ADD6"
                title="Location"
                content={profile.location}
              />
            </>
          )}

          {profile.languages && profile.languages.length > 0 && (
            <>
              <View style={styles.divider} />
              <ProfileInfoRow
                icon="🌐"
                iconColor="#C8ADD6"
                title="Languages"
                content={profile.languages.join(', ')}
              />
            </>
          )}

          {profile.communicationStyle && profile.communicationStyle.length > 0 && (
            <>
              <View style={styles.divider} />
              <ProfileInfoRow
                icon="💬"
                iconColor="#C8ADD6"
                title="Communication Style"
                content={profile.communicationStyle.join(', ')}
              />
            </>
          )}

          {profile.availability && (
            <>
              <View style={styles.divider} />
              <ProfileInfoRow
                icon="📅"
                iconColor="#C8ADD6"
                title="Availability"
                content={profile.availability}
              />
            </>
          )}
        </Card>

        <TouchableOpacity
          style={styles.expressInterestButton}
          onPress={onExpressInterest}
          activeOpacity={0.8}
        >
          <Text style={styles.expressInterestText}>Express Interest</Text>
        </TouchableOpacity>
      </ScrollView>
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
    color: '#000000',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  avatarSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
  },
  basicInfoSection: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 15,
    color: '#666',
  },
  metaDot: {
    fontSize: 15,
    color: '#666',
  },
  onlineIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    marginRight: 4,
  },
  onlineText: {
    fontSize: 15,
    color: '#4CAF50',
  },
  interestsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  detailsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
  },
  expressInterestButton: {
    marginHorizontal: 20,
    backgroundColor: '#EB8F80',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  expressInterestText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default ElderlyProfileDetail;
