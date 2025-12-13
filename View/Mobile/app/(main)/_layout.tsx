import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { authViewModel, communicationViewModel, matchingViewModel } from '@home-sweet-home/viewmodel';
/**
 * Main Group Layout
 * 
 * Handles main app screens for authenticated users with complete profiles:
 * - matching: Browse and match with elderly/youth
 * - bonding: Active relationship management
 */
export default observer(function MainLayout() {
  const authVM = authViewModel;
  const commVM = communicationViewModel;
  const matchVM = matchingViewModel;

  useEffect(() => {
    const userId = authVM.authState.currentUserId || null;
    const userType =
      authVM.userType === 'youth' || authVM.userType === 'elderly'
        ? authVM.userType
        : null;

    commVM.setCurrentUser(userId!, userType!);
    matchVM.setCurrentUser(userId, userType);
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
