import { StyleSheet, View, ScrollView, Image, Linking } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Card } from '@/components/ui/Card';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const FEATURES = [
  {
    icon: 'map',
    title: 'Community Map',
    description: 'View and report local issues in real-time'
  },
  {
    icon: 'search',
    title: 'Lost & Found',
    description: 'Help reunite lost items with their owners'
  },
  {
    icon: 'people',
    title: 'Community Driven',
    description: 'Built by and for the Pokémon GO community'
  },
  {
    icon: 'trophy',
    title: 'Gamification',
    description: 'Earn points and rewards for helping others'
  }
];

const TEAM = [
  {
    name: 'CYBERNET',
    role: 'Development Team',
    github: 'https://github.com/r04nx/pokemon-go-community'
  }
];

export default function AboutScreen() {
  const { theme } = useTheme();

  const handleLinkPress = async (url: string) => {
    await Linking.openURL(url);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.backgroundDim]}
        style={styles.header}
      >
        <Image
          source={require('@/assets/images/pokemon-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText style={styles.version} color="#FFFFFF">
          Version 1.0.0
        </ThemedText>
      </LinearGradient>

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(200)}>
          <Card style={styles.section}>
            <ThemedText style={styles.sectionTitle}>About the App</ThemedText>
            <ThemedText style={styles.description}>
              PokémonGO Community is a platform designed by CYBERNET to enhance the Pokémon GO
              experience by fostering community collaboration and making our shared
              spaces better for everyone.
            </ThemedText>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Key Features</ThemedText>
            <View style={styles.featuresGrid}>
              {FEATURES.map((feature, index) => (
                <View key={feature.title} style={styles.featureItem}>
                  <View style={[styles.featureIcon, { backgroundColor: theme.backgroundDim }]}>
                    <Ionicons name={feature.icon as any} size={24} color={theme.primary} />
                  </View>
                  <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                  <ThemedText style={styles.featureDescription} dimmed>
                    {feature.description}
                  </ThemedText>
                </View>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400)}>
          <Card style={styles.section}>
            <ThemedText style={styles.sectionTitle}>Development Team</ThemedText>
            <View style={styles.teamList}>
              {TEAM.map((member) => (
                <TouchableOpacity
                  key={member.name}
                  style={styles.teamMember}
                  onPress={() => handleLinkPress(member.github)}
                >
                  <View style={[styles.teamIcon, { backgroundColor: theme.backgroundDim }]}>
                    <Ionicons name="logo-github" size={24} color={theme.primary} />
                  </View>
                  <View>
                    <ThemedText style={styles.memberName}>{member.name}</ThemedText>
                    <ThemedText style={styles.memberRole} dimmed>{member.role}</ThemedText>
                  </View>
                  <Ionicons name="open-outline" size={20} color={theme.textDim} />
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        <TouchableOpacity
          style={[styles.githubButton, { backgroundColor: theme.backgroundDim }]}
          onPress={() => handleLinkPress('https://github.com/yourusername/pokemon-go-community')}
        >
          <Ionicons name="logo-github" size={24} color={theme.text} />
          <ThemedText style={styles.githubText}>View on GitHub</ThemedText>
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
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
    marginBottom: 8,
  },
  version: {
    fontSize: 14,
    opacity: 0.8,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  featureItem: {
    width: '45%',
    alignItems: 'center',
    gap: 8,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
  },
  teamList: {
    gap: 12,
  },
  teamMember: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberRole: {
    fontSize: 12,
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  githubText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 