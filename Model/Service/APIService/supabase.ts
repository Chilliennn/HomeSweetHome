import { createClient } from '@supabase/supabase-js';

function getEnvVar(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  // 1. Try Expo Constants (for React Native)
  try {
    // runtime require so bundlers don't parse web-only code
    // @ts-ignore
    const Constants = require('expo-constants').default;
    const val = Constants?.expoConfig?.extra?.[name] || Constants?.manifest?.extra?.[name];
    if (val) {
      console.log(`[env] found ${name} in expo extras`);
      return val;
    }
  } catch {
    /* not running in Expo runtime */
  }

  // 2. Try process.env (for Node.js / React Native)
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env[`EXPO_PUBLIC_${name}`] || process.env[`VITE_${name}`] || process.env[name] || '';
    if (v) {
      console.log(`[env] found ${name} in process.env`);
      return v;
    }
  }

  // 3. Try import.meta.env (for Vite/Web)
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const v = (import.meta.env as any)[`VITE_${name}`] || '';
    if (v) {
      console.log(`[env] found ${name} in import.meta.env`);
      return v;
    }
  }

  console.warn(`[env] ${name} not found in any environment`);
  return '';
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check your .env file.');
  console.warn('Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in View/Web/.env');
  console.warn('Or: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in View/Mobile/.env');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);