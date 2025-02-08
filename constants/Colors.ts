/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#FF5D00';
const tintColorDark = '#FF8F00';

export const Colors = {
  light: {
    primary: '#FF5D00', // Pokemon Orange
    secondary: '#3B4CCA', // Pokemon Blue
    accent: '#FFDE00', // Pokemon Yellow
    success: '#2ECC71', // Green for verified issues
    warning: '#FFB900', // Yellow for pending issues
    error: '#FF3B30', // Red for errors
    background: '#FFFFFF',
    card: '#F8F9FA',
    text: '#1A1A1A',
    border: '#E1E1E1',
    notification: '#FF3B30',
    tint: tintColorLight,
    tabIconDefault: '#C4C4C4',
    tabIconSelected: tintColorLight,
  },
  dark: {
    primary: '#FF8F00', // Darker Pokemon Orange
    secondary: '#4A5CDA', // Darker Pokemon Blue
    accent: '#FFE83D', // Brighter Pokemon Yellow
    success: '#25A25A', // Darker Green
    warning: '#CC9400', // Darker Yellow
    error: '#CC2E26', // Darker Red
    background: '#1A1A1A',
    card: '#2D2D2D',
    text: '#FFFFFF',
    border: '#404040',
    notification: '#CC2E26',
    tint: tintColorDark,
    tabIconDefault: '#6E6E6E',
    tabIconSelected: tintColorDark,
  },
};
