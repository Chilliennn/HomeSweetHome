import { createClient } from '@supabase/supabase-js';

function getEnvVar(name: 'SUPABASE_URL' | 'SUPABASE_ANON_KEY'): string {
  try {
    // runtime require so bundlers don't parse web-only code
    // @ts-ignore
    const Constants = require('expo-constants').default;
    const val = Constants?.expoConfig?.extra?.[name] || Constants?.manifest?.extra?.[name];
    if (val) {
      console.log(`[env] found ${name} in expo extras`);
      return val;
    }
  } catch { /* not running in Expo runtime */ }

  if (typeof process !== 'undefined' && process.env) {
    const v = process.env[`EXPO_PUBLIC_${name}`] || process.env[name] || '';
    if (v) console.log(`[env] found ${name} in process.env`);
    return v;
  }

  return '';
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

console.log('[env] supabaseUrl present?', !!supabaseUrl, 'anon present?', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check apps/mobile/.env or app.config.js extra.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);