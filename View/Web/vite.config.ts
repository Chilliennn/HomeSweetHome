import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
