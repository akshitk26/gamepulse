import 'react-native-url-polyfill/auto'; // ensures URL works in RN
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const expoExtra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = expoExtra.SUPABASE_URL as string;
const supabaseAnonKey = expoExtra.SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Persist session securely in RN
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // RN does not use URL fragments
  },
});
