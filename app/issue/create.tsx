import { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { TextInput } from '@/components/ui/TextInput';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/contexts/AuthContext';
import { issueService } from '@/services/issueService';
import { LocationPicker } from '@/components/LocationPicker';
import { Colors } from '@/constants/Colors';

export default function CreateIssueScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title || !description || !location) {
      Alert.alert('Error', 'Please fill in all fields and select a location');
      return;
    }

    setLoading(true);
    try {
      await issueService.createIssue({
        title,
        description,
        location,
        reporter_id: user!.id,
        status: 'pending'
      });
      
      router.back();
    } catch (error) {
      console.error('Error creating issue:', error);
      Alert.alert('Error', 'Failed to create issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="Enter issue title"
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.description}
          placeholder="Describe the issue"
        />
        <LocationPicker
          onLocationSelected={setLocation}
          style={styles.map}
        />
        <Button
          title="Submit"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    padding: 16,
  },
  description: {
    height: 100,
    marginTop: 16,
  },
  map: {
    height: 200,
    marginVertical: 16,
    borderRadius: 8,
  },
  button: {
    marginTop: 16,
  },
}); 