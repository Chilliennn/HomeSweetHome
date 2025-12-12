import { Stack } from 'expo-router';

/**
 * Main Group Layout
 * 
 * Handles main app screens for authenticated users with complete profiles:
 * - matching: Browse and match with elderly/youth
 * - bonding: Active relationship management
 */
export default function MainLayout() {
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
}
