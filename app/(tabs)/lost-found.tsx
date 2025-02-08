import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Modal, Alert, Image, useColorScheme, TouchableOpacity, SafeAreaView } from 'react-native';
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
import { venueService } from '@/services/venueService';
import { lostItemService } from '@/services/lostItemService';
import { supabase } from '@/lib/supabase';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';

export default function LostFoundScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');
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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    // Validate phone format (basic check)
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
      const newLostItem = {
        title: title.trim(),
        description: description.trim(),
        item_type: itemType,
        location: {
          latitude: selectedVenue.latitude,
          longitude: selectedVenue.longitude
        },
        reporter_id: user!.id,
        photos,
        contact_info: {
          email: email.trim(),
          phone: phone.trim()
        },
        status: 'open'
      };

      await lostItemService.createLostItem(newLostItem);
      setIsModalVisible(false);
      resetForm();
      loadLostItems();
      Alert.alert('Success', 'Lost item reported successfully');
    } catch (error) {
      console.error('Error reporting lost item:', error);
      Alert.alert('Error', 'Failed to report lost item. Please try again.');
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

  const renderLostItem = (item: any) => (
    <Card key={item.id} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <ThemedText type="subtitle" style={styles.itemTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.itemMeta} dimmed>
            {new Date(item.created_at).toLocaleDateString()}
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
              {item.venue?.name || 'Location pending'}
            </ThemedText>
          </View>
        </View>
        <Button variant="ghost" size="small" onPress={() => {}}>
          View Details
        </Button>
      </View>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.modalBackground }]}>
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
        {lostItems.length > 0 ? (
          lostItems.map(renderLostItem)
        ) : (
          renderEmptyState()
        )}
      </ScrollView>

      <FAB 
        icon="add" 
        onPress={() => setIsModalVisible(true)}
        style={styles.fab}
      />

      <Modal
        visible={isModalVisible}
        animationType="slide"
        onRequestClose={() => {
          if (loading) return;
          setIsModalVisible(false);
          resetForm();
        }}
        statusBarTranslucent
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <ThemedText type="title">Report Lost Item</ThemedText>
            <Button
              variant="ghost"
              onPress={() => {
                if (loading) return;
                setIsModalVisible(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </Button>
          </View>

          <ScrollView 
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Card style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Basic Information</ThemedText>
              <TextInput
                label="Title *"
                value={title}
                onChangeText={setTitle}
                placeholder="What did you lose? (e.g., Blue Nike Backpack)"
                maxLength={100}
              />

              <TextInput
                label="Description *"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholder="Provide detailed description including color, brand, distinguishing features..."
                maxLength={500}
                style={styles.textArea}
              />

              <View style={styles.itemTypeSection}>
                <ThemedText style={styles.label}>Item Type *</ThemedText>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.itemTypeScroll}
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
            </Card>

            <Card style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Photos</ThemedText>
              <ThemedText style={styles.helperText} dimmed>
                Add up to 3 clear photos of your item to help others identify it
              </ThemedText>
              <View style={styles.photoGrid}>
                {[0, 1, 2].map((index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.photoSlot,
                      { backgroundColor: theme.backgroundDim }
                    ]}
                    onPress={photos.length > index ? undefined : pickImage}
                  >
                    {photos[index] ? (
                      <>
                        <Image 
                          source={{ uri: photos[index] }}
                          style={styles.previewImage}
                        />
                        <TouchableOpacity
                          style={styles.removePhoto}
                          onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                        >
                          <Ionicons name="close-circle" size={24} color={theme.error} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <View style={styles.addPhotoPlaceholder}>
                        <Ionicons name="camera" size={24} color={theme.textDim} />
                        <ThemedText style={styles.addPhotoText} dimmed>
                          Add Photo
                        </ThemedText>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            <Card style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Location *</ThemedText>
              <ThemedText style={styles.helperText} dimmed>
                Select the location where you last saw the item
              </ThemedText>
              <View style={styles.venueList}>
                {nearbyVenues.map(venue => (
                  <Button
                    key={venue.id}
                    variant={selectedVenue?.id === venue.id ? 'default' : 'outline'}
                    style={styles.venueButton}
                    onPress={() => setSelectedVenue(venue)}
                  >
                    <Ionicons 
                      name="location" 
                      size={16} 
                      color={selectedVenue?.id === venue.id ? theme.modalBackground : theme.primary} 
                    />
                    <ThemedText style={selectedVenue?.id === venue.id ? { color: theme.modalBackground } : undefined}>
                      {venue.name}
                    </ThemedText>
                  </Button>
                ))}
              </View>
            </Card>

            <Card style={styles.formSection}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Contact Information</ThemedText>
              <TextInput
                label="Email *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                placeholder="your.email@example.com"
                autoCapitalize="none"
              />

              <TextInput
                label="Phone *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="+1234567890"
              />
            </Card>

            <Button
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
            >
              Submit Report
            </Button>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
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
  modalContainer: {
    flex: 1,
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  itemTypeSection: {
    marginTop: 16,
  },
  itemTypeScroll: {
    marginTop: 8,
  },
  itemTypeButton: {
    marginRight: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  photoSlot: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  addPhotoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
  },
  venueList: {
    gap: 8,
  },
  venueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  submitButton: {
    marginVertical: 24,
  },
}); 