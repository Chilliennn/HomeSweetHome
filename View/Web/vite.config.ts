import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file from this directory
  const env = loadEnv(mode, __dirname, '')

  return {
    plugins: [react()],
    // Inject VITE_* env vars into process.env so the shared Model layer can access them
    // This allows Model code to use process.env.EXPO_PUBLIC_* consistently
    define: {
      // Legacy VITE_ direct access
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      // EXPO_PUBLIC_ compatibility layer (for shared Model code)
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'process.env.EXPO_PUBLIC_ASSEMBLYAI_API_KEY': JSON.stringify(env.VITE_ASSEMBLYAI_API_KEY),
      // Gemini AI configuration
      'process.env.EXPO_PUBLIC_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.EXPO_PUBLIC_GEMINI_MODEL': JSON.stringify(env.VITE_GEMINI_MODEL),
      'process.env.EXPO_PUBLIC_GEMINI_API_VERSION': JSON.stringify(env.VITE_GEMINI_API_VERSION),
    },
    resolve: {
      alias: {
        'react-native': 'react-native-web',
        'expo-file-system': path.resolve(__dirname, './src/stubs/expo-file-system.ts'),
        'expo-media-library': path.resolve(__dirname, './src/stubs/expo-media-library.ts'),
        'expo-av': path.resolve(__dirname, './src/stubs/expo-av.ts'),
        'expo-constants': path.resolve(__dirname, './src/stubs/expo-constants.ts'),
        'expo-device': path.resolve(__dirname, './src/stubs/expo-device.ts'),
        'expo-notifications': path.resolve(__dirname, './src/stubs/expo-notifications.ts'),
      },
    },
    optimizeDeps: {
      exclude: [
        'expo-file-system',
        'expo-media-library',
        'expo-av',
        'expo-constants',
        'expo-device',
        'expo-notifications',
      ],
    },
  }
})
