import { createClient } from '@supabase/supabase-js';

function getEnvVar(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  // 1. Try Expo Constants (for React Native)
  try {
    // runtime require so bundlers don't parse web-only code
    // @ts-ignore
    const Constants = require('expo-constants'). default;
    const val = Constants?.expoConfig?.extra?.[name] || Constants?.manifest?.extra?.[name];
    if (val) {
      console.log(`[env] found ${name} in expo extras`);
      return val;
    }
  } catch {
    /* not running in Expo runtime */
  }

  // 2.  Try process.env (for Node.js / React Native)
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env[`EXPO_PUBLIC_${name}`] || process.env[`VITE_${name}`] || process.env[name] || '';
    if (v) {
      console.log(`[env] found ${name} in process. env`);
      return v;
    }
  }

  // 3.  Try globalThis for Vite (Web) - safer than import.meta
  try {
    // @ts-ignore
    if (typeof globalThis !== 'undefined' && globalThis.__VITE_ENV__) {
      // @ts-ignore
      const viteValue = globalThis.__VITE_ENV__[`VITE_${name}`];
      if (viteValue) {
        console.log(`[env] found ${name} in globalThis.__VITE_ENV__`);
        return viteValue;
      }
    }
  } catch {
    /* not in Vite environment */
  }

  return '';
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

console.log('[env] supabaseUrl present? ', !!supabaseUrl, 'anon present?', !!supabaseAnonKey);

if (! supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found.  Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);