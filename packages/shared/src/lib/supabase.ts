import { createClient } from '@supabase/supabase-js';

// get env variable
function getEnvVar(name: string): string {
  // Expo (React Native) - using EXPO——PUBLIC :D
  if (typeof process !== 'undefined' && process.env) {
    const expoValue = process.env[`EXPO_PUBLIC_${name}`];
    if (expoValue) return expoValue;
  }

  // Vite (Web) - using VITE :D
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const viteValue = (import.meta as any).env[`VITE_${name}`];
    if (viteValue) return viteValue;
  }

  return '';
}

const supabaseUrl = getEnvVar('SUPABASE_URL');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase credentials not found. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);