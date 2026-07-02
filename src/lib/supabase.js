/**
 * supabase.js — Supabase client singleton
 *
 * URL and anon key are read from EXPO_PUBLIC_* environment variables
 * (defined in .env). Hardcoded fallbacks are provided so the app still
 * runs during development without a .env file, but the anon key fallback
 * must be replaced with the real value from:
 *   Supabase Dashboard → Project Settings → API → anon / public key
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      || 'https://rbalfvuntyyztnspwhjq.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJiYWxmdnVudHl5enRuc3B3aGpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NzE3OTEsImV4cCI6MjA5NTM0Nzc5MX0.TXDeYlRgIci4cVagwgygs-0S_4xU6jaPS8Q7Cq4jdK0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:           AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
    flowType:          'implicit',
  },
});

export default supabase;
