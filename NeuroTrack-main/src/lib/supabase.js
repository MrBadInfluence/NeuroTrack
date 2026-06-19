/**
 * supabase.js — Supabase client singleton
 *
 * Creates and exports the shared Supabase client used for all
 * database operations. AsyncStorage is used so the auth session
 * persists across app restarts (auto-refresh is enabled).
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL     = 'https://rbalfvuntyyztnspwhjq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cYFLeeN9-Jx4djzAbzhMQg_FtbKuvDU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage:           AsyncStorage,
    autoRefreshToken:  true,
    persistSession:    true,
    detectSessionInUrl: false,
  },
});

export default supabase;
