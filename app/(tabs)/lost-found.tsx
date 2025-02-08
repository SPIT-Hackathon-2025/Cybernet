<<<<<<< HEAD
import { useState } from 'react';
<<<<<<< HEAD
import { StyleSheet, View, ScrollView, Text, useColorScheme } from 'react-native';
=======
import { StyleSheet, View, ScrollView, Text, FlatList, TouchableOpacity } from 'react-native';
=======
import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Modal, Alert, Image } from 'react-native';
>>>>>>> c906ae5 (updated routing, implementing individual pages)
>>>>>>> origin/lostNfound
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
<<<<<<< HEAD
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
=======
import { useAuth } from '@/contexts/AuthContext';
import { FAB } from '@/components/ui/FAB';
import { venueService } from '@/services/venueService';
import { lostItemService } from '@/services/lostItemService';
import { supabase } from '@/lib/supabase';
>>>>>>> c906ae5 (updated routing, implementing individual pages)

export default function LostFoundScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
<<<<<<< HEAD
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
=======
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [lostItems, setLostItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nearbyVenues, setNearbyVenues] = useState<any[]>([]);

  useEffect(() => {
    loadLostItems();
    getCurrentLocationAndVenues();
  }, []);

  const loadLostItems = async () => {
    try {
      const items = await lostItemService.getLostItems();
      setLostItems(items);
    } catch (error) {
      console.error('Error loading lost items:', error);
      Alert.alert('Error', 'Failed to load lost items');
    }
  };

  const getCurrentLocationAndVenues = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const venues = await venueService.getNearbyVerifiedVenues(
        location.coords.latitude,
        location.coords.longitude
      );
      setNearbyVenues(venues);
    } catch (error) {
      console.error('Error getting location/venues:', error);
      Alert.alert('Error', 'Failed to load nearby venues');
    }
  };

  const pickImage = async () => {
    if (photos.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 photos allowed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const fileInfo = await fetch(uri).then(res => res.blob());
      
      if (fileInfo.size > 10 * 1024 * 1024) { // 10MB
        Alert.alert('File too large', 'Maximum file size is 10MB');
        return;
      }

      const fileName = `${user!.id}/${Date.now()}.jpg`;
      const { error: uploadError, data } = await supabase.storage
        .from('lost-item-photos')
        .upload(fileName, fileInfo);

      if (uploadError) {
        Alert.alert('Upload failed', 'Failed to upload photo');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('lost-item-photos')
        .getPublicUrl(fileName);

      setPhotos([...photos, publicUrl]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !selectedVenue || !email || !phone) {
      Alert.alert('Missing fields', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await lostItemService.createLostItem({
        title,
        description,
        venue_id: selectedVenue.id,
        reporter_id: user!.id,
        photos,
        item_type: itemType,
        contact_info: { email, phone }
      });

      setIsModalVisible(false);
      resetForm();
      loadLostItems();
      Alert.alert('Success', 'Lost item reported successfully');
    } catch (error) {
      console.error('Error reporting lost item:', error);
      Alert.alert('Error', 'Failed to report lost item');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setItemType('');
    setPhotos([]);
    setSelectedVenue(null);
    setEmail('');
    setPhone('');
  };

  const renderLostItem = (item: any) => (
    <Card key={item.id} style={styles.itemCard}>
      {item.photos?.[0] && (
        <Image 
          source={{ uri: item.photos[0] }} 
          style={styles.itemImage}
        />
      )}
      <View style={styles.itemContent}>
        <ThemedText type="title">{item.title}</ThemedText>
        <ThemedText>{item.description}</ThemedText>
        <ThemedText style={styles.itemMeta}>
          Posted by {item.reporter?.username} at {item.venue?.name}
        </ThemedText>
      </View>
    </Card>
  );

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
>>>>>>> origin/lostNfound

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
<<<<<<< HEAD
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
=======
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
>>>>>>> origin/lostNfound
      </View>

<<<<<<< HEAD
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
=======
      <ScrollView style={styles.content}>
        {lostItems.map(renderLostItem)}
      </ScrollView>

      <FAB 
        icon="add" 
        onPress={() => setIsModalVisible(true)}
        style={styles.fab}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ThemedText type="title">Report Lost Item</ThemedText>
            <Button
              variant="ghost"
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} />
            </Button>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="What did you lose?"
            />

            <TextInput
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholder="Describe the item..."
            />

            <TextInput
              label="Item Type"
              value={itemType}
              onChangeText={setItemType}
              placeholder="e.g., Electronics, Clothing, etc."
            />

            <View style={styles.photoSection}>
              <ThemedText type="subtitle">Photos ({photos.length}/3)</ThemedText>
              <Button onPress={pickImage}>
                <Ionicons name="camera" size={20} />
                <ThemedText>Add Photo</ThemedText>
              </Button>
              <View style={styles.photoPreview}>
                {photos.map((photo, index) => (
                  <Image 
                    key={index}
                    source={{ uri: photo }}
                    style={styles.previewImage}
                  />
                ))}
              </View>
            </View>

            <View style={styles.venueSection}>
              <ThemedText type="subtitle">Last Seen Location</ThemedText>
              {nearbyVenues.map(venue => (
                <Button
                  key={venue.id}
                  variant={selectedVenue?.id === venue.id ? 'default' : 'outline'}
                  onPress={() => setSelectedVenue(venue)}
                >
                  <ThemedText>{venue.name}</ThemedText>
                </Button>
              ))}
            </View>

            <TextInput
              label="Contact Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Your contact email"
            />

            <TextInput
              label="Contact Phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Your contact phone"
            />

            <Button
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            >
              Report Lost Item
            </Button>
          </ScrollView>
        </View>
      </Modal>
>>>>>>> c906ae5 (updated routing, implementing individual pages)
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
<<<<<<< HEAD
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
=======
  content: {
    flex: 1,
    padding: 16,
>>>>>>> c906ae5 (updated routing, implementing individual pages)
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
<<<<<<< HEAD
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
=======
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  modalContent: {
    padding: 16,
  },
  photoSection: {
    marginVertical: 16,
  },
  photoPreview: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  venueSection: {
    marginVertical: 16,
    gap: 8,
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 40,
  },
  itemCard: {
    marginBottom: 16,
  },
  itemImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemContent: {
    gap: 8,
  },
  itemMeta: {
    fontSize: 12,
    opacity: 0.7,
>>>>>>> c906ae5 (updated routing, implementing individual pages)
  },
}); 