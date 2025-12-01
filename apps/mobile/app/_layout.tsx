import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}>
        {/* Auth screens MUST come first */}
        <Stack.Screen 
          name="login" 
          options={{ 
            headerShown: false,
            animation: 'none' // Prevents animation flash on initial load
          }} 
        />
        <Stack.Screen name="matching" options={{ headerShown: false }} />
        <Stack.Screen name="bonding" options={{ headerShown: false }} />
        
        {/* Tab navigation */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Modal */}
        <Stack.Screen 
          name="modal" 
          options={{ 
            presentation: 'modal', 
            headerShown: true,
            title: 'Modal' 
          }} 
        />
        
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}