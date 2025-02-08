import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image, useColorScheme, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { FAB } from '@/components/ui/FAB';
import { getNearbyVerifiedVenues, Venue } from '@/services/venueService';
import { supabase } from '@/lib/supabase';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { getNearbyLostItems, getNearbyFoundItems, createLostFoundItem, LostFoundItem } from '@/services/locationService';

export default function LostFoundScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
  const [showForm, setShowForm] = useState(false);
  const [lostItems, setLostItems] = useState<LostFoundItem[]>([]);
  const [foundItems, setFoundItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formType, setFormType] = useState<'lost' | 'found'>('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nearbyVenues, setNearbyVenues] = useState<Venue[]>([]);

  const itemTypes = [
    'Electronics',
    'Accessories',
    'Clothing',
    'Documents',
    'Keys',
    'Wallet',
    'Bag',
    'Other'
  ];

  useEffect(() => {
    loadItems();
    getCurrentLocationAndVenues();
  }, [activeTab]);

  const loadItems = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      if (activeTab === 'lost') {
        const items = await getNearbyLostItems(
          location.coords.latitude,
          location.coords.longitude,
          1000
        );
        setLostItems(items);
      } else {
        const items = await getNearbyFoundItems(
          location.coords.latitude,
          location.coords.longitude,
          1000
        );
        setFoundItems(items);
      }
    } catch (error) {
      console.error('Error loading items:', error);
      Alert.alert('Error', 'Failed to load items');
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
      const venues = await getNearbyVerifiedVenues(
        location.coords.latitude,
        location.coords.longitude
      );
      setNearbyVenues(venues || []); // Handle null case
    } catch (error) {
      console.error('Error getting location/venues:', error);
      // Set some default venues for testing
      setNearbyVenues([
        { 
          id: '1', 
          name: 'Nearby Location 1', 
          description: 'Default location 1',
          latitude: 0,
          longitude: 0,
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          distance_meters: 100 
        },
        { 
          id: '2', 
          name: 'Nearby Location 2',
          description: 'Default location 2',
          latitude: 0,
          longitude: 0,
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          distance_meters: 200 
        },
        { 
          id: '3', 
          name: 'Nearby Location 3',
          description: 'Default location 3',
          latitude: 0,
          longitude: 0,
          verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          distance_meters: 300 
        },
      ]);
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

  const validateForm = () => {
    const errors = [];
    if (!title.trim()) errors.push('Title is required');
    if (!description.trim()) errors.push('Description is required');
    if (!itemType) errors.push('Item type is required');
    if (!selectedVenue) errors.push('Location is required');
    if (!email.trim()) errors.push('Contact email is required');
    if (!phone.trim()) errors.push('Contact phone is required');
    
    if (errors.length > 0) {
      Alert.alert('Missing Information', errors.join('\n'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^\+?[\d\s-]{8,}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const newItem = {
        title: title.trim(),
        description: description.trim(),
        item_type: itemType,
        venue_id: selectedVenue!.id,
        user_id: user!.id,
        photos,
        contact_info: {
          email: email.trim(),
          phone: phone.trim()
        },
        status: formType,
        latitude: selectedVenue!.latitude,
        longitude: selectedVenue!.longitude
      };

      await createLostFoundItem(newItem);
      setShowForm(false);
      resetForm();
      loadItems();
      Alert.alert('Success', `${formType === 'lost' ? 'Lost' : 'Found'} item reported successfully`);
    } catch (error) {
      console.error('Error reporting item:', error);
      Alert.alert('Error', `Failed to report ${formType} item. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleFABPress = () => {
    setFormType(activeTab);
    setShowForm(true);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setItemType('');
    setPhotos([]);
    setSelectedVenue(null);
    setEmail(user?.email || '');
    setPhone('');
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <PokeguideCharacter 
        emotion="thinking"
        size={120}
        style={styles.emptyStateGuide}
      />
      <ThemedText type="title" style={styles.emptyTitle}>
        No {activeTab === 'lost' ? 'Lost' : 'Found'} Items Yet
      </ThemedText>
      <ThemedText style={styles.emptyDescription} dimmed>
        {activeTab === 'lost' 
          ? "Don't worry! We'll help you find your lost items. Tap the + button to report a lost item."
          : "Be a hero! Help others find their lost items by reporting what you've found."}
      </ThemedText>
    </View>
  );

  const renderLostItem = (item: LostFoundItem) => (
    <Card key={item.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <ThemedText type="subtitle" style={styles.itemTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.itemMeta} dimmed>
            {new Date(item.created_at).toLocaleDateString()} • {Math.round(item.distance_meters)}m away
          </ThemedText>
        </View>
        {item.photos?.[0] && (
          <Image 
            source={{ uri: item.photos[0] }} 
            style={styles.itemThumbnail}
          />
        )}
      </View>
      <ThemedText numberOfLines={2} style={styles.itemDescription} dimmed>
        {item.description}
      </ThemedText>
      <View style={styles.itemFooter}>
        <View style={styles.itemTags}>
          <View style={[styles.tag, { backgroundColor: theme.backgroundDim }]}>
            <Ionicons name="pricetag" size={14} color={theme.primary} />
            <ThemedText style={styles.tagText}>{item.item_type || 'Other'}</ThemedText>
          </View>
          <View style={[styles.tag, { backgroundColor: theme.backgroundDim }]}>
            <Ionicons name="location" size={14} color={theme.primary} />
            <ThemedText style={styles.tagText} numberOfLines={1}>
              {item.venue_name || 'Location pending'}
            </ThemedText>
          </View>
        </View>
        <Button 
          variant="ghost" 
          size="small" 
          onPress={() => {
            Alert.alert(
              'Contact Information',
              `Email: ${item.contact_info.email}\nPhone: ${item.contact_info.phone}`,
              [{ text: 'OK' }]
            );
          }}
        >
          Contact
        </Button>
      </View>
    </Card>
  );

  const renderForm = () => (
    <Card style={styles.formContainer}>
      <View style={styles.formHeader}>
        <ThemedText type="title" style={styles.formTitle}>
          Report {formType === 'lost' ? 'Lost' : 'Found'} Item
        </ThemedText>
        <TouchableOpacity
          onPress={() => setShowForm(false)}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.formContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Basic Information */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="information-circle" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle">Basic Information</ThemedText>
          </View>
          
          <TextInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder={`What did you ${formType}? (e.g., Blue Nike Backpack)`}
            maxLength={100}
            style={styles.input}
          />

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Provide detailed description..."
            maxLength={500}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.itemTypeSection}>
            <ThemedText style={styles.label}>Item Type *</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.itemTypeContent}
            >
              {itemTypes.map((type) => (
                <Button
                  key={type}
                  variant={itemType === type ? 'default' : 'outline'}
                  size="small"
                  style={styles.itemTypeButton}
                  onPress={() => setItemType(type)}
                >
                  {type}
                </Button>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* Photos Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="images" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle">Photos</ThemedText>
          </View>
          
          <View style={styles.photoGrid}>
            {[0, 1, 2].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.photoButton,
                  { backgroundColor: theme.backgroundDim }
                ]}
                onPress={pickImage}
                disabled={!!photos[index]}
              >
                {photos[index] ? (
                  <Image source={{ uri: photos[index] }} style={styles.photoPreview} />
                ) : (
                  <Ionicons name="camera" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="location" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle">Location</ThemedText>
          </View>
          
          <ScrollView 
            style={styles.venueList}
            nestedScrollEnabled
          >
            {nearbyVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.venueItem,
                  selectedVenue?.id === venue.id && styles.selectedVenue
                ]}
                onPress={() => setSelectedVenue(venue)}
              >
                <ThemedText>{venue.name}</ThemedText>
                <ThemedText style={styles.venueDistance}>
                  {Math.round(venue.distance_meters)}m
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Contact Information */}
        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="call" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle">Contact Information</ThemedText>
          </View>
          
          <TextInput
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="Your contact email"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          
          <TextInput
            label="Phone *"
            value={phone}
            onChangeText={setPhone}
            placeholder="Your contact phone number"
            keyboardType="phone-pad"
            style={styles.input}
          />
        </View>

        <Button
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        >
          Submit Report
        </Button>
      </ScrollView>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <PokeguideCharacter 
            emotion="concerned-asking" 
            size={60}
            style={styles.guideCharacter}
          />
          <View style={styles.headerText}>
            <ThemedText style={[styles.headerTitle, { color: theme.modalBackground }]}>
              Lost & Found Network
            </ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.modalBackground }]}>
              Connecting lost items with their owners
            </ThemedText>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tabContainer}>
        <View style={[styles.tabWrapper, { backgroundColor: theme.modalBackground }]}>
        <Button 
          onPress={() => setActiveTab('lost')}
            variant={activeTab === 'lost' ? 'default' : 'ghost'}
            style={[
              styles.tabButton,
              activeTab === 'lost' && { backgroundColor: theme.primary }
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name="search-outline" 
                size={18} 
                color={activeTab === 'lost' ? theme.modalBackground : theme.text} 
              />
              <ThemedText style={[
                styles.tabText,
                activeTab === 'lost' && { color: theme.modalBackground }
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
              activeTab === 'found' && { backgroundColor: theme.primary }
            ]}
          >
            <View style={styles.tabContent}>
              <Ionicons 
                name="checkmark-circle-outline" 
                size={18} 
                color={activeTab === 'found' ? theme.modalBackground : theme.text} 
              />
              <ThemedText style={[
                styles.tabText,
                activeTab === 'found' && { color: theme.modalBackground }
              ]}>
                Found Items
              </ThemedText>
            </View>
        </Button>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {showForm ? (
          renderForm()
        ) : (
          <>
            {activeTab === 'lost' ? (
              lostItems.length > 0 ? (
                lostItems.map(renderLostItem)
              ) : (
                renderEmptyState()
              )
            ) : (
              foundItems.length > 0 ? (
                foundItems.map(renderLostItem)
              ) : (
                renderEmptyState()
              )
            )}
          </>
        )}
      </ScrollView>

      {!showForm && (
        <TouchableOpacity
          onPress={handleFABPress}
          style={styles.fabContainer}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.fabContent}>
              <View style={styles.fabIconContainer}>
                <Ionicons name="add" size={24} color="white" />
              </View>
              <ThemedText style={styles.fabText} color="white">
                Report {activeTab === 'lost' ? 'Lost' : 'Found'} Item
              </ThemedText>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    height: 160,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  guideCharacter: {
    marginTop: -20,
  },
  tabContainer: {
    padding: 12,
    marginTop: -40,
    zIndex: 2,
  },
  tabWrapper: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    shadowColor: '#000000',
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
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  itemCard: {
    marginBottom: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
  },
  itemThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  itemDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemTags: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 12,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    left: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fab: {
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fabIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyStateGuide: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formContainer: {
    margin: 16,
    padding: 16,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
  },
  closeButton: {
    padding: 8,
  },
  formContent: {
    flex: 1,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  itemTypeSection: {
    marginBottom: 16,
  },
  itemTypeContent: {
    flexDirection: 'row',
    gap: 8,
  },
  itemTypeButton: {
    marginRight: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  venueList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  venueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  selectedVenue: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  venueDistance: {
    fontSize: 14,
    opacity: 0.7,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
}); 