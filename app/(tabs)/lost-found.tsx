import { useState } from 'react';
import { StyleSheet, View, ScrollView, Text, FlatList, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { router } from 'expo-router';

// Add type for the mock data
interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  status: 'lost' | 'found';
  category: string;
  photos: string[];
}

const MOCK_ITEMS: LostFoundItem[] = [
  {
    id: '1',
    title: 'Blue Backpack',
    description: 'Found near the central park entrance',
    location: 'Central Park',
    date: '2024-03-15',
    status: 'lost',
    category: 'Bags',
    photos: ['https://example.com/photo1.jpg'],
  },
  {
    id: '2',
    title: 'Blue Backpack',
    description: 'Found near the central park entrance',
    location: 'Central Park',
    date: '2024-03-15',
    status: 'lost',
    category: 'Bags',
    photos: ['https://example.com/photo1.jpg'],
  },
  {
    id: '3',
    title: 'Blue Backpack',
    description: 'Found near the central park entrance',
    location: 'Central Park',
    date: '2024-03-15',
    status: 'lost',
    category: 'Bags',
    photos: ['https://example.com/photo1.jpg'],
  },
  {
    id: '4',
    title: 'Blue Backpack',
    description: 'Found near the central park entrance',
    location: 'Central Park',
    date: '2024-03-15',
    status: 'lost',
    category: 'Bags',
    photos: ['https://example.com/photo1.jpg'],
  },
  // Add more mock items...
];

export default function LostFoundScreen() {
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  const renderItem = ({ item }: { item: LostFoundItem }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.7}
    >
      <Card style={[styles.itemCard, styles.whiteBackground]}>
        <View style={styles.itemHeader}>
          <View style={styles.itemTitleContainer}>
            <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
            <View style={styles.categoryBadge}>
              <ThemedText style={styles.categoryText}>{item.category}</ThemedText>
            </View>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={Colors.text.secondary}
          />
        </View>
        
        <ThemedText style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </ThemedText>
        
        <View style={styles.itemFooter}>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={Colors.text.secondary} />
            <ThemedText style={styles.locationText}>{item.location}</ThemedText>
          </View>
          <ThemedText style={styles.dateText}>
            {new Date(item.date).toLocaleDateString()}
          </ThemedText>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <PokeguideCharacter 
            emotion="concerned-asking" 
            size={80}
            style={styles.guideCharacter}
          />
          <ThemedText style={styles.headerTitle}>
            Lost & Found Network
          </ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Connecting lost items with their owners
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <Button 
            onPress={() => setActiveTab('lost')}
            variant={activeTab === 'lost' ? 'default' : 'ghost'}
            style={[
              styles.tabButton,
              activeTab === 'lost' && styles.activeTabButton
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name="search-outline" 
                size={20} 
                color={activeTab === 'lost' ? Colors.background.light : Colors.text.primary} 
              />
              <ThemedText style={[
                styles.tabText,
                activeTab === 'lost' && styles.activeTabText
              ]}>
                Lost Items
              </ThemedText>
            </View>
          </Button>
          <Button
            onPress={() => setActiveTab('found')}
            variant={activeTab === 'found' ? 'default' : 'ghost'}
            style={[
              styles.tabButton,
              activeTab === 'found' && styles.activeTabButton
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={20} 
                color={activeTab === 'found' ? Colors.background.light : Colors.text.primary} 
              />
              <ThemedText style={[
                styles.tabText,
                activeTab === 'found' && styles.activeTabText
              ]}>
                Found Items
              </ThemedText>
            </View>
          </Button>
        </View>
      </View>

      <FlatList
        data={MOCK_ITEMS.filter(item => item.status === activeTab)}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <PokeguideCharacter
              emotion="thinking"
              size={80}
              style={styles.emptyStateGuide}
            />
            <ThemedText style={styles.emptyStateText}>
              No {activeTab} items reported yet
            </ThemedText>
          </View>
        }
      />

      <Button
        style={styles.fab}
        onPress={() => router.push('/item/new')}
      >
        <View style={styles.fabContent}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <ThemedText style={styles.fabText}>
            Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
          </ThemedText>
        </View>
      </Button>
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
    paddingTop: 70,
    height: 280,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.background.light,
    marginBottom: 2,
    textAlign: 'center',
    includeFontPadding: false,
    marginTop: 30,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.background.light,
    opacity: 1,
    textAlign: 'center',
    includeFontPadding: false,
  },
  guideCharacter: {
    position: 'absolute',
    top: -60,
    zIndex: 1,
  },
  tabContainer: {
    padding: 16,
    marginTop: -100,
    zIndex: 2,
    marginBottom: 8,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: Colors.background.light,
    borderRadius: 12,
    padding: 4,
    gap: 4,
    shadowColor: Colors.text.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: Colors.primary,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  activeTabText: {
    color: Colors.background.light,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  itemCard: {
    marginBottom: 12,
    padding: 16,
  },
  whiteBackground: {
    backgroundColor: '#FFFFFF',
    borderColor: Colors.border.light,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryBadge: {
    backgroundColor: Colors.light.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.text.primary,
  },
  itemDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap:16, // Add gap between icon containers
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    marginRight: 4,
  },
  locationText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  dateText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateGuide: {
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    left: 24,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    paddingVertical: 16,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
}); 