import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { observer } from "mobx-react-lite";
import {
  matchingViewModel,
  youthMatchingViewModel,
} from "@home-sweet-home/viewmodel";
import { useTabNavigation } from "@/hooks/use-tab-navigation";
import { JourneyWalkthrough } from "./JourneyWalkthrough";
import { BrowseElderly } from "./BrowseElderly";
import { ElderlyProfileDetail } from "./ElderlyProfileDetail";
import { InterestSent } from "./InterestSent";
import { ElderlyHome } from "./ElderlyHome";
import type { User } from "@home-sweet-home/model";

// ============================================================================
// TYPES
// ============================================================================
type MatchingScreen = "browse" | "profile-detail" | "interest-sent";

interface ElderlyProfile {
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

const mapUserToProfile = (user: User): ElderlyProfile => {
  const hasRealPhoto = !!user.profile_photo_url;
  const presetEmoji = user.profile_data?.avatar_meta?.type === "default" ? "👵" : undefined;

  return {
    id: user.id,
    name: user.full_name || "Anonymous",  
    age: user.profile_data?.verified_age || 60,
    location: user.location || "Unknown",
    profilePhotoUrl: hasRealPhoto ? user.profile_photo_url! : undefined,
    avatarEmoji: hasRealPhoto ? undefined : presetEmoji,
    avatarColor: "#C8ADD6", 
    isOnline: false,
    interests: (user.profile_data?.interests || []).map((i) => ({
      label: i,
      color: "#9DE2D0",
    })),
    aboutMe: user.profile_data?.self_introduction || "No bio available.",
    // Deduplicate languages (case-insensitive) to prevent showing both 'English' and 'english'
    languages: [...new Map((user.languages || []).map(lang =>
      [lang.toLowerCase(), lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()]
    )).values()],
  };
};

// ============================================================================
// COMPONENT
// ============================================================================
export const MatchingScreenComponent = observer(
  function MatchingScreenComponent() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as string | undefined;
    const userName = params.userName as string;
    const userType = params.userType as "youth" | "elderly" | undefined;
    const isFirstTime = params.isFirstTime as string | undefined;

    // Screen navigation state (View-only state)
    const [currentScreen, setCurrentScreen] =
      useState<MatchingScreen>("browse");
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
      null
    );
    const [activeTab] = useState("matching"); // Always 'matching' for this screen
    const [isCheckingRelationship, setIsCheckingRelationship] = useState(false);

    // Tab navigation hook
    const { handleTabPress } = useTabNavigation(activeTab);

    useEffect(() => {
      console.log('[MatchingScreen] useEffect[relationship] triggered - userId:', userId, 'userType:', userType);

      const checkRelationship = async () => {
        if (!userId) {
          console.log('[MatchingScreen] No userId, skipping relationship check');
          return;
        }

        setIsCheckingRelationship(true);
        console.log('[MatchingScreen] Starting relationship check for:', userType);

        // Check appropriate ViewModel based on user type
        if (userType === 'youth') {
          console.log('[MatchingScreen] Checking youth relationship...');
          await youthMatchingViewModel.checkActiveRelationship(userId);
          console.log('[MatchingScreen] Youth hasActiveRelationship:', youthMatchingViewModel.hasActiveRelationship);

          if (youthMatchingViewModel.hasActiveRelationship) {
            console.log('[MatchingScreen] Youth has relationship, redirecting to bonding');
            router.replace({
              pathname: '/(main)/bonding' as any,
              params: { userId, userName, userType },
            });
            // Keep loading state true while redirecting
            return;
          } else {
            console.log('[MatchingScreen] Youth has NO relationship, staying on matching page');
          }
        } else if (userType === 'elderly') {
          console.log('[MatchingScreen] Checking elderly relationship...');
          const elderVM = await import('@home-sweet-home/viewmodel').then(m => m.elderMatchingViewModel);
          await elderVM.checkActiveRelationship(userId);
          console.log('[MatchingScreen] Elderly hasActiveRelationship:', elderVM.hasActiveRelationship);

          if (elderVM.hasActiveRelationship) {
            console.log('[MatchingScreen] Elderly has relationship, redirecting to bonding');
            router.replace({
              pathname: '/(main)/bonding' as any,
              params: { userId, userName, userType },
            });
            // Keep loading state true while redirecting
            return;
          } else {
            console.log('[MatchingScreen] Elderly has NO relationship, staying on matching page');
          }
        } else {
          console.log('[MatchingScreen] Unknown userType:', userType);
        }

        // Only set loading to false if we didn't redirect
        setIsCheckingRelationship(false);
      };

      checkRelationship();
    }, [userId, userType]);

    // Check if walkthrough should be shown
    useEffect(() => {
      // Wait for walkthrough status to load from database
      if (matchingViewModel.isLoadingWalkthrough) {
        return; // Wait until loading completes
      }

      // Show walkthrough if coming from profile completion 
      if (isFirstTime === "true") {
        matchingViewModel.checkWalkthroughStatus(true);
      }
    }, [isFirstTime, matchingViewModel.isLoadingWalkthrough]);

    const handleWalkthroughComplete = () => {
      matchingViewModel.completeWalkthrough();
    };

    // Navigation handlers
    const handleProfilePress = (profileId: string) => {
      setSelectedProfileId(profileId);
      setCurrentScreen("profile-detail");
    };

    const handleBackFromDetail = () => {
      setSelectedProfileId(null);
      setCurrentScreen("browse");
    };

    const handleExpressInterest = async () => {
      // Get userId from youthMatchingViewModel (synced by Layout)
      const youthId = youthMatchingViewModel.currentUserId;
      if (!youthId) {
        Alert.alert("Error", "You must be logged in to express interest.");
        return;
      }
      if (!selectedProfileId) return;

      // Call VM to express interest
      const success = await youthMatchingViewModel.expressInterest(
        youthId,
        selectedProfileId
      );
      if (success) {
        setCurrentScreen("interest-sent");
      } else {
        // ViewModel handles setting 'error' string, showing alert
        if (youthMatchingViewModel.error) {
          Alert.alert(
            "Unable to Express Interest",
            youthMatchingViewModel.error
          );
        }
      }
    };

    const handleBrowseMore = () => {
      setSelectedProfileId(null);
      setCurrentScreen("browse");
    };

    const handleLearnMorePress = () => {
      // Show walkthrough again (force = true)
      matchingViewModel.checkWalkthroughStatus(true, true);
    };

    const handleNotificationPress = () => {
      router.push("/(main)/notification");
    };

    const handleFilterPress = () => {
    };

    // Show walkthrough if needed
    if (matchingViewModel.showWalkthrough) {
      return (
        <JourneyWalkthrough
          onComplete={handleWalkthroughComplete}
          userType={userType || "youth"}
        />
      );
    }

    // Get selected profile data FROM VIEW MODEL
    const userProfile = conversableUserProfile(selectedProfileId);
    const selectedProfile = userProfile
      ? mapUserToProfile(userProfile)
      : undefined;

    function conversableUserProfile(id: string | null) {
      if (!id) return undefined;
      return youthMatchingViewModel.profiles.find((p) => p.id === id);
    }

    if (isCheckingRelationship) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
          <ActivityIndicator size="large" color="#9DE2D0" />
        </View>
      );
    }

    // Render based on current screen
    console.log('[MatchingScreen] Rendering - currentScreen:', currentScreen, 'userType:', userType, 'hasRelationship:', userType === 'youth' ? youthMatchingViewModel.hasActiveRelationship : 'elderly');

    switch (currentScreen) {
      case "profile-detail":
        console.log('[MatchingScreen] Rendering profile-detail');
        return (
          <ElderlyProfileDetail
            profile={selectedProfile}
            onBack={handleBackFromDetail}
            onExpressInterest={handleExpressInterest}
            onTabPress={handleTabPress}
            activeTab={activeTab}
          />
        );

      case "interest-sent":
        console.log('[MatchingScreen] Rendering interest-sent');
        return (
          <InterestSent
            elderlyName={selectedProfile?.name || "Elderly"}
            onBrowseMore={handleBrowseMore}
          />
        );

      case "browse":
      default:
        // If Elderly, show ElderlyHome
        if (userType === "elderly") {
          console.log('[MatchingScreen] Rendering ElderlyHome');
          return (
            <ElderlyHome
              displayName={userName}
              onTabPress={handleTabPress}
              activeTab={activeTab}
              onLearnMorePress={handleLearnMorePress}
            />
          );
        }

        // If Youth (default), show BrowseElderly
        console.log('[MatchingScreen] Rendering BrowseElderly for youth');
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
  }
);

export default MatchingScreenComponent;
