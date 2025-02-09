import { StyleSheet, View, ScrollView, Switch, Alert, useColorScheme, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { storageService } from '@/services/storageService';

type SettingOption = {
  id: string;
  title: string;
  description: string;
  type: 'toggle' | 'action';
  icon: keyof typeof Ionicons.glyphMap;
  value?: boolean;
  onPress?: () => void;
};

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { theme, themePreference, setThemePreference } = useTheme();
  const [preferences, setPreferences] = useState<{
    notifications: boolean;
    location: boolean;
    haptics: boolean;
  }>({
    notifications: true,
    location: true,
    haptics: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const [notifications, location, haptics] = await Promise.all([
        storageService.getPreference('notificationsEnabled'),
        storageService.getPreference('locationEnabled'),
        storageService.getPreference('hapticsEnabled'),
      ]);

      setPreferences({
        notifications: notifications ?? true,
        location: location ?? true,
        haptics: haptics ?? true,
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };
  
  const [settings, setSettings] = useState<SettingOption[]>([
    {
      id: 'notifications',
      title: 'Push Notifications',
      description: 'Receive alerts about nearby issues and updates',
      type: 'toggle',
      icon: 'notifications',
      value: preferences.notifications,
    },
    {
      id: 'location',
      title: 'Location Services',
      description: 'Allow app to access your location while in use',
      type: 'toggle',
      icon: 'location',
      value: preferences.location,
    },
    {
      id: 'haptics',
      title: 'Haptic Feedback',
      description: 'Enable vibration feedback for actions',
      type: 'toggle',
      icon: 'phone-portrait',
      value: preferences.haptics,
    },
    {
      id: 'theme',
      title: 'Theme',
      description: 'Choose between light, dark, or system theme',
      type: 'action',
      icon: 'moon',
      onPress: () => showThemeOptions(),
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Manage your data and privacy preferences',
      type: 'action',
      icon: 'shield',
      onPress: () => router.push('/(more)/privacy'),
    },
    {
      id: 'about',
      title: 'About',
      description: 'Learn more about PokemonGo: Community Edition',
      type: 'action',
      icon: 'information-circle',
      onPress: () => router.push('/(more)/about'),
    },
  ]);

  const handleToggle = async (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newPreferences = { ...preferences };
    switch (id) {
      case 'notifications':
        newPreferences.notifications = !preferences.notifications;
        await storageService.setPreference('notificationsEnabled', newPreferences.notifications);
        break;
      case 'location':
        newPreferences.location = !preferences.location;
        await storageService.setPreference('locationEnabled', newPreferences.location);
        break;
      case 'haptics':
        newPreferences.haptics = !preferences.haptics;
        await storageService.setPreference('hapticsEnabled', newPreferences.haptics);
        break;
    }
    setPreferences(newPreferences);

    setSettings(prev => prev.map(setting => 
      setting.id === id && setting.type === 'toggle'
        ? { ...setting, value: !setting.value }
        : setting
    ));
  };

  const showThemeOptions = () => {
    Alert.alert(
      'Choose Theme',
      'Select your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => setThemePreference('light'),
          style: themePreference === 'light' ? 'destructive' : 'default',
        },
        {
          text: 'Dark',
          onPress: () => setThemePreference('dark'),
          style: themePreference === 'dark' ? 'destructive' : 'default',
        },
        {
          text: 'System',
          onPress: () => setThemePreference('system'),
          style: themePreference === 'system' ? 'destructive' : 'default',
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            signOut();
          },
        },
      ],
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <ThemedText type="title" style={styles.headerTitle} color="#FFFFFF">Settings</ThemedText>
        <ThemedText style={styles.headerSubtitle} color="rgba(255, 255, 255, 0.9)">
          Customize your app experience
        </ThemedText>
      </View>

      <View style={styles.settingsContainer}>
        {settings.map((setting) => (
          <Card key={setting.id} style={styles.settingCard}>
            <View style={[styles.settingIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name={setting.icon} size={24} color={theme.primary} />
            </View>
            <View style={styles.settingContent}>
              <ThemedText style={styles.settingTitle}>{setting.title}</ThemedText>
              <ThemedText style={styles.settingDescription} dimmed>
                {setting.description}
              </ThemedText>
            </View>
            {setting.type === 'toggle' ? (
              <Switch
                value={setting.value}
                onValueChange={() => handleToggle(setting.id)}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={setting.value ? theme.background : theme.backgroundDim}
              />
            ) : (
              <TouchableOpacity onPress={setting.onPress}>
                <Ionicons 
                  name="chevron-forward" 
                  size={24} 
                  color={theme.primary} 
                />
              </TouchableOpacity>
            )}
          </Card>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { backgroundColor: theme.backgroundDim }]} 
        onPress={handleLogout}
      >
        <Ionicons name="log-out" size={24} color={theme.error} />
        <ThemedText style={[styles.logoutText, { color: theme.error }]}>Logout</ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  settingsContainer: {
    padding: 16,
    gap: 12,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 