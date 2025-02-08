import { StyleSheet, View, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { gamificationService } from '@/services/gamificationService';
import { Achievement } from '@/types';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';

const RANK_COLORS = {
  'Novice Trainer': Colors.light.warning,
  'Issue Scout': Colors.light.success,
  'Community Guardian': Colors.light.accent,
  'District Champion': Colors.light.primary,
  'Elite PokeRanger': Colors.light.error,
};

export default function AchievementsScreen() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const data = await gamificationService.getAchievements(user!.id);
      setAchievements(data);
    } catch (error) {
      console.error('Error loading achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PokeguideCharacter emotion="thinking" size={120} />
        <ThemedText>Loading your achievements...</ThemedText>
      </View>
    );
  }

  const groupedAchievements = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.light.accent, Colors.light.warning]}
        style={styles.header}
      >
        <ThemedText type="title" style={styles.headerTitle}>
          Your Achievements
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Track your progress and earn rewards!
        </ThemedText>
      </LinearGradient>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <View key={category} style={styles.section}>
          <ThemedText type="title" style={styles.sectionTitle}>
            {category}
          </ThemedText>
          <View style={styles.achievementsGrid}>
            {categoryAchievements.map((achievement) => (
              <Card key={achievement.id} style={styles.achievementCard}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: achievement.unlocked ? Colors.light.success : Colors.light.warning }
                ]}>
                  <Ionicons 
                    name={achievement.unlocked ? achievement.icon : 'lock-closed'} 
                    size={32} 
                    color="#FFFFFF" 
                  />
                </View>
                <ThemedText style={styles.achievementName}>
                  {achievement.name}
                </ThemedText>
                <ThemedText style={styles.achievementDescription}>
                  {achievement.description}
                </ThemedText>
                {achievement.progress !== undefined && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill,
                          { width: `${(achievement.progress / achievement.required) * 100}%` }
                        ]} 
                      />
                    </View>
                    <ThemedText style={styles.progressText}>
                      {achievement.progress}/{achievement.required}
                    </ThemedText>
                  </View>
                )}
                {achievement.unlocked && (
                  <ThemedText style={styles.unlockedDate}>
                    Unlocked: {new Date(achievement.unlocked_at).toLocaleDateString()}
                  </ThemedText>
                )}
              </Card>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 16,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  achievementCard: {
    width: '47%',
    padding: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 12,
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.light.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.light.success,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
  unlockedDate: {
    fontSize: 10,
    opacity: 0.5,
    marginTop: 8,
  },
}); 