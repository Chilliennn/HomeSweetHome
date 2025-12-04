import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ProfileWelcome,
  AgeVerification,
  VerifyingLoader,
  VerifiedSuccess,
} from '@/AuthUI';
import type { UserType } from '@/AuthUI';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================
type ProfileSetupStep = 'welcome' | 'age-verification' | 'verifying' | 'verified';

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
 * - All business logic should be delegated to AuthViewModel
 * - State like verifiedAge and userType should come from ViewModel
 */
export default function ProfileSetupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Extract user info from login
  const userId = params.userId as string | undefined;
  const userName = params.userName as string | undefined;
  const userTypeFromDB = params.userType as 'youth' | 'elderly' | undefined;

  // ============================================================================
  // LOCAL UI STATE
  // Note: In full MVVM implementation, these would be observable properties
  // from AuthViewModel. Currently using local state for UI demonstration.
  // ============================================================================
  const [currentStep, setCurrentStep] = useState<ProfileSetupStep>('welcome');
  
  // TODO: Replace with ViewModel observables
  // These values should come from: authViewModel.verifiedAge, authViewModel.userType
  const [verifiedAge, setVerifiedAge] = useState<number>(0);
  const [userType, setUserType] = useState<UserType>(userTypeFromDB || 'youth');
  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // EVENT HANDLERS
  // Following MVVM: View only calls ViewModel methods, no business logic here
  // ============================================================================

  /**
   * Handle "Let's Start!" button press on Welcome screen
   * TODO: Call authViewModel.startProfileSetup() when ViewModel is ready
   */
  const handleStart = () => {
    setCurrentStep('age-verification');
  };

  /**
   * Handle "Start Verification" button press (UC103_2)
   * TODO: Call authViewModel.startAgeVerification() which will:
   * 1. Set loading state
   * 2. Call Service to initiate MyDigital ID verification
   * 3. Validate age based on user type (UC103_3: youth 18-40, UC103_4: elderly 60+)
   * 4. Update verifiedAge and userType from response
   * 5. Navigate to success or show error (A1, A2, A15)
   */
  const handleStartVerification = async () => {
    setIsLoading(true);
    setCurrentStep('verifying');

    // TODO: Replace with actual ViewModel call
    // await authViewModel.startAgeVerification(userId);
    // The ViewModel should:
    // 1. Call AuthService.verifyAgeWithMyDigitalID()
    // 2. AuthService validates age requirements (C2: Age Requirements)
    // 3. Update observable properties: verifiedAge, userType, isAgeVerified
    // 4. Handle errors: A1 (Invalid Age Youth), A2 (Invalid Age Elderly), A15 (Verification Failed)

    // Simulating verification process - REMOVE when ViewModel is implemented
    setTimeout(() => {
      // These values should come from ViewModel after verification
      // The age determines userType: 18-40 = youth, 60+ = elderly
      setVerifiedAge(25);
      setUserType('youth');
      setIsLoading(false);
      setCurrentStep('verified');
    }, 3000);
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
   * Handle back navigation
   */
  const handleBack = () => {
    if (currentStep === 'age-verification') {
      setCurrentStep('welcome');
    } else {
      router.back();
    }
  };

  /**
   * Handle "Continue to Profile" after successful verification
   * This continues to the next step of UC103: Real Identity Section (M3)
   * 
   * TODO: Call authViewModel.completeAgeVerification() which will:
   * 1. Save age verification status to user profile
   * 2. Continue to next profile setup step (real identity, display identity, profile info)
   */
  const handleContinue = () => {
    // TODO: Call authViewModel.completeAgeVerification()
    // TODO: Continue to next step in profile setup (Real Identity Section)
    // For now, navigate to matching (will be replaced with next profile step)
    router.replace({
      pathname: '/(main)/matching',
      params: { 
        userId, 
        userName,
        userType,
        verifiedAge: verifiedAge.toString(),
        ageVerified: 'true',
      },
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderCurrentStep = () => {
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
            verifiedAge={verifiedAge}
            userType={userType}
            onContinue={handleContinue}
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
}

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F6',
  },
});
