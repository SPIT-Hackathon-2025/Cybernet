import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="sign-in" 
        options={{ 
          title: 'Sign In',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{ 
          title: 'Sign Up',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="reset-password" 
        options={{ 
          title: 'Reset Password',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="welcome" 
        options={{ 
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 