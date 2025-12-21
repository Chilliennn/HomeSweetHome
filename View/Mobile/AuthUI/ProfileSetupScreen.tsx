import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { observer } from 'mobx-react-lite';
import * as FileSystem from 'expo-file-system';
import { authViewModel } from '@home-sweet-home/viewmodel';
import { ProfileWelcome } from './ProfileWelcome';
import { AgeVerification } from './AgeVerification';
import { VerifyingLoader } from './VerifyingLoader';
import { VerifiedSuccess } from './VerifiedSuccess';
import { AgeVerificationCamera } from './AgeVerificationCamera';
import { ProfileSetupForm } from './ProfileSetupForm';
import { ProfileInfoForm } from './ProfileInfoForm';
import { ProfileComplete } from './ProfileComplete';
import type { ProfileSetupFormData } from './ProfileSetupForm';
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
  const stepRef = useRef<string | null>(null); // Track step changes for logging

  // Extract user info from login or settings navigation
  const userIdFromParams = params.userId as string | undefined;
  const userName = params.userName as string | undefined;
  const userTypeFromDB = params.userType as 'youth' | 'elderly' | undefined;
  const editMode = params.editMode === 'true'; // Settings navigation passes this

  // ✅ Fallback: Get userId from authViewModel if not in params (edit mode scenario)
  const userId = userIdFromParams || authViewModel.authState.currentUserId || undefined;

  // One-time init: set default userType and hydrate profile state if available
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    console.log('[ProfileSetupScreen] Initializing - userId:', userId, 'editMode:', editMode, 'userType:', userTypeFromDB);
    
    // Initialize flow asynchronously to ensure profile loads first in editMode
    const initFlow = async () => {
      if (editMode) {
        // Edit mode: Load profile data FIRST, then go to profile-form
        authViewModel.resetFlow(userTypeFromDB || 'youth');
        if (userId) {
          await authViewModel.loadProfile(userId);
        }
        authViewModel.setStep('profile-form');
      } else {
        // Normal flow: start from welcome
        authViewModel.resetFlow(userTypeFromDB || 'youth');
        if (userId) {
          authViewModel.loadProfile(userId);
        }
      }
    };
    
    initFlow();
  }, [userId, userTypeFromDB, editMode]);

  // Access observable properties directly from authViewModel in render
  // DO NOT destructure at the top level - it breaks MobX reactivity
  const currentStep = authViewModel.currentStep;
  const isLoading = authViewModel.isLoading;
  const verifiedAge = authViewModel.verifiedAge;
  const userType = authViewModel.userType;
  const profileData = authViewModel.profileData;

  // ============================================================================
  // EVENT HANDLERS
  // Following MVVM: View only calls ViewModel methods, no business logic here
  // ============================================================================

  /**
   * Handle "Let's Start!" button press on Welcome screen
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
   * Handle back navigation based on current step
   */
  const handleBack = () => {
    // Read directly from authViewModel to get fresh value
    const step = authViewModel.currentStep;
    switch (step) {
      case 'age-verification':
        authViewModel.setStep('welcome');
        break;
      case 'camera':
        authViewModel.setStep('age-verification');
        break;
      case 'profile-form':
        if (editMode) {
          // In edit mode, go back to settings
          router.back();
        } else {
          authViewModel.setStep('verified');
        }
        break;
      case 'profile-info':
        authViewModel.setStep('profile-form');
        break;
      case 'welcome':
        // At welcome step, go back to login
        router.replace('/login');
        break;
      default:
        // For any other step, try router.back() but catch errors
        try {
          router.back();
        } catch {
          // If no screen to go back to, go to login
          router.replace('/login');
        }
    }
  };

  /**
   * Called after camera capture completes. For prototype we immediately
   * consider verification successful and show loader before success state.
   */
  const handlePhotoCaptured = async (photoUri: string) => {
    console.log('[ProfileSetupScreen] handlePhotoCaptured called with:', photoUri?.substring(0, 50));

    if (!userId) {
      console.error('[ProfileSetupScreen] Missing userId!');
      authViewModel.setError('Missing user context');
      authViewModel.setStep('age-verification');
      return;
    }

    const effectiveUserType: 'youth' | 'elderly' = userType === 'elderly' ? 'elderly' : 'youth';
    console.log('[ProfileSetupScreen] effectiveUserType:', effectiveUserType);

    try {
      await authViewModel.verifyAgeWithCapture({
        userId,
        userType: effectiveUserType,
        photoUri,
      });
      console.log('[ProfileSetupScreen] verifyAgeWithCapture completed successfully');
    } catch (error) {
      console.error('[ProfileSetupScreen] verifyAgeWithCapture failed:', error);
      // Error is already handled by ViewModel, just log here
    }
  };

  /**
   * Handle "Continue to Profile" after successful age verification
   * Proceeds to Profile Setup Form (merged Step 1+2)
   */
  const handleContinueAfterVerification = () => {
    authViewModel.setStep('profile-form');
  };

  /**
   * Handle Profile Setup form submission (merged Step 1+2)
   * Saves phone, location, fullName, avatar, and profile photo
   * Proceeds to Profile Info Section (Step 3)
   * 
   * NOTE: File reading is done here in the View layer (using expo-file-system)
   * before passing base64 data to the ViewModel. This follows MVVM architecture.
   */
  const handleProfileSetupSubmit = async (data: ProfileSetupFormData) => {
    console.log('[ProfileSetupScreen] handleProfileSetupSubmit START', { userId, editMode, data: { ...data, profilePhotoUri: data.profilePhotoUri?.substring(0, 50) } });
    
    if (!userId) {
      console.error('[ProfileSetupScreen] handleProfileSetupSubmit - No userId!');
      return;
    }
    
    // Read profile photo file in View layer if provided
    let profilePhotoBase64: string | null = null;
    let profilePhotoExtension: string | null = null;
    
    if (data.profilePhotoUri) {
      console.log('[ProfileSetupScreen] Reading profile photo file...');
      try {
        // Extract file extension from URI
        const uriParts = data.profilePhotoUri.split('.');
        profilePhotoExtension = uriParts[uriParts.length - 1].toLowerCase();
        
        // Read file as base64 (View layer responsibility)
        profilePhotoBase64 = await FileSystem.readAsStringAsync(
          data.profilePhotoUri, 
          { encoding: FileSystem.EncodingType.Base64 }
        );
        console.log('[ProfileSetupScreen] Photo file read successfully, size:', profilePhotoBase64.length);
      } catch (error) {
        console.error('[ProfileSetupScreen] Failed to read photo file:', error);
        authViewModel.setError('Failed to read profile photo');
        return;
      }
    }
    
    console.log('[ProfileSetupScreen] Calling authViewModel.saveProfileSetup...');
    try {
      await authViewModel.saveProfileSetup(userId, {
        phoneNumber: data.phoneNumber,
        location: data.location,
        fullName: data.fullName,
        avatarType: data.avatarType,
        selectedAvatarId: data.selectedAvatarId,
        profilePhotoBase64,
        profilePhotoExtension,
      });
      console.log('[ProfileSetupScreen] saveProfileSetup completed successfully');
    } catch (error) {
      console.error('[ProfileSetupScreen] saveProfileSetup failed:', error);
      return; // Don't navigate if save failed
    }
    
    if (editMode) {
      // In edit mode, go back to settings after saving
      console.log('[ProfileSetupScreen] Edit mode - navigating back to settings');
      router.back();
    } else {
      // Normal flow: proceed to profile info
      console.log('[ProfileSetupScreen] Normal flow - proceeding to profile-info');
      authViewModel.setStep('profile-info');
    }
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
   * Navigate to matching screen with isFirstTime flag to show walkthrough
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
        isFirstTime: 'true', // Show journey walkthrough
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
        isFirstTime: 'true', // Show journey walkthrough
      },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View style={styles.container}>
      {(() => {
        const effectiveUserType: 'youth' | 'elderly' = authViewModel.userType === 'elderly' ? 'elderly' : 'youth';
        const step = authViewModel.currentStep;
        const loading = authViewModel.isLoading;
        const age = authViewModel.verifiedAge ?? 0;
        const data = authViewModel.profileData;

        // Debug: log only when step changes to avoid spam
        if (stepRef.current !== step) {
          console.log('[ProfileSetupScreen] Step changed:', stepRef.current, '→', step);
          stepRef.current = step;
        }

        // Build initial data for ProfileSetupForm from existing profile data
        const profileSetupInitial: ProfileSetupFormData | undefined = 
          (data.realIdentity || data.displayIdentity) ? {
            phoneNumber: data.realIdentity?.phoneNumber || '',
            location: data.realIdentity?.location || '',
            fullName: userName || '', // Load full_name from params
            avatarType: data.displayIdentity?.avatarType || 'default',
            // Convert selectedAvatarIndex back to selectedAvatarId
            selectedAvatarId: data.displayIdentity?.selectedAvatarIndex !== null && data.displayIdentity?.selectedAvatarIndex !== undefined
              ? (data.displayIdentity.selectedAvatarIndex < 2 
                  ? `img-${data.displayIdentity.selectedAvatarIndex}` 
                  : `emoji-${data.displayIdentity.selectedAvatarIndex - 2}`)
              : null,
            profilePhotoUri: null, // Don't pre-load photo URI (will load from database if exists)
          } : undefined;

        const profileInfoInitial: ProfileInfoData | undefined = data.profileInfo
          ? {
            interests: data.profileInfo.interests,
            customInterest: data.profileInfo.customInterest,
            selfIntroduction: data.profileInfo.selfIntroduction,
            languages: data.profileInfo.languages,
            customLanguage: data.profileInfo.customLanguage,
          }
          : undefined;

        switch (step) {
          case 'welcome':
            console.log('[ProfileSetupScreen] Rendering: ProfileWelcome');
            return <ProfileWelcome onStart={handleStart} isLoading={loading} />;
          case 'age-verification':
            console.log('[ProfileSetupScreen] Rendering: AgeVerification');
            return (
              <AgeVerification
                onStartVerification={handleStartVerification}
                onBack={handleBack}
                isLoading={loading}
              />
            );
          case 'camera':
            console.log('[ProfileSetupScreen] Rendering: AgeVerificationCamera');
            return <AgeVerificationCamera onCaptured={handlePhotoCaptured} onCancel={handleBack} />;
          case 'verifying':
            console.log('[ProfileSetupScreen] Rendering: VerifyingLoader');
            return (
              <VerifyingLoader
                title="Verifying..."
                message="Please wait while we verify your identity with MyDigital ID."
                status="connecting"
              />
            );
          case 'verified':
            console.log('[ProfileSetupScreen] Rendering: VerifiedSuccess with age:', age);
            return (
              <VerifiedSuccess
                verifiedAge={age}
                userType={effectiveUserType}
                onContinue={handleContinueAfterVerification}
                isLoading={loading}
              />
            );
          case 'profile-form':
            console.log('[ProfileSetupScreen] Rendering: ProfileSetupForm');
            return (
              <ProfileSetupForm
                initialData={profileSetupInitial}
                userType={effectiveUserType}
                onNext={handleProfileSetupSubmit}
                onBack={handleBack}
                isLoading={loading}
                editMode={editMode}
              />
            );
          case 'profile-info':
            return (
              <ProfileInfoForm
                initialData={profileInfoInitial}
                onSubmit={handleProfileInfoSubmit}
                onBack={handleBack}
                isLoading={loading}
              />
            );
          case 'complete':
            return (
              <ProfileComplete
                onStartBrowsing={handleStartBrowsing}
                onViewProfile={handleViewProfile}
                isLoading={loading}
              />
            );
          default:
            console.warn('[ProfileSetupScreen] UNKNOWN STEP:', step, '- showing fallback');
            // Return a loading state instead of null to avoid white screen
            return (
              <VerifyingLoader
                title="Loading..."
                message="Please wait..."
                status="processing"
              />
            );
        }
      })()}
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
