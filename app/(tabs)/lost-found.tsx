import { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';

export default function LostFoundScreen() {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A1A1A', '#4A4A4A']}
        style={styles.header}
      >
        <PokeguideCharacter 
          emotion="concerned-asking" 
          size={60}
          style={styles.guideCharacter}
        />
        <Text style={styles.headerTitle}>
          Lost something? Let's help you find it!
        </Text>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <Button 
          onPress={() => setActiveTab('lost')}
          variant={activeTab === 'lost' ? 'default' : 'outline'}
          style={styles.tabButton}
        >
          <Ionicons name="search-outline" size={20} color={activeTab === 'lost' ? '#FFFFFF' : theme.text} />
          <ThemedText>Lost Items</ThemedText>
        </Button>
        <Button
          onPress={() => setActiveTab('found')}
          variant={activeTab === 'found' ? 'default' : 'outline'}
          style={styles.tabButton}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={activeTab === 'found' ? '#FFFFFF' : theme.text} />
          <ThemedText>Found Items</ThemedText>
        </Button>
      </View>

      {/* Content will be implemented in the next iteration */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: 24,
    paddingTop: 60,
    height: 150,
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
  tabContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    marginTop: -32,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideCharacter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 