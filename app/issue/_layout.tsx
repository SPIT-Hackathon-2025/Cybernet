import { Stack } from 'expo-router';

export default function IssueLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Issue Details',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="create" 
        options={{ 
          title: 'Report Issue',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
} 