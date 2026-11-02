import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase config missing: Please provide EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Safe fallback prevents createClient from throwing synchronously at module load if .env is missing
const safeSupabaseUrl = rawSupabaseUrl || 'https://placeholder.supabase.co';
const safeSupabaseAnonKey = rawSupabaseAnonKey || 'placeholder-anon-key';

export const supabase = createClient(safeSupabaseUrl, safeSupabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: isSupabaseConfigured,
    persistSession: isSupabaseConfigured,
    detectSessionInUrl: false,
  },
});
