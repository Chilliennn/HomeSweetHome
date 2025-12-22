import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { observer } from 'mobx-react-lite';
import {
  authViewModel,
  communicationViewModel,
  matchingViewModel,
  youthMatchingViewModel,
  elderMatchingViewModel,
  familyViewModel,
} from '@home-sweet-home/viewmodel';


/**
 * Main Group Layout
 * 
 * Handles main app screens for authenticated users with complete profiles:
 * - matching: Browse and match with elderly/youth
 * - bonding: Active relationship management
 * 
 * Syncs authViewModel state to other ViewModels for global user context.
 * Also monitors user suspension status and forces logout if suspended.
 */
export default observer(function MainLayout() {
  const authVM = authViewModel;
  const commVM = communicationViewModel;
  const matchVM = matchingViewModel;
  const youthVM = youthMatchingViewModel;
  const elderVM = elderMatchingViewModel;
  const familyVM = familyViewModel;
  const router = useRouter();
  const suspensionCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if user is suspended and force logout
  useEffect(() => {
    const checkSuspensionStatus = async () => {
      const userId = authVM.authState.currentUserId;
      if (!userId) return;

      try {
        // ✅ MVVM: Use ViewModel method instead of directly accessing Repository
        const isSuspended = await authVM.checkSuspensionStatus(userId);
        if (isSuspended) {
          // User has been suspended - force logout
          console.log('[MainLayout] User suspended, forcing logout');

          // Clear the interval
          if (suspensionCheckRef.current) {
            clearInterval(suspensionCheckRef.current);
            suspensionCheckRef.current = null;
          }

          // Sign out the user
          await authVM.signOut();

          // Show alert and redirect to login
          Alert.alert(
            'Account Suspended',
            'Your account has been suspended due to a violation of safety policies. Please contact support for more information.',
            [{ text: 'OK', onPress: () => router.replace('/login') }]
          );
        }
      } catch (error) {
        console.error('[MainLayout] Error checking suspension status:', error);
      }
    };

    // Start periodic check (every 30 seconds)
    const userId = authVM.authState.currentUserId;
    if (userId) {
      // Check immediately
      checkSuspensionStatus();
      // Then check every 30 seconds
      suspensionCheckRef.current = setInterval(checkSuspensionStatus, 30000);
    }

    return () => {
      if (suspensionCheckRef.current) {
        clearInterval(suspensionCheckRef.current);
        suspensionCheckRef.current = null;
      }
    };
  }, [authVM.authState.currentUserId]);

  useEffect(() => {
    const userId = authVM.authState.currentUserId || null;
    const userType =
      authVM.userType === 'youth' || authVM.userType === 'elderly'
        ? authVM.userType
        : null;

    console.log('🟦 [MainLayout] Syncing user to ViewModels:', { userId, userType });
    // Clear or set user context across ViewModels
    if (!userId) {
      console.log('🟦 [MainLayout] User logged out, clearing ViewModels');
      // CommunicationViewModel expects string userId; pass empty string to clear
      commVM.setCurrentUser('', null);
      // Known clearUser implementations
      matchVM.clearUser();
      elderVM.clearUser();
      familyVM.clearUser();
      // Youth VM may not implement clearUser; reset via setCurrentUser(null)
      youthVM.setCurrentUser(null);
    } else {
      // ✅ Sync user context to all ViewModels
      commVM.setCurrentUser(userId, userType);
      matchVM.setCurrentUser(userId, userType);
      // Note: youthVM.setCurrentUser is async but we don't await it here
      youthVM.setCurrentUser(userId);
      elderVM.setCurrentUser(userId);
      familyVM.setCurrentUser(userId);
    }
  }, [authVM.authState.currentUserId, authVM.userType]);
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    >
      <Stack.Screen name="matching" />
      <Stack.Screen name="bonding" />
      <Stack.Screen name="stageRequirements" />
      <Stack.Screen name="availableFeatures" />
      <Stack.Screen name="diary" />
      <Stack.Screen name="album" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notification" />
    </Stack>
  );
});
