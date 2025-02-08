/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FF5D00';
const tintColorDark = '#FF8F00';

export const Colors = {
  primary: '#FF5D00', // Vibrant orange
  secondary: '#FF8534', // Lighter orange
  tertiary: '#FFB085', // Pale orange
  background: {
    dark: '#1A1A1A', // Almost black
    light: '#F5F5F5', // Light grey
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#4A4A4A',
    light: '#FFFFFF',
  },
  border: {
    light: 'rgba(0,0,0,0.1)',
    dark: 'rgba(255,255,255,0.1)',
  },
  gradient: {
    orange: ['#FF5D00', '#FF8534', '#FFB085'],
    dark: ['#1A1A1A', '#2A2A2A', '#3A3A3A'],
  },
  light: {
    accent: '#FFDE00', // Pokemon Yellow
    success: '#2ECC71', // Green for verified issues
    warning: '#FFB900', // Yellow for pending issues
    error: '#FF3B30', // Red for errors
    card: '#F8F9FA',
    notification: '#FF3B30',
    tint: tintColorLight,
    tabIconDefault: '#C4C4C4',
    tabIconSelected: tintColorLight,
  },
  dark: {
    accent: '#FFE83D', // Brighter Pokemon Yellow
    success: '#25A25A', // Darker Green
    warning: '#CC9400', // Darker Yellow
    error: '#CC2E26', // Darker Red
    card: '#2D2D2D',
    notification: '#CC2E26',
    tint: tintColorDark,
    tabIconDefault: '#6E6E6E',
    tabIconSelected: tintColorDark,
  },
};
