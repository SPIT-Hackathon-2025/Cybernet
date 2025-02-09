import { useState } from 'react';
import { StyleSheet, View, ScrollView, Switch, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { storageService } from '@/services/storageService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';

type PrivacyOption = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: boolean;
};

export default function PrivacyScreen() {
  const { theme } = useTheme();
  const [options, setOptions] = useState<PrivacyOption[]>([
    {
      id: 'location_history',
      title: 'Location History',
      description: 'Store your location history for better recommendations',
      icon: 'location',
      value: true,
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Help improve the app by sharing usage data',
      icon: 'analytics',
      value: true,
    },
    {
      id: 'personalization',
      title: 'Personalization',
      description: 'Allow app to personalize your experience',
      icon: 'person',
      value: true,
    },
    {
      id: 'third_party',
      title: 'Third-Party Sharing',
      description: 'Share data with trusted partners',
      icon: 'share',
      value: false,
    },
  ]);
  const [guideEmotion, setGuideEmotion] = useState<'explaining' | 'thinking' | 'happy-with-football'>('explaining');

  const handleToggle = async (id: string) => {
    try {
      setGuideEmotion('thinking');
      const newOptions = options.map(option => 
        option.id === id ? { ...option, value: !option.value } : option
      );
      setOptions(newOptions);
      
      await storageService.setPreference(`privacy_${id}`, !options.find(o => o.id === id)?.value);
      
      setGuideEmotion('happy-with-football');
      Alert.alert(
        'Settings Updated',
        'Your privacy preferences have been saved.',
        [{ 
          text: 'OK',
          onPress: () => setGuideEmotion('explaining')
        }]
      );
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      setGuideEmotion('thinking');
      Alert.alert('Error', 'Failed to save privacy settings');
    }
  };

  const handleDataDeletion = () => {
    setGuideEmotion('thinking');
    Alert.alert(
      'Delete Personal Data',
      'Are you sure you want to request deletion of all your personal data? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setGuideEmotion('explaining'),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGuideEmotion('happy-with-football');
            Alert.alert(
              'Request Submitted',
              'Your data deletion request has been submitted. We will process it within 30 days.',
              [{
                text: 'OK',
                onPress: () => setGuideEmotion('explaining')
              }]
            );
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.backgroundDim]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle} color="#FFFFFF">
              Privacy Settings
            </ThemedText>
            <ThemedText style={styles.headerSubtitle} color="rgba(255, 255, 255, 0.9)">
              Manage your data and privacy preferences
            </ThemedText>
          </View>
          <PokeguideCharacter
            emotion={guideEmotion}
            size={60}
            style={styles.guideCharacter}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.infoCard}>
            <View style={[styles.infoIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="shield-checkmark" size={24} color={theme.primary} />
            </View>
            <ThemedText style={styles.infoText}>
              We value your privacy. Control how your data is collected and used.
            </ThemedText>
          </Card>
        </Animated.View>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <Animated.View key={option.id} entering={FadeInDown.delay(300 + index * 100)}>
              <Card style={styles.optionCard}>
                <View style={[styles.optionIcon, { backgroundColor: theme.backgroundDim }]}>
                  <Ionicons name={option.icon} size={24} color={theme.primary} />
                </View>
                <View style={styles.optionContent}>
                  <ThemedText style={styles.optionTitle}>{option.title}</ThemedText>
                  <ThemedText style={styles.optionDescription} dimmed>
                    {option.description}
                  </ThemedText>
                </View>
                <Switch
                  value={option.value}
                  onValueChange={() => handleToggle(option.id)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={option.value ? theme.background : theme.backgroundDim}
                />
              </Card>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: theme.backgroundDim }]}
          onPress={handleDataDeletion}
        >
          <Ionicons name="trash" size={24} color={theme.error} />
          <ThemedText style={[styles.deleteText, { color: theme.error }]}>
            Request Data Deletion
          </ThemedText>
        </TouchableOpacity>
      </View>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    flexShrink: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    flexShrink: 1,
    opacity: 0.9,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
  },
  guideCharacter: {
    transform: [{ scaleX: -1 }],
  },
}); 