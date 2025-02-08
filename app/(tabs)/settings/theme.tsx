import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Text } from '@/components/Themed';
import { Stack } from 'expo-router';

export default function ThemeScreen() {
  const { themePreference, setThemePreference } = useTheme();
  const theme = useAppTheme();

  const themeOptions = [
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
    { label: 'System', value: 'system' },
  ] as const;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Theme',
          headerStyle: {
            backgroundColor: theme.colors.background,
          },
          headerTintColor: theme.colors.text,
        }} 
      />
      
      <View style={styles.optionsContainer}>
        {themeOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              { 
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderWidth: 1,
              },
              themePreference === option.value && {
                borderColor: theme.colors.primary,
                borderWidth: 2,
              },
            ]}
            onPress={() => setThemePreference(option.value)}
          >
            <Text
              style={[
                styles.optionText,
                { color: theme.colors.text },
                themePreference === option.value && { color: theme.colors.primary },
              ]}
            >
              {option.label}
            </Text>
            {themePreference === option.value && (
              <View style={[styles.checkmark, { backgroundColor: theme.colors.primary }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
}); 