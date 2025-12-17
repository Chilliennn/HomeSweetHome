import { createClient } from '@supabase/supabase-js';

// Declare process for environments where it may not be defined (browser)
declare var process: { env: Record<string, string | undefined> } | undefined;

// Vite import.meta.env type declaration
declare const import_meta_env: Record<string, string | undefined> | undefined;

function getEnvVar(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  // 1. Try Vite import.meta.env (for Web builds)
  try {
    // @ts-ignore - import.meta is available in Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const viteValue = import.meta.env[`VITE_${name}`];
      if (viteValue) {
        console.log(`[env] found ${name} in import.meta.env`);
        return viteValue;
      }
    }
  } catch {
    /* not in Vite environment */
  }

  // 2. Try Expo Constants (for React Native)
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

  // 3. Try process.env (for Node.js / SSR)
  if (typeof process !== 'undefined' && process.env) {
    const v = process.env[`EXPO_PUBLIC_${name}`] || process.env[`VITE_${name}`] || process.env[name] || '';
    if (v) {
      console.log(`[env] found ${name} in process.env`);
      return v;
    }
  }

  return '';
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

console.log('[env] supabaseUrl present? ', !!supabaseUrl, 'anon present?', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found.  Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);