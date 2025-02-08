import { Session, User, AuthError } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error.message);
        return;
      }
      handleAuthStateChange('INITIAL', session);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthStateChange = async (event: string, session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    
    if (session?.user) {
      await loadUserProfile(session.user.id);
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      }
    } else {
      setUserProfile(null);
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/sign-in');
      }
    }
    
    setLoading(false);
  };

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingProfile) {
        const defaultProfile = {
          id: userId,
          username: user?.email?.split('@')[0] || 'Trainer',
          trainer_level: 1,
          civic_coins: 0,
          trust_score: 0,
          rank: 'Novice Trainer',
          badges: [],
          created_at: new Date().toISOString(),
        };

        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert([defaultProfile])
          .select()
          .single();

        if (createError) throw createError;
        setUserProfile(newProfile);
      } else {
        setUserProfile(existingProfile);
      }
    } catch (error: any) {
      console.error('Error loading/creating user profile:', error.message);
      Alert.alert('Profile Error', 'Failed to load user profile');
    }
  };

  const handleAuthError = (error: AuthError, action: string) => {
    let message = 'An error occurred';
    
    switch (error.message) {
      case 'Invalid login credentials':
        message = 'Incorrect email or password';
        break;
      case 'Email not confirmed':
        message = 'Please verify your email address';
        break;
      case 'Password should be at least 6 characters':
        message = 'Password must be at least 6 characters';
        break;
      case 'User already registered':
        message = 'An account with this email already exists';
        break;
      default:
        message = error.message;
    }
    
    Alert.alert(`${action} Error`, message);
    throw error;
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'pokemongo-community://auth-callback',
          skipBrowserRedirect: true
        }
      });

      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error, 'Google Sign In');
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      });

      if (error) throw error;
      Alert.alert(
        'Verification Required',
        'Please check your email for a verification link'
      );
      router.replace('/(auth)/sign-in');
    } catch (error: any) {
      handleAuthError(error, 'Sign Up');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error, 'Sign In');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      handleAuthError(error, 'Sign Out');
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pokemongo-community://reset-password',
      });
      if (error) throw error;
      Alert.alert(
        'Password Reset',
        'Check your email for password reset instructions'
      );
    } catch (error: any) {
      handleAuthError(error, 'Password Reset');
    }
  };

  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });
      if (error) throw error;
      Alert.alert('Success', 'Your password has been updated');
    } catch (error: any) {
      handleAuthError(error, 'Password Update');
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
        resetPassword,
        updatePassword,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 