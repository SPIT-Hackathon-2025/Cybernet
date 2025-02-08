import { supabase } from '@/lib/supabase';
import { handleSupabaseError, validateUsername } from '@/utils/errorHandling';

export interface SignUpData {
  email: string;
  password: string;
  username: string;
}

const generateUniqueUsername = async (baseUsername: string): Promise<string> => {
  let username = baseUsername;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('username', username)
      .single();

    if (error && error.code === 'PGRST116') {
      // No matching username found, we can use this one
      return username;
    }

    if (error) throw error;
    
    // If we found a match, try the next number
    username = `${baseUsername}${counter}`;
    counter++;

    // Prevent infinite loops
    if (counter > 100) {
      throw new Error('Unable to generate unique username');
    }
  }
};

export const signUpWithEmail = async ({ email, password, username }: SignUpData) => {
  try {
    // Validate username format
    const usernameError = validateUsername(username);
    if (usernameError) {
      throw new Error(usernameError);
    }

    // Try to get a unique username
    const uniqueUsername = await generateUniqueUsername(username);

    // Proceed with signup
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: uniqueUsername,
        },
      },
    });

    if (signUpError) throw signUpError;

    // Create user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user!.id,
          username: uniqueUsername,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueUsername}`,
        }
      ]);

    if (profileError) {
      // If profile creation fails, we should clean up the auth user
      await supabase.auth.admin.deleteUser(authData.user!.id);
      throw profileError;
    }

    return {
      ...authData,
      profile: {
        username: uniqueUsername,
      }
    };
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw handleSupabaseError(error);
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message === 'Invalid login credentials') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw handleSupabaseError(error);
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;
    return data;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw handleSupabaseError(error);
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
    return data;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw handleSupabaseError(error);
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: any) {
    if (error.message) {
      throw new Error(error.message);
    }
    throw handleSupabaseError(error);
  }
}; 