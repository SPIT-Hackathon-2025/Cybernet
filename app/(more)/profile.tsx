import { useState } from 'react';
import { StyleSheet, View, Image, ScrollView, TouchableOpacity, Platform, useColorScheme } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { gamificationService } from '@/services/gamificationService';
import { UserProfile, Achievement, TrainerRank } from '@/types';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { CivicCoin } from '@/components/CivicCoin';
import { Button } from '@/components/ui/Button';
import * as ImagePicker from 'expo-image-picker';
import { TextInput } from '@/components/ui/TextInput';

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

const getBadgeImage = (badgeName: string) => {
  switch (badgeName) {
    case 'Novice Trainer':
      return require('@/assets/images/badges/Novice Trainer.png');
    case 'Issue Scout':
      return require('@/assets/images/badges/Issue Scout.png');
    case 'Community Guardian':
      return require('@/assets/images/badges/Community Guardian.png');
    case 'District Champion':
      return require('@/assets/images/badges/District Champion.png');
    case 'Elite PokeRanger':
      return require('@/assets/images/badges/Elite PokeRanger.png');
    default:
      return require('@/assets/images/badges/Novice Trainer.png'); // Default fallback
  }
};

const getActivityIcon = (activityType: string) => {
  switch (activityType) {
    case 'city':
      return 'business';
    case 'security':
      return 'shield-checkmark';
    case 'tree':
      return 'leaf';
    case 'recycle':
      return 'refresh-circle';
    case 'building':
      return 'home';
    default:
      return 'star'; // Default icon
  }
};

export default function ProfileScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await gamificationService.getUserProfile(user!.id);
      setProfile(data);
      setEditedUsername(data.username);
      setEditedEmail(user?.email || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleEditPicture = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      // TODO: Implement image upload
      console.log('Selected image:', result.assets[0].uri);
    }
  };

  const handleSaveChanges = async () => {
    // TODO: Implement save changes
    setIsEditing(false);
  };

  const getHighestBadge = (badges: UserProfile['badges']) => {
    const rankOrder = ['Novice Trainer', 'Issue Scout', 'Community Guardian', 'District Champion', 'Elite PokeRanger'];
    return badges
      .filter(badge => badge.unlocked)
      .sort((a, b) => rankOrder.indexOf(b.name) - rankOrder.indexOf(a.name))[0];
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
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.warning]}
        style={styles.header}
      >
        <View style={styles.titleContainer}>
          <ThemedText style={styles.title} color="#FFFFFF">Profile</ThemedText>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={handleEditPicture}
            disabled={!isEditing}
          >
            <Image 
              source={{ 
                uri: profile.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=pokeguide' 
              }}
              style={styles.avatar}
            />
            {isEditing && (
              <View style={styles.editOverlay}>
                <Ionicons name="camera" size={24} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            {isEditing ? (
              <TextInput
                value={editedUsername}
                onChangeText={setEditedUsername}
                style={styles.editInput}
                placeholder="Username"
              />
            ) : (
              <View>
                <ThemedText type="title" style={styles.username} color="#FFFFFF">
                  {profile.username}
                </ThemedText>
                <ThemedText style={styles.rank} color="rgba(255, 255, 255, 0.9)">
                  {profile.rank}
                </ThemedText>
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            style={styles.editButton}
          >
            <Ionicons 
              name={isEditing ? "close" : "pencil"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>
        </View>

        <Card style={styles.coinCard}>
          <PokeguideCharacter 
            emotion="happy-with-football"
            size={60}
            style={styles.guideCharacter}
          />
          <View style={styles.coinInfo}>
            <ThemedText style={styles.coinLabel}>Balance</ThemedText>
            <CivicCoin amount={profile.civic_coins} size="large" />
          </View>
        </Card>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Ionicons name="star" size={24} color={theme.warning} />
          <ThemedText type="title" style={styles.statValue}>{profile.trainer_level}</ThemedText>
          <ThemedText style={styles.statLabel}>Trainer Level</ThemedText>
        </Card>

        <Card style={styles.statCard}>
          <Ionicons name="shield" size={24} color={theme.success} />
          <ThemedText type="title" style={styles.statValue}>{profile.trust_score}</ThemedText>
          <ThemedText style={styles.statLabel}>Trust Score</ThemedText>
        </Card>

        {getHighestBadge(profile.badges) && (
          <Card style={styles.statCard}>
            <Image 
              source={RANK_BADGES[getHighestBadge(profile.badges).name as TrainerRank]}
              style={styles.badgeStatImage}
              resizeMode="contain"
            />
            <ThemedText style={styles.badgeStatLabel}>{getHighestBadge(profile.badges).name}</ThemedText>
          </Card>
        )}
      </View>

      <Card style={styles.settingsCard}>
        <ThemedText type="title" style={styles.settingsTitle}>Account Settings</ThemedText>
        
        <View style={styles.settingRow}>
          <Ionicons name="mail-outline" size={24} color={theme.primary} />
          {isEditing ? (
            <TextInput
              value={editedEmail}
              onChangeText={setEditedEmail}
              style={styles.settingInput}
              placeholder="Email"
            />
          ) : (
            <ThemedText style={styles.settingText}>{user?.email}</ThemedText>
          )}
        </View>

        <View style={styles.settingRow}>
          <Ionicons name="key-outline" size={24} color={theme.primary} />
          <Button 
            variant="outline" 
            onPress={() => {}}
            style={styles.changePasswordButton}
          >
            Change Password
          </Button>
        </View>

        {isEditing && (
          <Button
            onPress={handleSaveChanges}
            style={styles.saveButton}
          >
            Save Changes
          </Button>
        )}
      </Card>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Badges & Achievements</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesScroll}>
          {Object.entries(RANK_BADGES).map(([rank, badge]) => {
            const isUnlocked = profile.civic_coins >= RANK_REQUIREMENTS[rank as TrainerRank];
            return (
              <Card key={rank} style={[styles.badgeCard, !isUnlocked && styles.lockedBadge]}>
                <Image 
                  source={badge}
                  style={[styles.badgeIcon, !isUnlocked && styles.lockedBadgeImage]}
                  resizeMode="contain"
                />
                <View style={styles.badgeInfo}>
                  <ThemedText style={styles.badgeName}>{rank}</ThemedText>
                  <View style={styles.requirementContainer}>
                    <CivicCoin amount={RANK_REQUIREMENTS[rank as TrainerRank]} size="small" />
                  </View>
                </View>
                {isUnlocked && (
                  <View style={[styles.unlockedBadge, { backgroundColor: RANK_COLORS[rank as TrainerRank] }]}>
                    <ThemedText style={styles.unlockedText}>✓</ThemedText>
                  </View>
                )}
              </Card>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <ThemedText type="title" style={styles.sectionTitle}>Recent Activity</ThemedText>
        {profile.recent_activity.map((activity) => (
          <Card key={activity.id} style={styles.activityCard}>
            <Ionicons name={getActivityIcon(activity.icon)} size={24} color={theme.primary} />
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
    paddingTop: 80,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginTop: -50,
  },
  titleContainer: {
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    paddingTop: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 12,
    flexShrink: 1,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    flexShrink: 1,
  },
  rank: {
    fontSize: 14,
    flexShrink: 1,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  coinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginTop: 16,
  },
  coinInfo: {
    flex: 1,
    marginLeft: 16,
  },
  coinLabel: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 4,
  },
  guideCharacter: {
    transform: [{ scale: 0.8 }],
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
    justifyContent: 'center',
    minWidth: 0,
  },
  statValue: {
    fontSize: 20,
    marginTop: 8,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    textAlign: 'center',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
  },
  settingsTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  settingText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 14,
  },
  settingInput: {
    flex: 1,
    backgroundColor: Colors.light.backgroundDim,
    borderRadius: 8,
    padding: 8,
  },
  changePasswordButton: {
    flex: 1,
  },
  saveButton: {
    marginTop: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
    flexShrink: 1,
  },
  badgesScroll: {
    flexDirection: 'row',
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginRight: 8,
    width: 160,
    height: 56,
  },
  badgeIcon: {
    width: 36,
    height: 36,
    marginRight: 8,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  requirementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unlockedBadge: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lockedBadge: {
    opacity: 0.5,
  },
  lockedBadgeImage: {
    opacity: 0.3,
  },
  badgeStatImage: {
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  badgeStatLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    flexShrink: 1,
  },
  activityTitle: {
    fontSize: 14,
    flexWrap: 'wrap',
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