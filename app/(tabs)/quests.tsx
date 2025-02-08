import { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Quest, QuestType } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { useColorScheme } from 'react-native';
import { CivicCoin } from '@/components/CivicCoin';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

// Quest pool with all possible quests
const QUEST_POOL = [
  {
    id: 'verify_issues_small',
    title: 'Issue Verifier',
    description: 'Verify 3 reported issues in your area',
    reward_amount: 50,
    required: 3,
    type: 'verify_issues',
  },
  {
    id: 'verify_issues_medium',
    title: 'Verification Expert',
    description: 'Verify 5 reported issues today',
    reward_amount: 80,
    required: 5,
    type: 'verify_issues',
  },
  {
    id: 'report_issues_small',
    title: 'Community Reporter',
    description: 'Report 2 community issues',
    reward_amount: 40,
    required: 2,
    type: 'report_issues',
  },
  {
    id: 'report_issues_medium',
    title: 'Active Reporter',
    description: 'Report 4 issues in different locations',
    reward_amount: 70,
    required: 4,
    type: 'report_issues',
  },
  {
    id: 'lost_items_small',
    title: 'Lost Item Helper',
    description: 'Report 1 found item',
    reward_amount: 30,
    required: 1,
    type: 'help_found_items',
  },
  {
    id: 'lost_items_medium',
    title: 'Lost & Found Hero',
    description: 'Help return 2 lost items to their owners',
    reward_amount: 60,
    required: 2,
    type: 'help_found_items',
  },
  {
    id: 'locations_small',
    title: 'Area Explorer',
    description: 'Visit 3 different locations on the map',
    reward_amount: 40,
    required: 3,
    type: 'visit_locations',
  },
  {
    id: 'locations_medium',
    title: 'District Explorer',
    description: 'Visit and verify issues in 5 locations',
    reward_amount: 75,
    required: 5,
    type: 'visit_locations',
  },
  {
    id: 'daily_login',
    title: 'Daily Check-in',
    description: 'Log in and check community updates',
    reward_amount: 20,
    required: 1,
    type: 'daily_login',
  },
  {
    id: 'verify_urgent',
    title: 'Urgent Verifier',
    description: 'Verify 2 urgent reported issues',
    reward_amount: 60,
    required: 2,
    type: 'verify_issues',
  },
  {
    id: 'report_safety',
    title: 'Safety Guardian',
    description: 'Report 2 safety-related issues',
    reward_amount: 55,
    required: 2,
    type: 'report_issues',
  },
  {
    id: 'help_community',
    title: 'Community Helper',
    description: 'Help resolve 2 community issues',
    reward_amount: 65,
    required: 2,
    type: 'verify_issues',
  },
  {
    id: 'explore_new',
    title: 'New Area Scout',
    description: 'Report issues from 2 new locations',
    reward_amount: 45,
    required: 2,
    type: 'visit_locations',
  },
  {
    id: 'lost_urgent',
    title: 'Urgent Recovery',
    description: 'Help with urgent lost item reports',
    reward_amount: 50,
    required: 1,
    type: 'help_found_items',
  },
  {
    id: 'verification_streak',
    title: 'Verification Streak',
    description: 'Verify 3 issues within an hour',
    reward_amount: 70,
    required: 3,
    type: 'verify_issues',
  },
];

// Function to get today's date as a string (for comparing quest dates)
const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

// Function to get end of day timestamp
const getEndOfDay = () => {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

// Function to get end of third day timestamp
const getEndOfThirdDay = () => {
  const date = new Date();
  date.setDate(date.getDate() + 3);
  date.setHours(23, 59, 59, 999);
  return date.toISOString();
};

// Function to check if quest is new (less than 1 day old)
const isQuestNew = (expiresAt: string) => {
  const expiryDate = new Date(expiresAt);
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() + 2);
  return expiryDate > twoDaysAgo;
};

// Function to format remaining time
const formatTimeLeft = (expiresAt: string) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

// Function to randomly select daily quests
const selectDailyQuests = () => {
  // Shuffle quest pool
  const shuffled = [...QUEST_POOL].sort(() => Math.random() - 0.5);
  
  // Always include daily login quest
  const dailyLoginQuest = QUEST_POOL.find(q => q.id === 'daily_login');
  const selectedQuests = dailyLoginQuest ? [dailyLoginQuest] : [];
  
  // Add 2 more random quests
  selectedQuests.push(...shuffled.filter(q => q.id !== 'daily_login').slice(0, 2));

  // Convert to active quests with progress
  return selectedQuests.map(quest => ({
    ...quest,
    progress: 0,
    expires_at: getEndOfThirdDay(),
    status: 'active' as const,
    completed: false,
  }));
};

export default function QuestsScreen() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  // Load or refresh quests
  useEffect(() => {
    const loadQuests = async () => {
      try {
        setLoading(true);
        // In a real app, you'd fetch the user's current quests from the backend
        // For demo, we'll use localStorage/AsyncStorage
        const storedQuests = await AsyncStorage.getItem('userQuests');
        const storedDate = await AsyncStorage.getItem('questsDate');
        const today = getTodayString();

        if (storedQuests && storedDate === today) {
          setQuests(JSON.parse(storedQuests));
        } else {
          // Generate new daily quests
          const newQuests = selectDailyQuests();
          setQuests(newQuests as Quest[]);
          // Save new quests
          await AsyncStorage.setItem('userQuests', JSON.stringify(newQuests));
          await AsyncStorage.setItem('questsDate', today);
        }
      } catch (error) {
        console.error('Error loading quests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuests();
  }, []);

  const handleQuestAction = (quest: Quest) => {
    switch (quest.type) {
      case 'verify_issues':
        router.push('/');
        break;
      case 'report_issues':
        router.push('/report');
        break;
      case 'help_found_items':
        router.push('/lost-found');
        break;
      case 'visit_locations':
        router.push('/');
        break;
    }
  };

  const getQuestIcon = (type: QuestType): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'verify_issues':
        return 'checkmark-circle';
      case 'report_issues':
        return 'alert-circle';
      case 'help_found_items':
        return 'search';
      case 'visit_locations':
        return 'location';
      default:
        return 'star';
    }
  };

  const renderQuest = ({ item: quest }: { item: Quest }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)} 
      style={styles.questWrapper}
    >
      <Card style={styles.questCard}>
        {isQuestNew(quest.expires_at) && (
          <View style={styles.newBadge}>
            <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
          </View>
        )}
        
        <View style={styles.questIconContainer}>
          <View style={[styles.iconWrapper, { backgroundColor: theme.primary + '15' }]}>
            <Ionicons 
              name={getQuestIcon(quest.type)} 
              size={24} 
              color={theme.primary} 
            />
          </View>
        </View>

        <View style={styles.questContent}>
          <View style={styles.questHeader}>
            <View style={styles.titleContainer}>
              <ThemedText type="title" style={styles.questTitle}>
                {quest.title}
              </ThemedText>
              <View style={styles.timerContainer}>
                <Ionicons name="time-outline" size={14} color={theme.textDim} />
                <ThemedText style={styles.timerText} dimmed>
                  {formatTimeLeft(quest.expires_at)}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.rewardBadge, { backgroundColor: theme.primary + '10' }]}>
              <CivicCoin amount={quest.reward_amount} size="small" />
            </View>
          </View>

          <ThemedText style={styles.questDescription} dimmed>
            {quest.description}
          </ThemedText>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: theme.card }]}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${(quest.progress / quest.required) * 100}%`,
                    backgroundColor: theme.primary
                  }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText} dimmed>
              {quest.progress}/{quest.required}
            </ThemedText>
          </View>

          <Button 
            variant={quest.completed ? "outline" : "default"}
            disabled={quest.completed}
            onPress={() => handleQuestAction(quest)}
            style={styles.questButton}
          >
            {quest.completed ? "Completed" : "Start Quest"}
          </Button>
        </View>

        {quest.completed && (
          <PokeguideCharacter 
            emotion="happy-with-football" 
            size={40}
            style={styles.completionGuide}
          />
        )}
      </Card>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle} color="#FFFFFF">
            Daily Quests
          </ThemedText>
          <ThemedText style={styles.headerSubtitle} color="rgba(255, 255, 255, 0.8)">
            Complete quests to earn CivicCoins and badges
          </ThemedText>
        </View>
      </LinearGradient>

      <FlatList
        data={quests}
        renderItem={renderQuest}
        contentContainerStyle={styles.questList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    paddingTop: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  questList: {
    padding: 16,
    paddingTop: 8,
  },
  questWrapper: {
    marginBottom: 16,
  },
  questCard: {
    padding: 0,
    overflow: 'hidden',
  },
  questContent: {
    padding: 16,
  },
  questIconContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    zIndex: 1,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 60,
  },
  titleContainer: {
    flex: 1,
    marginRight: 4,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  rewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  questDescription: {
    marginBottom: 16,
    fontSize: 14,
    lineHeight: 20,
    paddingLeft: 36,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    width: 40,
    textAlign: 'right',
  },
  questButton: {
    marginTop: 8,
  },
  completionGuide: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 80,
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});