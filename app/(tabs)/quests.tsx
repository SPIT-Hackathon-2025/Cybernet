import { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Quest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationService } from '@/services/gamificationService';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { useColorScheme } from 'react-native';
import { CivicCoin } from '@/components/CivicCoin';

const { width } = Dimensions.get('window');

export default function QuestsScreen() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    if (user) {
      loadQuests();
    }
  }, [user]);

  const loadQuests = async () => {
    try {
      const data = await gamificationService.getActiveQuests(user!.id);
      setQuests(data);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuestProgress = (quest: Quest) => {
    return (quest.progress / quest.required) * 100;
  };

  const renderQuest = ({ item: quest }: { item: Quest }) => (
    <Animated.View entering={FadeInDown}>
      <Card style={styles.questCard}>
        <View style={styles.questHeader}>
          <ThemedText type="title" style={styles.questTitle}>
            {quest.title}
          </ThemedText>
          <View style={styles.rewardBadge}>
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
                  width: `${getQuestProgress(quest)}%`,
                  backgroundColor: theme.primary
                }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText} dimmed>
            {getQuestProgress(quest).toFixed(0)}%
          </ThemedText>
        </View>

        {quest.status === 'completed' ? (
          <Button 
            variant="outline" 
            disabled 
            onPress={() => {}}
          >
            Completed
          </Button>
        ) : (
          <Button onPress={() => {}}>
            View Details
          </Button>
        )}

        {quest.completed && (
          <PokeguideCharacter 
            emotion="happy-with-football" 
            size={40}
            style={styles.completionGuide}
          />
        )}

        {quest.isNew && (
          <PokeguideCharacter 
            emotion="announcing" 
            size={40}
            style={styles.newQuestGuide}
          />
        )}
      </Card>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle} color="#FFFFFF">Daily Quests</ThemedText>
        <ThemedText style={styles.headerSubtitle} color="rgba(255, 255, 255, 0.8)">
          Complete quests to earn CivicCoins and badges
        </ThemedText>
      </LinearGradient>

      <FlatList
        data={quests}
        renderItem={renderQuest}
        contentContainerStyle={styles.questList}
        showsHorizontalScrollIndicator={false}
      />
    </View>
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
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  questList: {
    padding: 16,
    paddingTop: 0,
    marginTop: -32,
  },
  questCard: {
    marginBottom: 16,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  questTitle: {
    flex: 1,
    marginRight: 16,
  },
  rewardBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 133, 51, 0.1)',
  },
  rewardText: {
    fontWeight: 'bold',
  },
  questDescription: {
    marginBottom: 16,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    width: 40,
    textAlign: 'right',
  },
  completionGuide: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  newQuestGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
}); 