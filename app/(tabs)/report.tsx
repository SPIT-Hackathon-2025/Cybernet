import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Platform, Alert, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextInput } from '@/components/ui/TextInput';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { issueService } from '@/services/issueService';
import { useAuth } from '@/contexts/AuthContext';
import { gamificationService } from '@/services/gamificationService';
import Map from '@/components/Map';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'react-native';
import { Issue } from '@/types';

const categories = [
  { id: 'infrastructure', name: 'Infrastructure', icon: 'construct', color: '#4A90E2' },
  { id: 'safety', name: 'Safety', icon: 'shield', color: '#E25C4A' },
  { id: 'environmental', name: 'Environmental', icon: 'leaf', color: '#50E3C2' },
  { id: 'community', name: 'Community', icon: 'people', color: '#F5A623' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal', color: '#9B9B9B' },
];

export default function ReportScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
  });
  const [loading, setLoading] = useState(false);
  const [guideEmotion, setGuideEmotion] = useState<'explaining' | 'thinking' | 'happy-with-football'>('explaining');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const progress = [
    !!title,
    !!description,
    !!category,
    !!location,
  ].filter(Boolean).length / 4;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Please enter a title';
    } else if (title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters long';
    }

    if (!description.trim()) {
      newErrors.description = 'Please enter a description';
    } else if (description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters long';
    }

    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!location.latitude || !location.longitude) {
      newErrors.location = 'Please select a location on the map';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets[0].uri) {
        setPhotos(prev => [...prev, ...result.assets.map(asset => asset.uri)].slice(0, 4));
        setGuideEmotion('happy-with-football');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!validateForm()) {
      setGuideEmotion('thinking');
      return;
    }

    try {
      setLoading(true);
      setGuideEmotion('explaining');
      
      const coordinates: [number, number] = [
        Number(location.longitude.toFixed(6)),
        Number(location.latitude.toFixed(6))
      ];
      
      const locationData = {
        type: 'Point' as const,
        coordinates
      };
      
      const issueData: Partial<Issue> = {
        title: title.trim(),
        description: description.trim(),
        category,
        location: locationData,
        photos: photos,
        user_id: user!.id,
        status: 'open' as const,
      };

      console.log('Submitting issue with data:', issueData);
      
      const response = await issueService.createIssue(issueData);

      if (response.status == "open") {
        // Award points only after successful submission
        // await gamificationService.awardPoints(user!.id, 50, 'issue_report');
        
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('');
        setPhotos([]);
        setErrors({});
        
        Alert.alert(
          'Accepted! 🎉',
          'Your report has been submitted successfully. Thank you for helping the community!',
          [
            { 
              text: 'View Report', 
              onPress: () => router.push(`/issue/${response.id}`)
            },
            {
              text: 'Report Another',
              onPress: () => {
                setGuideEmotion('explaining');
              }
            }
          ]
        );
        
        setGuideEmotion('happy-with-football');
      }
    } catch (error) {
      console.error('Error creating issue:', error);
      setGuideEmotion('thinking');
      Alert.alert(
        'Error',
        'Failed to submit report. Please check your input and try again.',
        [
          {
            text: 'OK',
            onPress: () => setGuideEmotion('explaining')
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={[theme.primary, theme.secondary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Animated.Text 
              entering={FadeInDown.delay(200)}
              style={styles.headerTitle}
            >
              Report an Issue
            </Animated.Text>
            <Animated.Text 
              entering={FadeInDown.delay(400)}
              style={styles.headerSubtitle}
            >
              Help improve your community
            </Animated.Text>
          </View>
          <PokeguideCharacter
            emotion={guideEmotion}
            size={60}
            style={styles.guideCharacter}
          />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Title</ThemedText>
            <TextInput
              placeholder="What's the issue?"
              value={title}
              onChangeText={setTitle}
              style={[styles.input, errors.title && styles.inputError]}
              maxLength={100}
            />
            {errors.title && (
              <ThemedText style={styles.errorText}>{errors.title}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Description</ThemedText>
            <TextInput
              placeholder="Provide more details about the issue..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={[styles.input, styles.textArea, errors.description && styles.inputError]}
              maxLength={500}
            />
            {errors.description && (
              <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Category</ThemedText>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    category === cat.id && { backgroundColor: cat.color + '20' },
                    category === cat.id && { borderColor: cat.color }
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setCategory(cat.id);
                  }}
                >
                  <Ionicons 
                    name={cat.icon as any} 
                    size={24} 
                    color={category === cat.id ? cat.color : theme.textDim} 
                  />
                  <ThemedText 
                    style={[
                      styles.categoryText,
                      category === cat.id && { color: cat.color }
                    ]}
                  >
                    {cat.name}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
            {errors.category && (
              <ThemedText style={styles.errorText}>{errors.category}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Location</ThemedText>
            <Map
              style={styles.map}
              initialRegion={{
                ...location,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              onRegionChange={(region) => {
                setLocation({
                  latitude: Number(region.latitude.toFixed(6)),
                  longitude: Number(region.longitude.toFixed(6)),
                });
              }}
            />
            {errors.location && (
              <ThemedText style={styles.errorText}>{errors.location}</ThemedText>
            )}
          </View>

          <View style={styles.formGroup}>
            <ThemedText style={styles.label}>Photos (Optional)</ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photoList}
            >
              {photos.map((photo, index) => (
                <Animated.View 
                  key={index}
                  entering={FadeIn}
                  style={styles.photoContainer}
                >
                  <Image
                    source={{ uri: photo }}
                    style={styles.photo}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="white" />
                  </TouchableOpacity>
                </Animated.View>
              ))}
              {photos.length < 4 && (
                <TouchableOpacity
                  style={styles.addPhotoButton}
                  onPress={pickImage}
                >
                  <Ionicons name="camera" size={24} color={theme.textDim} />
                  <ThemedText style={styles.addPhotoText}>
                    Add Photo
                  </ThemedText>
                </TouchableOpacity>
              )}
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
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  guideCharacter: {
    transform: [{ scaleX: -1 }],
  },
  content: {
    padding: 16,
    marginTop: -32,
  },
  card: {
    padding: 16,
    gap: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#E53E3E',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    minWidth: '45%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  map: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoList: {
    flexGrow: 0,
  },
  photoContainer: {
    marginRight: 8,
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    marginTop: 8,
  },
}); 