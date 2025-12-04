import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { ProfileWelcome } from './ProfileWelcome';
import { AgeVerification } from './AgeVerification';
import { VerifyingLoader } from './VerifyingLoader';
import { VerifiedSuccess } from './VerifiedSuccess';
import { AgeVerificationCamera } from './AgeVerificationCamera';
import { RealIdentityForm } from './RealIdentityForm';
import { DisplayIdentityForm } from './DisplayIdentityForm';
import { ProfileInfoForm } from './ProfileInfoForm';
import { ProfileComplete } from './ProfileComplete';
import type { RealIdentityData } from './RealIdentityForm';
import type { DisplayIdentityData } from './DisplayIdentityForm';
import type { ProfileInfoData } from './ProfileInfoForm';

// ============================================================================
// SCREEN COMPONENT
// ============================================================================
/**
 * Profile Setup Screen (UC-103: Complete Profile)
 * Route: /(auth)/profile-setup
 * 
 * This screen manages the profile setup flow for FIRST-TIME users:
 * 1. ProfileWelcome - Introduction and requirements (M1: Welcome message)
 * 2. AgeVerification - MyDigital ID verification (UC103_2, UC103_3, UC103_4)
 * 3. VerifyingLoader - Show loading while verifying
 * 4. VerifiedSuccess - Show success and continue to profile setup
 * 
 * After this flow, user proceeds to:
 * - Real Identity Section (Step 1 of 3)
 * - Display Identity Section (Step 2 of 3)  
 * - Profile Information Section (Step 3 of 3)
 * 
 * MVVM Architecture Notes:
 * - This View only handles UI rendering and user interactions
 * - All business logic is delegated to AuthViewModel (MobX observable)
 * - State like verifiedAge and userType come from ViewModel
 */
const ProfileSetupScreenComponent: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initializedRef = useRef(false);
  
  // Extract user info from login
  const userId = params.userId as string | undefined;
  const userName = params.userName as string | undefined;
  const userTypeFromDB = params.userType as 'youth' | 'elderly' | undefined;

  // One-time init: set default userType and hydrate profile state if available
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    authViewModel.resetFlow(userTypeFromDB || 'youth');
    if (userId) {
      authViewModel.loadProfile(userId);
    }
  }, [userId, userTypeFromDB]);

  const { currentStep, isLoading, verifiedAge, userType, profileData } = authViewModel;

  // ============================================================================
  // EVENT HANDLERS
  // Following MVVM: View only calls ViewModel methods, no business logic here
  // ============================================================================

  /**
   * Handle "Let's Start!" button press on Welcome screen
   * TODO: Call authViewModel.startProfileSetup() when ViewModel is ready
   */
  const handleStart = () => {
    authViewModel.setStep('age-verification');
  };

  /**
   * Handle "Start Verification" button press (UC103_2)
   * For this prototype we open the camera capture experience.
   * In production, delegate to authViewModel.startAgeVerification().
   */
  const handleStartVerification = async () => {
    authViewModel.setStep('camera');
  };

  /**
   * Handle "I'll Do This Later" button press (A14: User Cancels Verification)
   * Note: Based on UC103, age verification is REQUIRED for matching features
   * This should show warning M16 and user cannot access matching without verification
   * 
   * TODO: Call authViewModel.skipAgeVerification() which will:
   * 1. Show warning that matching features are disabled
   * 2. Save incomplete profile state
   * 3. Navigate but with limited access
   */
  const handleSkip = () => {
    // TODO: Call authViewModel.skipAgeVerification()
    // Based on UC103 C1: Matching and adoption features are disabled until age is verified
    // For now, navigate to matching with limited features
    router.replace({
      pathname: '/(main)/matching',
      params: { 
        userId, 
        userName,
        ageVerified: 'false', // Pass verification status
      },
    });
  };

  /**
   * Handle back navigation based on current step
   */
  const handleBack = () => {
    switch (currentStep) {
      case 'age-verification':
        authViewModel.setStep('welcome');
        break;
      case 'camera':
        authViewModel.setStep('age-verification');
        break;
      case 'real-identity':
        authViewModel.setStep('verified');
        break;
      case 'display-identity':
        authViewModel.setStep('real-identity');
        break;
      case 'profile-info':
        authViewModel.setStep('display-identity');
        break;
      default:
        router.back();
    }
  };

  /**
   * Called after camera capture completes. For prototype we immediately
   * consider verification successful and show loader before success state.
   * TODO: Replace with authViewModel.uploadAndVerifyAge(photoUri)
   */
  const handlePhotoCaptured = (photoUri: string) => {
    // TODO: Pass photoUri to ViewModel when backend wiring is ready
    if (!userId) {
      authViewModel.setError('Missing user context');
      authViewModel.setStep('age-verification');
      return;
    }

    const effectiveUserType: 'youth' | 'elderly' = userType === 'elderly' ? 'elderly' : 'youth';

    authViewModel.verifyAgeWithCapture({
      userId,
      userType: effectiveUserType,
      photoUri,
    });
  };

  /**
   * Handle "Continue to Profile" after successful age verification
   * Proceeds to Real Identity Section (Step 1 of 3) - UC103_5, UC103_6
   */
  const handleContinueAfterVerification = () => {
    authViewModel.setStep('real-identity');
  };

  /**
   * Handle Real Identity form submission - UC103_5, UC103_6
   * Proceeds to Display Identity Section (Step 2 of 3)
   */
  const handleRealIdentitySubmit = async (data: RealIdentityData) => {
    if (!userId) return;
    await authViewModel.saveRealIdentity(userId, {
      phoneNumber: data.phoneNumber,
      email: data.email,
      realPhotoUrl: data.realPhotoUri,
    });
    authViewModel.setStep('display-identity');
  };

  /**
   * Handle Display Identity form submission - UC103_7, UC103_8, UC103_9, UC103_10
   * Proceeds to Profile Info Section (Step 3 of 3)
   */
  const handleDisplayIdentitySubmit = async (data: DisplayIdentityData) => {
    if (!userId) return;
    await authViewModel.saveDisplayIdentity(userId, {
      displayName: data.displayName,
      avatarType: data.avatarType,
      selectedAvatarIndex: data.selectedAvatarIndex,
      customAvatarUrl: data.customAvatarUri,
    });
    authViewModel.setStep('profile-info');
  };

  /**
   * Handle Profile Info form submission - UC103_11 to UC103_17
   * Completes the profile and shows success screen
   */
  const handleProfileInfoSubmit = async (data: ProfileInfoData) => {
    if (!userId) return;
    await authViewModel.saveProfileInfo(userId, {
      interests: data.interests,
      customInterest: data.customInterest,
      selfIntroduction: data.selfIntroduction,
      languages: data.languages,
      customLanguage: data.customLanguage,
    });
    await authViewModel.markProfileComplete(userId);
  };

  /**
   * Handle "Start Browsing" after profile completion
   * Navigate to matching screen
   */
  const handleStartBrowsing = () => {
    const effectiveUserType: 'youth' | 'elderly' = userType === 'elderly' ? 'elderly' : 'youth';
    router.replace({
      pathname: '/(main)/matching',
      params: { 
        userId, 
        userName,
        userType: effectiveUserType,
        verifiedAge: (verifiedAge ?? '').toString(),
        ageVerified: 'true',
      },
    });
  };

  /**
   * Handle "View My Profile" after profile completion
   * TODO: Navigate to profile view screen
   */
  const handleViewProfile = () => {
    const effectiveUserType: 'youth' | 'elderly' = userType === 'elderly' ? 'elderly' : 'youth';
    // TODO: Navigate to profile screen when implemented
    router.replace({
      pathname: '/(main)/matching',
      params: { 
        userId, 
        userName,
        userType: effectiveUserType,
        verifiedAge: (verifiedAge ?? '').toString(),
        ageVerified: 'true',
      },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderCurrentStep = () => {
    const effectiveUserType: 'youth' | 'elderly' = userType === 'elderly' ? 'elderly' : 'youth';
    const realIdentityInitial: RealIdentityData | undefined = profileData.realIdentity
      ? {
          phoneNumber: profileData.realIdentity.phoneNumber,
          email: profileData.realIdentity.email,
          realPhotoUri: profileData.realIdentity.realPhotoUrl,
        }
      : undefined;

    const displayIdentityInitial: DisplayIdentityData | undefined = profileData.displayIdentity
      ? {
          displayName: profileData.displayIdentity.displayName,
          avatarType: profileData.displayIdentity.avatarType,
          selectedAvatarIndex: profileData.displayIdentity.selectedAvatarIndex,
          customAvatarUri: profileData.displayIdentity.customAvatarUrl,
        }
      : undefined;

    const profileInfoInitial: ProfileInfoData | undefined = profileData.profileInfo
      ? {
          interests: profileData.profileInfo.interests,
          customInterest: profileData.profileInfo.customInterest,
          selfIntroduction: profileData.profileInfo.selfIntroduction,
          languages: profileData.profileInfo.languages,
          customLanguage: profileData.profileInfo.customLanguage,
        }
      : undefined;

    const verifiedAgeNumber = verifiedAge ?? 0;

    switch (currentStep) {
      case 'welcome':
        return (
          <ProfileWelcome
            onStart={handleStart}
            isLoading={isLoading}
          />
        );

      case 'age-verification':
        return (
          <AgeVerification
            onStartVerification={handleStartVerification}
            onSkip={handleSkip}
            onBack={handleBack}
            isLoading={isLoading}
            canSkip={true} // Can skip but features will be limited (C1)
          />
        );

      case 'camera':
        return (
          <AgeVerificationCamera
            onCaptured={handlePhotoCaptured}
            onCancel={handleBack}
          />
        );

      case 'verifying':
        return (
          <VerifyingLoader
            title="Verifying..."
            message="Please wait while we verify your identity with MyDigital ID. This usually takes a few seconds."
            status="connecting"
          />
        );

      case 'verified':
        return (
          <VerifiedSuccess
            verifiedAge={verifiedAgeNumber}
            userType={effectiveUserType}
            onContinue={handleContinueAfterVerification}
            isLoading={isLoading}
          />
        );

      case 'real-identity':
        return (
          <RealIdentityForm
            initialData={realIdentityInitial}
            onNext={handleRealIdentitySubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      case 'display-identity':
        return (
          <DisplayIdentityForm
            initialData={displayIdentityInitial}
            userType={effectiveUserType}
            onNext={handleDisplayIdentitySubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      case 'profile-info':
        return (
          <ProfileInfoForm
            initialData={profileInfoInitial}
            onSubmit={handleProfileInfoSubmit}
            onBack={handleBack}
            isLoading={isLoading}
          />
        );

      case 'complete':
        return (
          <ProfileComplete
            onStartBrowsing={handleStartBrowsing}
            onViewProfile={handleViewProfile}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentStep()}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
});

const ProfileSetupScreen = observer(ProfileSetupScreenComponent);

export default ProfileSetupScreen;
