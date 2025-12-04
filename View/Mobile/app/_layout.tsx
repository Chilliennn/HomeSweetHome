import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Root Layout
 * 
 * Manages the top-level navigation structure:
 * - (auth) group: Login, Profile Setup (for unauthenticated/incomplete profile users)
 * - (main) group: Matching, Bonding, etc. (for authenticated users with complete profile)
 * - (tabs) group: Tab navigation (if needed)
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Auth Group - Login & Profile Setup */}
        <Stack.Screen 
          name="(auth)" 
          options={{ 
            headerShown: false,
          }} 
        />
        
        {/* Main Group - Authenticated screens */}
        <Stack.Screen 
          name="(main)" 
          options={{ 
            headerShown: false,
          }} 
        />
        
        {/* Tab navigation */}
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
          }} 
        />
        
        {/* Modal */}
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal', 
            headerShown: true,
            title: 'Modal',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}