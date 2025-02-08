import { ConfigPlugin, withAndroidManifest } from '@expo/config-plugins';

const withAndroidCleartextTraffic: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add usesCleartextTraffic="true" to the application
    if (androidManifest.application) {
      androidManifest.application[0].$['android:usesCleartextTraffic'] = 'true';
    }

    return config;
  });
};

export default withAndroidCleartextTraffic; 