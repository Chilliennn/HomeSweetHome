import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { matchingViewModel } from '@home-sweet-home/viewmodel';
import {
  JourneyWalkthrough,
  BrowseElderly,
  ElderlyProfileDetail,
  InterestSent,
  ElderlyHome
} from '../../MatchingUI';

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
  },
  {
    id: '2',
    name: 'Uncle Tan',
    age: 72,
    location: 'Kuala Lumpur',
    avatarEmoji: '👴',
    avatarColor: '#9DE2D0',
    isOnline: false,
    interests: [
      { label: 'Chess', color: '#9DE2D0' },
      { label: 'Tai Chi', color: '#EB8F80' },
    ],
    aboutMe: 'Former engineer who enjoys intellectual conversations and outdoor activities.',
    languages: ['English', 'Cantonese'],
    communicationStyle: ['Voice Calls', 'Text Messages'],
    availability: 'Evenings and weekends',
  },
  {
    id: '3',
    name: 'Puan Fatimah',
    age: 65,
    location: 'Johor Bahru',
    avatarEmoji: '👵',
    avatarColor: '#FADE9F',
    isOnline: true,
    interests: [
      { label: 'Baking', color: '#EB8F80' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
    aboutMe: 'Loves baking traditional kuih and sharing family recipes.',
    languages: ['Malay', 'English'],
    communicationStyle: ['Video Calls', 'Voice Messages'],
    availability: 'Afternoons',
  },
  {
    id: '4',
    name: 'Harrison Wong',
    age: 90,
    location: 'Kuala Lumpur',
    avatarEmoji: '👳',
    avatarColor: '#D4E5AE',
    isOnline: false,
    interests: [
      { label: 'Music', color: '#FADE9F' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
    aboutMe: 'Former musician with countless stories to share about the golden era.',
    languages: ['English', 'Mandarin'],
    communicationStyle: ['Voice Calls'],
    availability: 'Flexible',
  },
  {
    id: '5',
    name: 'Marion',
    age: 80,
    location: 'Johor Bahru',
    avatarEmoji: '👵',
    avatarColor: '#FADE9F',
    isOnline: true,
    interests: [
      { label: 'Planting', color: '#EB8F80' },
      { label: 'Stories', color: '#E0E0E0' },
    ],
    aboutMe: 'Passionate gardener who loves teaching about plants and nature.',
    languages: ['English', 'Malay'],
    communicationStyle: ['Video Calls', 'Text Messages'],
    availability: 'Mornings',
  },
];

/**
 * Matching Screen (Route: /(main)/matching)
 * 
 * Displays matching features for users with complete profiles.
 * Shows Journey Walkthrough for first-time users after profile completion.
 * Users can browse elderly/youth profiles and submit applications.
 */
function MatchingScreenComponent() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userName = params.userName as string;
  const userType = params.userType as 'youth' | 'elderly' | undefined;
  const isFirstTime = params.isFirstTime as string | undefined;

  // Screen navigation state (View-only state)
  const [currentScreen, setCurrentScreen] = useState<MatchingScreen>('browse');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('matching');

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

  const handleExpressInterest = () => {
    // In production, this would call ViewModel to submit interest
    // For now, just navigate to confirmation screen
    setCurrentScreen('interest-sent');
  };

  const handleBrowseMore = () => {
    setSelectedProfileId(null);
    setCurrentScreen('browse');
  };

  const handleLearnMorePress = () => {
    // Show walkthrough again (force = true)
    matchingViewModel.checkWalkthroughStatus(true, true);
  };

  const handleTabPress = (tabKey: string) => {
    setActiveTab(tabKey);
    // Future: handle navigation to other tabs
    if (tabKey === 'chat') {
      // Navigate to chat screen when implemented
    } else if (tabKey === 'settings') {
      // Navigate to settings screen when implemented
    }
  };

  const handleNotificationPress = () => {
    // Future: navigate to notifications screen
    // For now we might want to just show an alert or navigate to a placeholder
    // router.push('/(main)/notifications');
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

  // Get selected profile data
  const selectedProfile = selectedProfileId
    ? MOCK_ELDERLY_PROFILES.find(p => p.id === selectedProfileId)
    : undefined;

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
            notificationCount={1}
            onNotificationPress={handleNotificationPress}
            onLearnMore={handleLearnMorePress}
          />
        );
      }

      // If Youth (default), show BrowseElderly
      return (
        <BrowseElderly
          notificationCount={1}
          onNotificationPress={handleNotificationPress}
          onFilterPress={handleFilterPress}
          onProfilePress={handleProfilePress}
          onLearnMorePress={handleLearnMorePress}
          onTabPress={handleTabPress}
          activeTab={activeTab}
          currentJourneyStep={1}
          elderlyProfiles={MOCK_ELDERLY_PROFILES}
          totalElderCount={12}
        />
      );
  }
}

export default observer(MatchingScreenComponent);
