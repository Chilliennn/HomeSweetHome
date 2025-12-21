import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { authViewModel, settingsViewModel } from '@home-sweet-home/viewmodel';
import { SettingItem } from '../components/ui/SettingItem';
import { ToggleSettingItem } from '../components/ui/ToggleSettingItem';
import { BottomTabBar, DEFAULT_TABS, NotificationBell, IconCircle } from '../components/ui';
import { useTabNavigation, getAvatarDisplay } from '../hooks';


/**
 * Settings Screen
 * 
 * MVVM Architecture:
 * - This View only handles UI rendering and user interactions
 * - All business logic is delegated to SettingsViewModel (MobX observable)
 * - Follows the design from the mockup with proper color scheme
 * 
 * Sections:
 * - User Profile Header
 * - Account Settings
 * - Privacy & Safety
 * - Notifications
 * - Support & Help
 * - Log Out Button
 */
const SettingsScreenComponent: React.FC = () => {
  const router = useRouter();
  const { handleTabPress, userId: userIdFromParams, userName, userType } = useTabNavigation('settings');

  // ✅ Fallback: Get userId from authViewModel if not in params
  const userId = userIdFromParams || authViewModel.authState.currentUserId || undefined;

  // ✅ Add loading state
  const [isLoading, setIsLoading] = React.useState(true);

  // Load user profile data on mount
  useEffect(() => {
    const loadUserData = async () => {
      if (userId) {
        setIsLoading(true);
        // Load profile data (realIdentity, displayIdentity, etc.)
        await authViewModel.loadProfile(userId);
        // Load full user object for profile_photo_url
        await authViewModel.getCurrentUser(userId);
        // Check active relationship status for tab disabling
        await authViewModel.checkActiveRelationship(userId);
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [userId]);

  // Access observable properties from ViewModel
  const realIdentity = authViewModel.profileData.realIdentity;
  const displayIdentity = authViewModel.profileData.displayIdentity;
  const verifiedAge = authViewModel.verifiedAge;

  // ============================================================================
  // RENDER DATA
  // ============================================================================
  // ✅ MVVM: Get display data from authViewModel.currentUser (single source of truth)
  const displayName = userName || authViewModel.currentUser?.full_name || 'User';

  // ✅ Get location from database user record
  const location = authViewModel.currentUser?.location || 'Unknown';

  // ✅ Get verified age from profile_data
  const age = authViewModel.currentUser?.profile_data?.verified_age || 18;

  // Get avatar config from user's profile data
  // Priority: profile_photo_url (real photo) > preset avatar from avatar_meta
  // Use authViewModel.currentUser.profile_photo_url if available
  const hasRealPhoto = !!authViewModel.currentUser?.profile_photo_url;
  const avatarConfig = hasRealPhoto && authViewModel.currentUser
    ? {
      icon: undefined,
      imageSource: { uri: authViewModel.currentUser.profile_photo_url! },
      backgroundColor: '#9DE2D0',
    }
    : getAvatarDisplay(
      displayIdentity ? {
        avatar_meta: {
          type: displayIdentity.avatarType || 'default',
          selected_avatar_index: displayIdentity.selectedAvatarIndex ?? null,
        },
      } : null,
      (userType as 'youth' | 'elderly') || 'youth'
    );



  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleEditProfile = () => {
    console.log('[SettingsScreen] handleEditProfile - userId:', userId, 'userName:', userName, 'userType:', userType);
    router.push({
      pathname: '/(auth)/profile-setup',
      params: { userId, userName, userType, editMode: 'true' },
    });
  };

  const handleAgeVerification = () => {
    Alert.alert('Age Verification', 'Your age is verified');
  };

  const handleSafetyReports = () => {
    router.push({
      pathname: '/(main)/report-history',
      params: { userId, userName, userType },
    });
  };

  // const handleSafetyResources = () => {
  //   // TODO: Navigate to safety resources screen
  //   Alert.alert('Safety Resources', 'Guidelines & tips for staying safe');
  // };

  // const handleHelpCenter = () => {
  //   // TODO: Navigate to help center
  //   Alert.alert('Help Center', 'FAQ & guides');
  // };

  // const handleContactSupport = () => {
  //   // TODO: Navigate to contact support
  //   Alert.alert('Contact Support', 'Get help from our team');
  // };

  // const handleTermsConditions = () => {
  //   // TODO: Navigate to terms & conditions
  //   Alert.alert('Terms & Conditions', 'Legal agreements');
  // };

  // const handlePrivacyPolicy = () => {
  //   // TODO: Navigate to privacy policy
  //   Alert.alert('Privacy Policy', 'How we protect your data');
  // };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // Step 1: Sign out using authViewModel
              await authViewModel.signOut();

              // Step 2: Navigate to login
              router.replace('/(auth)/login');
            } catch (error: any) {
              console.error('Logout error:', error);
              Alert.alert('Error', error?.message || 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNotificationBellPress = () => {
    router.push({
      pathname: '/(main)/notification',
      params: { userId, userName, userType },
    });
  };

  // ✅ Disable memory and diary tabs if no active relationship (not in bonding stage)
  const disabledTabs = authViewModel.hasActiveRelationship ? [] : ['memory', 'diary'];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <NotificationBell
          count={0}
          onPress={handleNotificationBellPress}
          size={48}
        />
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* User Profile Header - FIXED: Uses proper avatar from profile */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <IconCircle
                icon={avatarConfig.icon}
                imageSource={avatarConfig.imageSource}
                size={64}
                backgroundColor={avatarConfig.backgroundColor}
                contentScale={0.7}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileDetails}>
                {age} years old • {location}
              </Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon={require('../assets/images/icon-profile.png')}
                iconBackgroundColor="#9DE2D0"
                title="Edit Profile"
                subtitle="Update your information"
                onPress={handleEditProfile}
              />
              <SettingItem
                icon={require('../assets/images/icon-smallcorrect.png')}
                iconBackgroundColor="#D4E5AE"
                title="Age Verification"
                subtitle="Status: Verified"
                onPress={handleAgeVerification}
                rightContent={<Text style={styles.verifiedLabel}>Verified</Text>}
                showArrow={false}
              />
            </View>
          </View>

          {/* Privacy & Safety Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRIVACY & SAFETY</Text>
            <View style={styles.sectionContent}>
              <SettingItem
                icon={require('../assets/images/icon-warning.png')}
                iconBackgroundColor="#EB8F80"
                title="Safety Reports"
                subtitle="View your report history"
                onPress={handleSafetyReports}
              />
              {/* <SettingItem
              icon={require('../assets/images/icon-question.png')}
              iconBackgroundColor="#9DE2D0"
              title="Safety Resources"
              subtitle="Guidelines & tips"
              onPress={handleSafetyResources}
            /> */}
            </View>
          </View>

          {/* Notifications Section
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.sectionContent}>
            <ToggleSettingItem
              icon={require('../assets/images/icon-givelove.png')}
              iconBackgroundColor="#FADE9F"
              title="New Interests"
              subtitle="When youth express interest"
              value={settingsViewModel.notificationSettings.newInterests}
              onToggle={() => settingsViewModel.toggleNotification('newInterests')}
            />
            <ToggleSettingItem
              icon={require('../assets/images/icon-message.png')}
              iconBackgroundColor="#9DE2D0"
              title="Messages"
              subtitle="New chat messages"
              value={settingsViewModel.notificationSettings.messages}
              onToggle={() => settingsViewModel.toggleNotification('messages')}
            />
            <ToggleSettingItem
              icon={require('../assets/images/icon-upload.png')}
              iconBackgroundColor="#C8ADD6"
              title="Application Updates"
              subtitle="Youth application status"
              value={settingsViewModel.notificationSettings.applicationUpdates}
              onToggle={() => settingsViewModel.toggleNotification('applicationUpdates')}
            />
            <ToggleSettingItem
              icon={require('../assets/images/icon-protect.png')}
              iconBackgroundColor="#EB8F80"
              title="Safety Alerts"
              subtitle="Important safety notifications"
              value={settingsViewModel.notificationSettings.safetyAlerts}
              onToggle={() => settingsViewModel.toggleNotification('safetyAlerts')}
            />
            <ToggleSettingItem
              icon={require('../assets/images/icon-speaker.png')}
              iconBackgroundColor="#D4E5AE"
              title="Platform Updates"
              subtitle="News & announcements"
              value={settingsViewModel.notificationSettings.platformUpdates}
              onToggle={() => settingsViewModel.toggleNotification('platformUpdates')}
            />
          </View>
        </View> */}

          {/* Support & Help Section
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT & HELP</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon={require('../assets/images/icon-help.png')}
              iconBackgroundColor="#9DE2D0"
              title="Help Center"
              subtitle="FAQ & guides"
              onPress={handleHelpCenter}
            />
            <SettingItem
              icon={require('../assets/images/icon-call.png')}
              iconBackgroundColor="#C8ADD6"
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={handleContactSupport}
            />
            <SettingItem
              icon={require('../assets/images/icon-book.png')}
              iconBackgroundColor="#FADE9F"
              title="Terms & Conditions"
              subtitle="Legal agreements"
              onPress={handleTermsConditions}
            />
            <SettingItem
              icon={require('../assets/images/icon-lock.png')}
              iconBackgroundColor="#D4E5AE"
              title="Privacy Policy"
              subtitle="How we protect your data"
              onPress={handlePrivacyPolicy}
            />
          </View>
        </View> */}

          {/* Log Out Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          {/* Bottom Spacing for Tab Bar */}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* Bottom Tab Bar */}
      <BottomTabBar
        tabs={DEFAULT_TABS}
        activeTab="settings"
        onTabPress={handleTabPress}
        disabledTabs={disabledTabs}
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
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerRight: {
    width: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D4E5AE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 32,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  profileDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  verifiedBadge: {
    backgroundColor: '#D4E5AE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  profileArrow: {
    fontSize: 32,
    color: '#333333',
  },
  section: {
    marginBottom: 16,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#999999',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  verifiedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EB8F80',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EB8F80',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  },
});

// Export observer-wrapped component
export const SettingsScreen = observer(SettingsScreenComponent);
