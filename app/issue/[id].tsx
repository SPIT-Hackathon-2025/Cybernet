import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Image, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { Issue } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { issueService } from '@/services/issueService';
import { gamificationService } from '@/services/gamificationService';

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      router.replace('/issue/new');
      return;
    }

    loadIssue();
  }, [id]);

  const loadIssue = async () => {
    try {
      const data = await issueService.getIssue(id as string);
      setIssue(data);
    } catch (error) {
      console.error('Error loading issue:', error);
      Alert.alert('Error', 'Failed to load issue details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!issue || !user) return;

    try {
      setVerifying(true);
      await issueService.verifyIssue(issue.id, user.id);
      // Award points for verification
      await gamificationService.awardPoints(user.id, 20, 'issue_verification');
      await loadIssue();
    } catch (error) {
      console.error('Error verifying issue:', error);
      alert('Failed to verify issue. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const getStatusColor = (status: Issue['status']) => {
    switch (status) {
      case 'pending':
        return '#FFB900';
      case 'verified':
        return '#2ECC71';
      case 'in_progress':
        return '#FF5D00';
      case 'resolved':
        return '#666666';
      default:
        return '#FF5D00';
    }
  };

  if (!issue) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[getStatusColor(issue.status), '#FFFFFF']}
        style={styles.header}
      >
        <Button
          variant="outline"
          size="small"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          Back
        </Button>
        <View style={styles.statusContainer}>
          <View 
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(issue.status) }
            ]} 
          />
          <ThemedText style={styles.statusText}>
            {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
          </ThemedText>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Card style={styles.mainCard}>
          <ThemedText type="title" style={styles.title}>
            {issue.title}
          </ThemedText>

          <ThemedText style={styles.description}>
            {issue.description}
          </ThemedText>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Category:</ThemedText>
            <ThemedText style={styles.value}>{issue.category}</ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Reported:</ThemedText>
            <ThemedText style={styles.value}>
              {new Date(issue.created_at).toLocaleDateString()}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <ThemedText style={styles.label}>Verifications:</ThemedText>
            <ThemedText style={styles.value}>
              {issue.verification_count}
            </ThemedText>
          </View>
        </Card>

        <Card style={styles.mapCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Location
          </ThemedText>
          <MapView
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              ...issue.location,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker coordinate={issue.location} />
          </MapView>
        </Card>

        {issue.photos.length > 0 && (
          <Card style={styles.photosCard}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Photos
            </ThemedText>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.photoScroll}
            >
              {issue.photos.map((photo, index) => (
                <Animated.Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  entering={FadeIn.delay(index * 100)}
                />
              ))}
            </ScrollView>
          </Card>
        )}

        <View style={styles.actions}>
          {issue.status === 'pending' && (
            <Button
              onPress={handleVerify}
              loading={verifying}
              disabled={verifying}
              style={styles.verifyButton}
            >
              Verify Issue
            </Button>
          )}
          <Button
            variant="outline"
            onPress={() => {}}
          >
            Share
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    height: 150,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    marginTop: -48,
  },
  mainCard: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  description: {
    marginBottom: 24,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
  },
  value: {
    fontWeight: '500',
  },
  mapCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  map: {
    height: 200,
  },
  photosCard: {
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden',
  },
  photoScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  photo: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  verifyButton: {
    flex: 1,
  },
}); 