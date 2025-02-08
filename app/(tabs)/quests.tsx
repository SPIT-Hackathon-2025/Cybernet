import { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, FlatList, Dimensions, RefreshControl, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, useSharedValue, withSpring, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Quest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PokeguideCharacter, type Emotion } from '@/components/PokeguideCharacter';
import { useColorScheme } from 'react-native';
import { CivicCoin } from '@/components/CivicCoin';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { questService } from '@/services/questService';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

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

export default function QuestsScreen() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [showGuideMessage, setShowGuideMessage] = useState(false);
  const [guideEmotion, setGuideEmotion] = useState<Emotion>('happy-with-football');
  const bounceAnim = useSharedValue(0);

  const loadQuests = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const activeQuests = await questService.getActiveQuests(user.id);
      setQuests(activeQuests);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuests();
    setRefreshing(false);
  };

  useEffect(() => {
    loadQuests();
    // Complete daily login quest when screen loads
    if (user?.id) {
      questService.completeLoginQuest(user.id);
    }
  }, [user?.id]);

  const handleQuestAction = async (quest: Quest) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (quest.progress >= quest.required) {
      setGuideEmotion('happy-with-football');
      setShowGuideMessage(true);
      Alert.alert('Quest Completed!', 'You have already completed this quest. Great job! 🎉');
      return;
    }

    try {
      switch (quest.type) {
        case 'verify_issues':
          setGuideEmotion('explaining');
          setShowGuideMessage(true);
          router.push('/');
          break;
        case 'report_issues':
          setGuideEmotion('thinking');
          setShowGuideMessage(true);
          router.push('/report');
          break;
        case 'help_found_items':
          setGuideEmotion('concerned-asking');
          setShowGuideMessage(true);
          router.push('/lost-found');
          break;
        case 'visit_locations':
          setGuideEmotion('announcing');
          setShowGuideMessage(true);
          router.push('/');
          break;
        case 'daily_login':
          if (!quest.completed) {
            const updatedQuest = await questService.updateQuestProgress(quest.id);
            setQuests(current => 
              current.map(q => q.id === updatedQuest.id ? updatedQuest : q)
            );
            setGuideEmotion('happy-with-football');
            setShowGuideMessage(true);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling quest action:', error);
      setGuideEmotion('confused');
      setShowGuideMessage(true);
      Alert.alert('Error', 'Failed to process quest action. Please try again.');
    }
  };

  const getGuideMessage = () => {
    switch (guideEmotion) {
      case 'explaining':
        return "Let's explore the community and help make it better! Check the map for issues nearby.";
      case 'happy-with-football':
        return "Great job on completing your quest! Keep up the amazing work! 🌟";
      case 'thinking':
        return "Found something that needs attention? Report it and help the community!";
      case 'concerned-asking':
        return "Someone might be looking for their lost items. Can you help them?";
      case 'announcing':
        return "Time to explore! Visit different locations to discover new quests and challenges!";
      case 'confused':
        return "Oops! Something went wrong. Don't worry, let's try that again!";
      default:
        return "Complete quests to earn rewards and help the community!";
    }
  };

  const handleGuidePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowGuideMessage(!showGuideMessage);
  };

  const renderQuest = ({ item: quest }: { item: Quest }) => {
    const progress = Math.min(quest.progress / quest.required, 1);
    const isCompleted = quest.progress >= quest.required;

    return (
      <Animated.View
        entering={FadeInDown}
        style={styles.questItem}
      >
        <Card style={[styles.questCard, isCompleted && styles.completedQuest]}>
          <View style={styles.questHeader}>
            <View style={styles.questTitleRow}>
              <ThemedText type="title" style={styles.questTitle}>
                {quest.title}
              </ThemedText>
              {quest.isNew && (
                <View style={styles.newBadge}>
                  <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
                </View>
              )}
            </View>
            <View style={styles.rewardContainer}>
              <CivicCoin size="small" amount={quest.reward_amount} />
              <ThemedText style={styles.rewardText}>{quest.reward_amount}</ThemedText>
            </View>
          </View>

          <ThemedText style={styles.questDescription} dimmed>
            {quest.description}
          </ThemedText>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress * 100}%`, backgroundColor: theme.primary }
                ]} 
              />
            </View>
            <ThemedText style={styles.progressText} dimmed>
              {quest.progress}/{quest.required}
            </ThemedText>
          </View>

          <View style={styles.questFooter}>
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={16} color={theme.textDim} />
              <ThemedText style={styles.timeText} dimmed>
                {formatTimeLeft(quest.expires_at)}
              </ThemedText>
            </View>
            <Button
              variant={isCompleted ? "ghost" : "default"}
              onPress={() => handleQuestAction(quest)}
              disabled={isCompleted}
            >
              {isCompleted ? 'Completed!' : 'Go'}
            </Button>
          </View>
        </Card>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>
              Daily Quests
            </ThemedText>
          </View>
          <TouchableOpacity onPress={handleGuidePress}>
            <PokeguideCharacter 
              emotion={guideEmotion}
              size={30}
              style={styles.guideCharacter}
            />
          </TouchableOpacity>
        </View>
        {showGuideMessage && (
          <View style={styles.guideMessageContainer}>
            <ThemedText style={styles.guideMessage}>
              {getGuideMessage()}
            </ThemedText>
          </View>
        )}
      </LinearGradient>

      {quests.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <PokeguideCharacter emotion="explaining" size={120} />
          <ThemedText style={styles.emptyText} dimmed>
            No active quests available.{'\n'}Check back tomorrow for new quests!
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={quests}
          renderItem={renderQuest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.questList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 5,
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  headerText: {
    flex: 1,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    lineHeight: 34,
  },
  questList: {
    padding: 16,
    paddingTop: 0,
  },
  questItem: {
    marginBottom: 16,
  },
  questCard: {
    padding: 16,
  },
  completedQuest: {
    opacity: 0.8,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  questTitle: {
    fontSize: 18,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: '#FF5D00',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
  },
  questDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'right',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
    lineHeight: 24,
  },
  guideCharacter: {
    marginRight: -8,
    marginTop: -10,
    transform: [{ scaleX: -1 }],
  },
  guideMessageContainer: {
    position: 'absolute',
    top: 110,
    right: 16,
    left: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 8,
    zIndex: 1,
  },
  guideMessage: {
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
});