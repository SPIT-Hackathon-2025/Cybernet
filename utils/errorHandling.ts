import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  message: string;
  code: string;
  details?: string;
}

export const handleSupabaseError = (error: PostgrestError): AppError => {
  switch (error.code) {
    case '23505':
      if (error.details?.includes('user_profiles_username_key')) {
        return {
          message: 'This username is already taken. Please choose another one.',
          code: 'USERNAME_TAKEN',
          details: error.details
        };
      }
      return {
        message: 'A record with this information already exists.',
        code: 'DUPLICATE_ENTRY',
        details: error.details
      };
    
    case 'PGRST202':
      return {
        message: 'The requested operation is not available.',
        code: 'FUNCTION_NOT_FOUND',
        details: error.details
      };
      
    default:
      return {
        message: 'An unexpected error occurred. Please try again.',
        code: error.code,
        details: error.details
      };
  }
};

export const handleLocationError = (error: any): AppError => {
  if (error.code === 'PERMISSION_DENIED') {
    return {
      message: 'Location permission is required to show nearby venues.',
      code: 'LOCATION_PERMISSION_DENIED'
    };
  }
  
  return {
    message: 'Unable to get your location. Please check your settings.',
    code: 'LOCATION_ERROR'
  };
};

export const isUsernameValid = (username: string): boolean => {
  // Username should be 3-20 characters, alphanumeric with underscores and dots
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  return usernameRegex.test(username);
};

export const validateUsername = (username: string): string | null => {
  if (!username) {
    return 'Username is required';
  }
  if (!isUsernameValid(username)) {
    return 'Username must be 3-20 characters long and can only contain letters, numbers, dots, and underscores';
  }
  return null;
}; 