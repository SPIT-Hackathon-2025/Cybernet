import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Image, useColorScheme, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { getNearbyVerifiedVenues, Venue } from '@/services/venueService';
import { supabase } from '@/lib/supabase';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AddLostFoundScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { type } = useLocalSearchParams<{ type: 'lost' | 'found' }>();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [itemType, setItemType] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [email, setEmail] = useState(user?.email || '');
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
    getCurrentLocationAndVenues();
  }, []);

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
        location.coords.longitude,
        1000
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
      
      if (fileInfo.size > 10 * 1024 * 1024) {
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
        location: `SRID=4326;POINT(${selectedVenue!.longitude} ${selectedVenue!.latitude})`,
        user_id: user!.id,
        venue_id: selectedVenue!.id,
        photos,
        contact_info: {
          email: email.trim(),
          phone: phone.trim()
        },
        status: type
      };

      const { data, error } = await supabase
        .from('lost_items')
        .insert([newItem]);

      if (error) throw error;

      Alert.alert(
        'Success', 
        `${type === 'lost' ? 'Lost' : 'Found'} item reported successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error reporting item:', error);
      Alert.alert('Error', `Failed to report ${type} item. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Report {type === 'lost' ? 'Lost' : 'Found'} Item
        </ThemedText>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Card style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="information-circle" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Basic Information</ThemedText>
          </View>
          
          <TextInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="What did you lose? (e.g., Blue Nike Backpack)"
            maxLength={100}
            style={styles.input}
          />

          <TextInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            placeholder="Provide detailed description including color, brand, distinguishing features..."
            maxLength={500}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.itemTypeSection}>
            <ThemedText style={styles.label}>Item Type *</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.itemTypeScroll}
              contentContainerStyle={styles.itemTypeContent}
            >
              {itemTypes.map((type) => (
                <Button
                  key={type}
                  variant={itemType === type ? 'default' : 'outline'}
                  size="small"
                  style={[
                    styles.itemTypeButton,
                    itemType === type && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => setItemType(type)}
                >
                  {type}
                </Button>
              ))}
            </ScrollView>
          </View>
        </Card>

        <Card style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="images" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Photos</ThemedText>
          </View>
          <ThemedText style={styles.helperText} dimmed>
            Add up to 3 clear photos of your item to help others identify it
          </ThemedText>
          <View style={styles.photoGrid}>
            {[0, 1, 2].map((index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.photoButton,
                  { backgroundColor: theme.backgroundDim },
                  photos[index] && styles.photoPreviewContainer
                ]}
                onPress={pickImage}
                disabled={photos[index] || loading}
              >
                {photos[index] ? (
                  <>
                    <Image source={{ uri: photos[index] }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={[styles.removePhotoButton, { backgroundColor: theme.error }]}
                      onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                    >
                      <Ionicons name="close" size={16} color="white" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <Ionicons name="camera" size={24} color={theme.primary} />
                    <ThemedText style={styles.photoButtonText} dimmed>
                      Add Photo
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="location" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Location</ThemedText>
          </View>
          <ThemedText style={styles.helperText} dimmed>
            Select the venue where you {type === 'lost' ? 'lost' : 'found'} the item
          </ThemedText>
          <ScrollView 
            style={styles.venueList}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {nearbyVenues.map((venue) => (
              <TouchableOpacity
                key={venue.id}
                style={[
                  styles.venueItem,
                  { borderColor: theme.border },
                  selectedVenue?.id === venue.id && { 
                    borderColor: theme.primary,
                    backgroundColor: theme.backgroundDim
                  }
                ]}
                onPress={() => setSelectedVenue(venue)}
              >
                <View style={styles.venueInfo}>
                  <ThemedText style={styles.venueName}>{venue.name}</ThemedText>
                  <ThemedText style={styles.venueDistance} dimmed>
                    {Math.round(venue.distance_meters)}m away
                  </ThemedText>
                </View>
                {selectedVenue?.id === venue.id && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Card>

        <Card style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIcon, { backgroundColor: theme.backgroundDim }]}>
              <Ionicons name="call" size={24} color={theme.primary} />
            </View>
            <ThemedText type="subtitle" style={styles.sectionTitle}>Contact Information</ThemedText>
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
        </Card>

        <View style={styles.submitContainer}>
          <Button
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          >
            Submit Report
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formSection: {
    marginBottom: 16,
    padding: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 16,
  },
  itemTypeSection: {
    marginBottom: 8,
  },
  itemTypeScroll: {
    marginHorizontal: -16,
  },
  itemTypeContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  itemTypeButton: {
    marginRight: 8,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoPreviewContainer: {
    padding: 0,
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  removePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 12,
    marginTop: 4,
  },
  venueList: {
    maxHeight: 200,
  },
  venueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 8,
  },
  venueInfo: {
    flex: 1,
    marginRight: 12,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  venueDistance: {
    fontSize: 14,
  },
  submitContainer: {
    marginTop: 8,
  },
  submitButton: {
    paddingVertical: 12,
  },
}); 