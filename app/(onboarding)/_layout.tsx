import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          title: 'Welcome',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="onboarding" 
        options={{ 
          title: 'Get Started',
          headerShown: false 
        }} 
      />
    </Stack>
  );
} 