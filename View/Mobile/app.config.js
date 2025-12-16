import 'dotenv/config'; // loads apps/mobile/.env during local dev

export default ({ config }) => ({
  ...config,
  extra: {
    SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '',
    GEMINI_MODEL: process.env.EXPO_PUBLIC_GEMINI_MODEL ?? '',
    GEMINI_API_VERSION: process.env.EXPO_PUBLIC_GEMINI_API_VERSION ?? '',
  },
});