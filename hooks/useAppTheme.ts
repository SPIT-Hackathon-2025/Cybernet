import { useColorScheme } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const lightTheme = {
  colors: {
    primary: '#FF5D00',
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#4A4A4A',
    textDim: '#94A3B8',
    border: '#E5E5E5',
    notification: '#FF3B30',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FF5D00',
  },
  dark: false,
};

export const darkTheme = {
  colors: {
    primary: '#FF7D33',
    background: '#000000',
    card: '#1C1C1E',
    text: '#FFFFFF',
    textDim: '#A1A1A1',
    border: '#2C2C2E',
    notification: '#FF453A',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#FF7D33',
  },
  dark: true,
};

export function useAppTheme() {
  const { colorScheme } = useTheme();
  const systemColorScheme = useColorScheme();
  
  // Use the theme from context, fallback to system theme
  const effectiveColorScheme = colorScheme || systemColorScheme || 'light';
  
  return effectiveColorScheme === 'dark' ? darkTheme : lightTheme;
} 