import { Stack } from 'expo-router';

export default function IssueLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="new" 
        options={{ 
          title: 'Report New Issue',
          presentation: 'modal'
        }} 
      />
      <Stack.Screen 
        name="[id]" 
        options={{ 
          title: 'Issue Details',
          presentation: 'modal'
        }} 
      />
    </Stack>
  );
} 