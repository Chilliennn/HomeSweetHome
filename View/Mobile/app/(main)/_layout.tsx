import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
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
 */
export default observer(function MainLayout() {
  const authVM = authViewModel;
  const commVM = communicationViewModel;
  const matchVM = matchingViewModel;
  const youthVM = youthMatchingViewModel;
  const elderVM = elderMatchingViewModel;
  const familyVM = familyViewModel;

  useEffect(() => {
    const userId = authVM.authState.currentUserId || null;
    const userType =
      authVM.userType === 'youth' || authVM.userType === 'elderly'
        ? authVM.userType
        : null;

    console.log('🟦 [MainLayout] Syncing user to ViewModels:', { userId, userType });

    // ✅ Sync user context to all ViewModels
    commVM.setCurrentUser(userId!, userType!);
    matchVM.setCurrentUser(userId, userType);
    // Note: youthVM.setCurrentUser is async but we don't await it here
    // It will fetch the profile in the background
    youthVM.setCurrentUser(userId);
    elderVM.setCurrentUser(userId);
    familyVM.setCurrentUser(userId);
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
