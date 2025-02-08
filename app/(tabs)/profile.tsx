import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Image } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UserProfile } from '@/types';
import { gamificationService } from '@/services/gamificationService';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const data = await gamificationService.getUserProfile(user!.id);
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  if (!profile) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.header}>
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.avatar}
        />
        <ThemedText type="title">{profile.username}</ThemedText>
        <ThemedText type="subtitle" style={styles.rank}>{profile.rank}</ThemedText>
      </Card>

      <View style={styles.statsContainer}>
        <Card style={[styles.statBox, { backgroundColor: Colors.light.primary }]}>
          <ThemedText type="defaultSemiBold" style={styles.statLabel}>Level</ThemedText>
          <ThemedText type="title" style={styles.statValue}>{profile.trainer_level}</ThemedText>
        </Card>

        <Card style={[styles.statBox, { backgroundColor: Colors.light.secondary }]}>
          <ThemedText type="defaultSemiBold" style={styles.statLabel}>CivicCoins</ThemedText>
          <ThemedText type="title" style={styles.statValue}>{profile.civic_coins}</ThemedText>
        </Card>

        <Card style={[styles.statBox, { backgroundColor: Colors.light.accent }]}>
          <ThemedText type="defaultSemiBold" style={styles.statLabel}>Trust Score</ThemedText>
          <ThemedText type="title" style={styles.statValue}>{profile.trust_score}</ThemedText>
        </Card>
      </View>

      <Card style={styles.section}>
        <ThemedText type="subtitle">Badges</ThemedText>
        {profile.badges.map((badge) => (
          <Card key={badge.id} style={styles.badge}>
            <Image source={{ uri: badge.icon_url }} style={styles.badgeIcon} />
            <View style={styles.badgeInfo}>
              <ThemedText type="defaultSemiBold">{badge.name}</ThemedText>
              <ThemedText>{badge.description}</ThemedText>
            </View>
          </Card>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  section: {
    padding: 20,
    gap: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  rank: {
    color: Colors.light.secondary,
    marginTop: 4,
  },
  statLabel: {
    color: '#FFFFFF',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  badgeIcon: {
    width: 40,
    height: 40,
  },
  badgeInfo: {
    flex: 1,
    marginLeft: 16,
  },
  badge: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
}); 