/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Colors as ColorTypes } from '@/types';

const tintColorLight = '#FF5D00';
const tintColorDark = '#FF8F00';

const lightTheme = {
  primary: '#FF5D00',    // Vibrant orange
  secondary: '#CC4A00',  // Deep orange
  accent: '#FF8533',     // Light orange
  success: '#2ECC71',    // Green
  warning: '#FFB900',    // Yellow
  error: '#E74C3C',      // Red
  card: '#F5F5F5',       // Light grey
  notification: '#FF3B30',
  tint: tintColorLight,
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#FF5D00',
  text: '#4A4A4A',       // Dark grey for better readability
  textDim: '#94A3B8',    // Medium grey for secondary text
  background: '#FFFFFF',  // Pure white
  backgroundDim: '#F8F9FA', // Slightly dimmed white
  border: '#E5E5E5',     // Light grey border
  overlay: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  gradientStart: '#FF5D00',
  gradientEnd: '#FFB900',
  cardGradientStart: '#FFFFFF',
  cardGradientEnd: '#F5F5F5',
  modalBackground: '#FFFFFF',
} as const;

const darkTheme = {
  primary: '#FF7D33',    // Lighter orange for dark mode
  secondary: '#FF5D00',  // Original orange
  accent: '#FFAC7F',     // Very light orange
  success: '#4CD964',    // Brighter green
  warning: '#FFD60A',    // Brighter yellow
  error: '#FF453A',      // Brighter red
  card: '#1C1C1E',       // Dark grey
  notification: '#FF453A',
  tint: tintColorDark,
  tabIconDefault: '#94A3B8',
  tabIconSelected: '#FF7D33',
  text: '#FFFFFF',       // Pure white for main text
  textDim: '#A1A1A1',    // Light grey for secondary text
  background: '#000000',  // Pure black
  backgroundDim: '#1A1A1A', // Slightly lighter black
  border: '#2C2C2E',     // Dark grey border
  overlay: 'rgba(0, 0, 0, 0.7)', // Darker semi-transparent overlay
  gradientStart: '#1A1A1A',
  gradientEnd: '#2C2C2E',
  cardGradientStart: '#2C2C2E',
  cardGradientEnd: '#1A1A1A',
  modalBackground: '#1A1A1A',
} as const;

export const Colors = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type Theme = typeof lightTheme;
export type ThemeColors = keyof Theme;
