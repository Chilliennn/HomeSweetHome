import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * Environment variables are accessed via process.env:
 * - React Native (Expo): Uses EXPO_PUBLIC_* prefix, automatically injected by Expo
 * - Web (Vite): Uses VITE_* prefix, mapped to EXPO_PUBLIC_* via vite.config.ts define
 */

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('[supabase] URL present?', !!supabaseUrl, 'Key present?', !!supabaseAnonKey);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Check your .env file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);