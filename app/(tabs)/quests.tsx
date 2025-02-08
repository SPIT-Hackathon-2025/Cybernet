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

const { width } = Dimensions.get('window');

export default function QuestsScreen() {
  const { user } = useAuth();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

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
    const totalActions = quest.required_actions.reduce((acc, action) => acc + action.count, 0);
    const completedActions = quest.required_actions.reduce((acc, action) => acc + action.completed, 0);
    return (completedActions / totalActions) * 100;
  };

  const renderQuest = ({ item: quest }: { item: Quest }) => (
    <Animated.View entering={FadeInDown}>
      <Card style={styles.questCard}>
        <View style={styles.questHeader}>
          <ThemedText type="title" style={styles.questTitle}>
            {quest.title}
          </ThemedText>
          <View style={styles.rewardBadge}>
            <ThemedText style={styles.rewardText}>
              {quest.reward_coins} CC
            </ThemedText>
          </View>
        </View>

        <ThemedText style={styles.questDescription}>
          {quest.description}
        </ThemedText>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill,
                { width: `${getQuestProgress(quest)}%` }
              ]} 
            />
          </View>
          <ThemedText style={styles.progressText}>
            {getQuestProgress(quest).toFixed(0)}%
          </ThemedText>
        </View>

        <View style={styles.questActions}>
          {quest.required_actions.map((action, index) => (
            <View key={index} style={styles.action}>
              <ThemedText style={styles.actionText}>
                {action.type.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </ThemedText>
              <ThemedText style={styles.actionProgress}>
                {action.completed}/{action.count}
              </ThemedText>
            </View>
          ))}
        </View>

        {quest.status === 'completed' ? (
          <Button variant="outline" disabled>
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
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.light.warning]}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle}>Daily Quests</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Complete quests to earn CivicCoins and badges
        </ThemedText>
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
    backgroundColor: Colors.background.light,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
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
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardText: {
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  questDescription: {
    marginBottom: 16,
    opacity: 0.8,
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
    backgroundColor: Colors.border.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.8,
    width: 40,
    textAlign: 'right',
  },
  questActions: {
    marginBottom: 16,
    gap: 8,
  },
  action: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    opacity: 0.8,
  },
  actionProgress: {
    fontWeight: '600',
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