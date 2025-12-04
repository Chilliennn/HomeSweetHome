import { Stack } from 'expo-router';

/**
 * Auth Group Layout
 * 
 * Handles authentication-related screens:
 * - login: User login
 * - profile-setup: UC-103 Complete Profile (age verification, real identity, etc.)
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen 
        name="login" 
        options={{ 
          animation: 'none', // No animation for initial screen
        }} 
      />
      <Stack.Screen 
        name="profile-setup" 
        options={{ 
          animation: 'slide_from_right',
          gestureEnabled: false, // Prevent swipe back during profile setup
        }} 
      />
    </Stack>
  );
}
