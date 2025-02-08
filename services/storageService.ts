import AsyncStorage from '@react-native-async-storage/async-storage';

type AppPreferences = {
  theme: 'light' | 'dark' | 'system';
  hasSeenOnboarding: boolean;
  notificationsEnabled: boolean;
  locationEnabled: boolean;
  hapticsEnabled: boolean;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
  };
};

class StorageService {
  private readonly STORAGE_KEY_PREFIX = '@pokeguide:';

  constructor() {
    this.initializeDefaultPreferences();
  }

  private async initializeDefaultPreferences(): Promise<void> {
    const defaultPreferences: AppPreferences = {
      theme: 'system',
      hasSeenOnboarding: false,
      notificationsEnabled: true,
      locationEnabled: true,
      hapticsEnabled: true,
    };

    try {
      // Only set defaults if they don't exist
      for (const [key, value] of Object.entries(defaultPreferences)) {
        const existing = await this.getPreference(key as keyof AppPreferences);
        if (existing === null) {
          await this.setPreference(key as keyof AppPreferences, value);
        }
      }
    } catch (error) {
      console.error('Error initializing preferences:', error);
    }
  }

  async getPreference<K extends keyof AppPreferences>(key: K): Promise<AppPreferences[K] | null> {
    try {
      const value = await AsyncStorage.getItem(this.STORAGE_KEY_PREFIX + key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting preference ${key}:`, error);
      return null;
    }
  }

  async setPreference<K extends keyof AppPreferences>(key: K, value: AppPreferences[K]): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEY_PREFIX + key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.error(`Error setting preference ${key}:`, error);
      throw error;
    }
  }

  async getAllPreferences(): Promise<Partial<AppPreferences>> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY_PREFIX));
      const entries = await AsyncStorage.multiGet(prefixedKeys);
      
      return entries.reduce<Partial<AppPreferences>>((acc, [key, value]) => {
        if (value) {
          const prefKey = key.replace(this.STORAGE_KEY_PREFIX, '') as keyof AppPreferences;
          acc[prefKey] = JSON.parse(value);
        }
        return acc;
      }, {});
    } catch (error) {
      console.error('Error getting all preferences:', error);
      return {};
    }
  }

  async clearPreferences(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const prefixedKeys = keys.filter(key => key.startsWith(this.STORAGE_KEY_PREFIX));
      await AsyncStorage.multiRemove(prefixedKeys);
      await this.initializeDefaultPreferences();
    } catch (error) {
      console.error('Error clearing preferences:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService(); 