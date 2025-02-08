import { useState } from 'react';
import { StyleSheet, View, ScrollView, Image, Platform } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
// Conditionally import MapView
const MapView = Platform.select({
  web: () => require('react-native-web-maps').default,
  default: () => require('react-native-maps').default,
})();
const Marker = Platform.select({
  web: () => require('react-native-web-maps').Marker,
  default: () => require('react-native-maps').Marker,
})();
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { issueService } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationService } from '@/services/gamificationService';

export default function ReportScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0].uri) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !category) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const issue = await issueService.createIssue({
        title,
        description,
        category,
        location,
        photos,
        reporter_id: user!.id,
        status: 'pending',
      });

      // Award points for reporting
      await gamificationService.awardPoints(user!.id, 50, 'issue_report');
      
      router.push(`/issue/${issue.id}`);
    } catch (error) {
      console.error('Error creating issue:', error);
      alert('Failed to create issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    'Infrastructure',
    'Safety',
    'Environmental',
    'Community',
    'Other',
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.light.warning]}
        style={styles.header}
      >
        <ThemedText style={styles.headerTitle}>Report an Issue</ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Help improve your community by reporting issues you spot
        </ThemedText>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.card}>
          <TextInput
            placeholder="Issue Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <TextInput
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            style={[styles.input, styles.textArea]}
          />

          <View style={styles.categoryContainer}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={category === cat ? 'default' : 'outline'}
                  size="small"
                  style={styles.categoryButton}
                  onPress={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </ScrollView>
          </View>

          <View style={styles.mapContainer}>
            <ThemedText style={styles.label}>Location</ThemedText>
            <MapView
              style={styles.map}
              provider={Platform.OS === 'android' ? 'google' : undefined}
              initialRegion={{
                ...location,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onPress={(e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => 
                setLocation(e.nativeEvent.coordinate)
              }
            >
              <Marker coordinate={location} />
            </MapView>
          </View>

          <View style={styles.photosContainer}>
            <ThemedText style={styles.label}>Photos</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                />
              ))}
              <Button
                variant="outline"
                size="small"
                style={styles.addPhotoButton}
                onPress={pickImage}
              >
                Add Photo
              </Button>
            </ScrollView>
          </View>

          <Button
            onPress={handleSubmit}
            disabled={loading}
            loading={loading}
            style={styles.submitButton}
          >
            Submit Report
          </Button>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  header: {
    padding: 24,
    paddingTop: 60,
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
  content: {
    padding: 16,
    marginTop: -32,
  },
  card: {
    gap: 16,
  },
  input: {
    marginBottom: 8,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  categoryContainer: {
    gap: 8,
  },
  categoryButton: {
    marginRight: 8,
  },
  mapContainer: {
    gap: 8,
  },
  map: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photosContainer: {
    gap: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    justifyContent: 'center',
  },
  submitButton: {
    marginTop: 8,
  },
}); 