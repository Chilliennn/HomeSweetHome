import { createClient } from '@supabase/supabase-js';

function getEnvVar(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  // 1. Try Expo Constants (for React Native)
  try {
    // Obfuscate require so Vite/esbuild doesn't try to bundle 'react-native' code
    // @ts-ignore
    const packageName = 'expo-constants';
    const Constants = require(packageName).default;
    const val = Constants?.expoConfig?.extra?.[name] || Constants?.manifest?.extra?.[name];
    if (val) {
      console.log(`[env] found ${name} in expo extras`);
      return val;
    }
  } catch {
    /* not running in Expo runtime */
  }

  // 2. Try process.env (Explicit access for Vite replacement compatibility)
  // We cannot use dynamic keys process.env[name] because Vite replaces strings statically.
  try {
    if (name === 'SUPABASE_URL') {
      return process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    }
    if (name === 'SUPABASE_ANON_KEY') {
      return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    }
  } catch (e) {
    // Ignore error if process is not defined
  }

  console.warn(`[env] ${name} not found in any environment`);
  return '';
}



const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

console.log('[supabase] URL present?', !!supabaseUrl, 'Key present?', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check your .env file.');
  console.warn('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in View/Web/.env');
  console.warn('Or: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in View/Mobile/.env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);