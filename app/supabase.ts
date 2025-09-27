// supabase.ts (at project root, next to App.tsx)
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined;

// Helpful during setup:
if (!url) console.warn('⚠️ Missing EXPO_PUBLIC_SUPABASE_URL');
if (!key) console.warn('⚠️ Missing EXPO_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient(url!, key!, {
  auth: {
    storage: {
      getItem: (k) => AsyncStorage.getItem(k),
      setItem: (k, v) => AsyncStorage.setItem(k, v),
      removeItem: (k) => AsyncStorage.removeItem(k),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
