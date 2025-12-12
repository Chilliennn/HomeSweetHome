import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { matchingViewModel, youthMatchingViewModel } from '@home-sweet-home/viewmodel';
import { useTabNavigation } from '@/hooks/use-tab-navigation';
import {
  JourneyWalkthrough,
  BrowseElderly,
  ElderlyProfileDetail,
  InterestSent,
  ElderlyHome
} from './index';
import type { User } from '@home-sweet-home/model';

// ============================================================================
// TYPES
// ============================================================================
type MatchingScreen = 'browse' | 'profile-detail' | 'interest-sent';

interface ElderlyProfile {
  id: string;
  name: string;
  age: number;
  location: string;
  avatarEmoji?: string;
  avatarColor?: string;
  isOnline?: boolean;
  interests: Array<{ label: string; color?: string }>;
  aboutMe: string;
  languages: string[];
  communicationStyle: string[];
  availability: string;
}

const mapUserToProfile = (user: User): ElderlyProfile => {
  return {
    id: user.id,
    name: user.full_name || user.profile_data?.display_name || 'Anonymous',
    age: user.profile_data?.verified_age || 60,
    location: user.location || 'Unknown',
    avatarEmoji: user.profile_data?.avatar_meta?.type === 'default' ? '👵' : undefined,
    avatarColor: '#C8ADD6', // Default
    isOnline: false,
    interests: (user.profile_data?.interests || []).map(i => ({ label: i, color: '#9DE2D0' })),
    aboutMe: user.profile_data?.self_introduction || 'No bio available.',
    languages: user.languages || [],
    communicationStyle: [],
    availability: 'Flexible',
  };
};

// ============================================================================
// COMPONENT
// ============================================================================
/**
 * Matching Screen - Main matching interface logic component
 * 
 * Displays matching features for users with complete profiles.
 * Shows Journey Walkthrough for first-time users after profile completion.
 * Users can browse elderly/youth profiles and submit applications.
 * 
 * Architecture:
 * - Logic component (connects View to ViewModel)
 * - Handles screen navigation state
 * - Delegates presentation to child components
 * 
 * Updated: Prop drilling for notifications is removed; child components use ViewModels directly.
 * Mocks removed in favor of VM data.
 */
export const MatchingScreenComponent = observer(function MatchingScreenComponent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string | undefined;
  const userName = params.userName as string;
  const userType = params.userType as 'youth' | 'elderly' | undefined;
  const isFirstTime = params.isFirstTime as string | undefined;

  // Screen navigation state (View-only state)
  const [currentScreen, setCurrentScreen] = useState<MatchingScreen>('browse');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab] = useState('matching'); // Always 'matching' for this screen

  // Tab navigation hook
  const { handleTabPress } = useTabNavigation(activeTab);

  // Check if walkthrough should be shown
  useEffect(() => {
    // Show walkthrough if coming from profile completion (first time)
    if (isFirstTime === 'true') {
      matchingViewModel.checkWalkthroughStatus(true);
    }
  }, [isFirstTime]);

  const handleWalkthroughComplete = () => {
    matchingViewModel.completeWalkthrough();
  };

  // Navigation handlers
  const handleProfilePress = (profileId: string) => {
    setSelectedProfileId(profileId);
    setCurrentScreen('profile-detail');
  };

  const handleBackFromDetail = () => {
    setSelectedProfileId(null);
    setCurrentScreen('browse');
  };

  const handleExpressInterest = async () => {
    const youthId = matchingViewModel.currentUserId;
    if (!youthId) {
      Alert.alert("Error", "You must be logged in to express interest.");
      return;
    }
    if (!selectedProfileId) return;

    // Call VM to express interest
    const success = await youthMatchingViewModel.expressInterest(youthId, selectedProfileId);
    if (success) {
      setCurrentScreen('interest-sent');
    } else {
      // ViewModel handles setting 'error' string, showing alert
      if (youthMatchingViewModel.error) {
        Alert.alert("Unable to Express Interest", youthMatchingViewModel.error);
      }
    }
  };

  const handleBrowseMore = () => {
    setSelectedProfileId(null);
    setCurrentScreen('browse');
  };

  const handleLearnMorePress = () => {
    // Show walkthrough again (force = true)
    matchingViewModel.checkWalkthroughStatus(true, true);
  };

  const handleNotificationPress = () => {
    router.push('/(main)/notification');
  };

  const handleFilterPress = () => {
    // Future: open filter modal
  };

  // Show walkthrough if needed
  if (matchingViewModel.showWalkthrough) {
    return (
      <JourneyWalkthrough
        onComplete={handleWalkthroughComplete}
        userType={userType || 'youth'}
      />
    );
  }

  // Get selected profile data FROM VIEW MODEL
  const userProfile = conversableUserProfile(selectedProfileId);
  const selectedProfile = userProfile ? mapUserToProfile(userProfile) : undefined;

  function conversableUserProfile(id: string | null) {
    if (!id) return undefined;
    return youthMatchingViewModel.profiles.find(p => p.id === id);
  }

  // Render based on current screen
  switch (currentScreen) {
    case 'profile-detail':
      return (
        <ElderlyProfileDetail
          profile={selectedProfile}
          onBack={handleBackFromDetail}
          onExpressInterest={handleExpressInterest}
          onTabPress={handleTabPress}
          activeTab={activeTab}
        />
      );

    case 'interest-sent':
      return (
        <InterestSent
          elderlyName={selectedProfile?.name || 'Elderly'}
          onBrowseMore={handleBrowseMore}
        />
      );

    case 'browse':
    default:
      // If Elderly, show ElderlyHome
      if (userType === 'elderly') {
        return (
          <ElderlyHome
            displayName={userName}
            onTabPress={handleTabPress}
            activeTab={activeTab}
          />
        );
      }

      // If Youth (default), show BrowseElderly
      return (
        <BrowseElderly
          onNotificationPress={handleNotificationPress}
          onFilterPress={handleFilterPress}
          onProfilePress={handleProfilePress}
          onLearnMorePress={handleLearnMorePress}
          onTabPress={handleTabPress}
          activeTab={activeTab}
          currentJourneyStep={1}
        />
      );
  }
});

export default MatchingScreenComponent;
