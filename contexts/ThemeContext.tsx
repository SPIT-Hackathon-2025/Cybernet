import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, Theme } from '@/constants/Colors';
import { storageService } from '@/services/storageService';

type ThemePreference = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: Theme;
  colorScheme: 'light' | 'dark';
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedPreference = await storageService.getPreference('theme');
      if (savedPreference) {
        setThemePreferenceState(savedPreference);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setThemePreference = async (preference: ThemePreference) => {
    try {
      await storageService.setPreference('theme', preference);
      setThemePreferenceState(preference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Determine the actual color scheme based on preference and system setting
  const colorScheme = themePreference === 'system' 
    ? systemColorScheme ?? 'light'
    : themePreference;

  const theme = Colors[colorScheme] as Theme;

  // Don't render children until we've loaded the theme preference
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{
        theme,
        colorScheme,
        themePreference,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 