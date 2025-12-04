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
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="matching" />
      <Stack.Screen name="bonding" />
    </Stack>
  );
}
