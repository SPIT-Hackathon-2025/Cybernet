import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'pokemon-go-community',
  slug: 'pokemon-go-community',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff'
    }
  },
  plugins: [
    'expo-router',
    'expo-build-properties'
  ]
};

export default config; 