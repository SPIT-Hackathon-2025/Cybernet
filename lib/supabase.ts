import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';

// Check if environment variables are set
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  console.error('Missing required Supabase environment variables:', {
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceRoleKey: !!supabaseServiceRoleKey
  });
  throw new Error('Missing required environment variables for Supabase configuration');
}

// Get the host dynamically based on platform
const getRedirectUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8081';
  }
  // For native platforms, use your app scheme
  return 'pokemongo-community://auth-callback';
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-App-Platform': Platform.OS,
    },
  },
});

// Listen for auth state changes
supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
  if (event === 'SIGNED_IN') {
    const user = session?.user;
    if (user && !user.email_confirmed_at) {
      // User is not verified but still signed in
      console.log('User signed in but email not verified');
    }
  }
});

// Create admin client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

// Helper functions for auth
export const signUpWithEmail = async (email: string, password: string, username?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getRedirectUrl(),
      data: {
        username: username || email.split('@')[0],
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
};

export const resendVerificationEmail = async (email: string) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
  });
  
  if (error) throw error;
  return data;
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl() + '/reset-password',
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// Helper to check if user is verified
export const isEmailVerified = (session: Session | null): boolean => {
  return !!session?.user?.email_confirmed_at;
}; 