import { StyleSheet, View, ScrollView, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { gamificationService } from '@/services/gamificationService';
import { Achievement, TrainerRank } from '@/types';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { CivicCoin } from '@/components/CivicCoin';

const RANK_BADGES = {
  'Novice Trainer': require('@/assets/images/badges/Novice Trainer.png'),
  'Issue Scout': require('@/assets/images/badges/Issue Scout.png'),
  'Community Guardian': require('@/assets/images/badges/Community Guardian.png'),
  'District Champion': require('@/assets/images/badges/District Champion.png'),
  'Elite PokeRanger': require('@/assets/images/badges/Elite PokeRanger.png'),
} as const;

const RANK_COLORS = {
  'Novice Trainer': Colors.light.warning,
  'Issue Scout': Colors.light.success,
  'Community Guardian': Colors.light.accent,
  'District Champion': Colors.light.primary,
  'Elite PokeRanger': Colors.light.error,
} as const;

const RANK_REQUIREMENTS = {
  'Novice Trainer': 0,
  'Issue Scout': 500,
  'Community Guardian': 1000,
  'District Champion': 2500,
  'Elite PokeRanger': 5000,
} as const;

export default function AchievementsScreen() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRank, setCurrentRank] = useState<TrainerRank>('Novice Trainer');
  const [civicCoins, setCivicCoins] = useState(0);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const [achievementsData, profileData] = await Promise.all([
        gamificationService.getAchievements(user!.id),
        gamificationService.getUserProfile(user!.id),
      ]);
      setAchievements(achievementsData);
      setCurrentRank(profileData.rank as TrainerRank);
      setCivicCoins(profileData.civic_coins);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNextRank = () => {
    const ranks: TrainerRank[] = [
      'Novice Trainer',
      'Issue Scout',
      'Community Guardian',
      'District Champion',
      'Elite PokeRanger'
    ];
    const currentIndex = ranks.indexOf(currentRank);
    return currentIndex < ranks.length - 1 ? ranks[currentIndex + 1] : null;
  };

  const getProgressToNextRank = () => {
    const nextRank = getNextRank();
    if (!nextRank) return 100; // Already at max rank

    const currentRequirement = RANK_REQUIREMENTS[currentRank];
    const nextRequirement = RANK_REQUIREMENTS[nextRank];
    const progress = ((civicCoins - currentRequirement) / (nextRequirement - currentRequirement)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PokeguideCharacter emotion="thinking" size={120} />
        <ThemedText>Loading your achievements...</ThemedText>
      </View>
    );
  }

  const nextRank = getNextRank();
  const progressToNext = getProgressToNextRank();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[RANK_COLORS[currentRank], Colors.light.background]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          Your Achievements
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Track your progress and earn rewards!
        </ThemedText>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.rankCard}>
          <Image 
            source={RANK_BADGES[currentRank]}
            style={styles.rankBadge}
            resizeMode="contain"
          />
          <View style={styles.rankInfo}>
            <ThemedText type="title" style={styles.rankTitle}>
              {currentRank}
            </ThemedText>
            {nextRank && (
              <>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${progressToNext}%`,
                          backgroundColor: RANK_COLORS[nextRank]
                        }
                      ]} 
                    />
                  </View>
                  <View style={styles.progressTextContainer}>
                    <CivicCoin amount={civicCoins} size="small" />
                    <ThemedText style={styles.progressText}>/</ThemedText>
                    <CivicCoin amount={RANK_REQUIREMENTS[nextRank]} size="small" />
                  </View>
                </View>
                <ThemedText style={styles.nextRank}>
                  Next: {nextRank}
                </ThemedText>
              </>
            )}
          </View>
        </Card>

        {Object.entries(RANK_BADGES).map(([rank, badge]) => (
          <Card key={rank} style={[
            styles.achievementCard,
            { opacity: RANK_REQUIREMENTS[rank as TrainerRank] > civicCoins ? 0.5 : 1 }
          ]}>
            <Image 
              source={badge}
              style={styles.badgeImage}
              resizeMode="contain"
            />
            <View style={styles.achievementInfo}>
              <ThemedText style={styles.achievementName}>
                {rank}
              </ThemedText>
              <View style={styles.requirementContainer}>
                <ThemedText style={styles.requirementLabel}>Required: </ThemedText>
                <CivicCoin amount={RANK_REQUIREMENTS[rank as TrainerRank]} size="small" />
              </View>
              {RANK_REQUIREMENTS[rank as TrainerRank] <= civicCoins && (
                <View style={[styles.unlockedBadge, { backgroundColor: RANK_COLORS[rank as TrainerRank] }]}>
                  <ThemedText style={styles.unlockedText}>Unlocked!</ThemedText>
                </View>
              )}
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    height: 150,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  content: {
    padding: 16,
    marginTop: -48,
  },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  rankBadge: {
    width: 80,
    height: 80,
    marginRight: 16,
  },
  rankInfo: {
    flex: 1,
  },
  rankTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.light.card,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
    width: 80,
    textAlign: 'right',
  },
  nextRank: {
    fontSize: 14,
    opacity: 0.7,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  badgeImage: {
    width: 60,
    height: 60,
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requirementLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  unlockedBadge: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: [{ translateY: -12 }],
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 120,
    justifyContent: 'flex-end',
  },
}); 