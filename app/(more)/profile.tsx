import { StyleSheet, View, Image, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { gamificationService } from '@/services/gamificationService';
import { UserProfile } from '@/types';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await gamificationService.getUserProfile(user!.id);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (!profile) {
    return (
      <View style={styles.loadingContainer}>
        <PokeguideCharacter emotion="thinking" size={120} />
        <ThemedText>Loading your trainer profile...</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.light.primary, Colors.light.warning]}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: profile.avatar_url || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <ThemedText type="title" style={styles.username}>{profile.username}</ThemedText>
            <ThemedText style={styles.rank}>{profile.rank}</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="star" size={24} color={Colors.light.warning} />
          <ThemedText type="title" style={styles.statValue}>{profile.trainer_level}</ThemedText>
          <ThemedText style={styles.statLabel}>Trainer Level</ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="medal" size={24} color={Colors.light.primary} />
          <ThemedText type="title" style={styles.statValue}>{profile.civic_coins}</ThemedText>
          <ThemedText style={styles.statLabel}>CivicCoins</ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="shield" size={24} color={Colors.light.success} />
          <ThemedText type="title" style={styles.statValue}>{profile.trust_score}</ThemedText>
          <ThemedText style={styles.statLabel}>Trust Score</ThemedText>
        </Card>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Badges</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
          {profile.badges.map((badge) => (
            <Card key={badge.id} style={styles.badgeCard}>
              <Ionicons name={badge.icon as any} size={32} color={Colors.light.primary} />
              <ThemedText style={styles.badgeName}>{badge.name}</ThemedText>
              <ThemedText style={styles.badgeDate}>{new Date(badge.earned_at).toLocaleDateString()}</ThemedText>
            </Card>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Recent Activity</ThemedText>
        {profile.recent_activity.map((activity) => (
          <Card key={activity.id} style={styles.activityCard}>
            <Ionicons name={activity.icon as any} size={24} color={Colors.light.primary} />
            <View style={styles.activityInfo}>
              <ThemedText style={styles.activityTitle}>{activity.title}</ThemedText>
              <ThemedText style={styles.activityDate}>
                {new Date(activity.timestamp).toLocaleDateString()}
              </ThemedText>
            </View>
            <ThemedText style={styles.activityPoints}>+{activity.points}</ThemedText>
          </Card>
        ))}
      </View>
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
    padding: 20,
    paddingTop: 60,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    marginLeft: 16,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rank: {
    color: '#FFFFFF',
    opacity: 0.9,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    marginTop: -30,
  },
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  statValue: {
    fontSize: 20,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    marginBottom: 12,
  },
  badgesScroll: {
    flexDirection: 'row',
  },
  badgeCard: {
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    width: 120,
  },
  badgeName: {
    marginTop: 8,
    textAlign: 'center',
  },
  badgeDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },
  activityTitle: {
    fontSize: 16,
  },
  activityDate: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  activityPoints: {
    color: Colors.light.success,
    fontWeight: 'bold',
  },
}); 