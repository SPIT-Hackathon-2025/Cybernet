import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, Platform, Text, TouchableOpacity, Animated as RNAnimated, useColorScheme, Image, ScrollView, ActivityIndicator, Modal } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { Issue } from '@/types';
import { issueService } from '@/services/issueService';
import { FAB } from '@/components/ui/FAB';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { PokeguideCharacter } from '@/components/PokeguideCharacter';
import { openSettings } from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { Button } from '@/components/ui/Button';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [issues, setIssues] = useState<Issue[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    // Mumbai Andheri coordinates
    latitude: -122.545257,
    longitude: 37.513774,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [showGuideMessage, setShowGuideMessage] = useState(false);
  const bounceAnimation = useRef(new RNAnimated.Value(0)).current;
  const locationTimeout = useRef<NodeJS.Timeout>();
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [lastLocationUpdate, setLastLocationUpdate] = useState<number>(0);
  const [isLoadingIssues, setIsLoadingIssues] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (user) {
      setupLocationTracking();
    }
    startBounceAnimation();

    const issueSubscription = issueService.subscribeToIssues((newIssue) => {
      setIssues(current => [...current, newIssue]);
    });

    return () => {
      issueSubscription.unsubscribe();
      if (locationTimeout.current) {
        clearTimeout(locationTimeout.current);
      }
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      console.log('Tab focused');
    }, [user])
  );

  const startBounceAnimation = () => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(bounceAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        RNAnimated.timing(bounceAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const setupLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
      animateToLocation(currentLocation);

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error setting up location tracking:', error);
      setErrorMsg('Error setting up location tracking');
    }
  };

  const requestLocationAndZoom = async () => {
    try {
      const now = Date.now();
      if (isLocatingUser || (now - lastLocationUpdate < 5000)) {
        return;
      }
      setIsLocatingUser(true);
      setLastLocationUpdate(now);

      if (location) {
        animateToLocation(location);
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        animateToLocation(currentLocation);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please check your settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() }
        ]
      );
    } finally {
      setTimeout(() => {
        setIsLocatingUser(false);
      }, 1500);
    }
  };

  const animateToLocation = async (location: Location.LocationObject) => {
    if (mapRef.current) {
      await mapRef.current.animateCamera({
        center: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        pitch: 0,
        heading: 0,
        altitude: 1000,
        zoom: 16
      }, { duration: 1000 });
    }
  };

  const handleGuidePress = () => {
    setShowGuideMessage(!showGuideMessage);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const loadIssuesInBounds = async () => {
    try {
      setIsLoadingIssues(true);
      
      // First refresh location
      if (location) {
        animateToLocation(location);
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);
        animateToLocation(currentLocation);
      }

      // Then fetch issues
      console.log('Fetching all issues...');
      const { data, error } = await supabase.rpc('get_all_issues');
      console.log('get_all_issues response:', { data, error });

      if (error) throw error;
      setIssues(data || []);

    } catch (error) {
      console.error('Error loading issues:', error);
      Alert.alert(
        'Error',
        'Failed to load issues. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingIssues(false);
    }
  };

  const handleMarkerPress = (issue: Issue) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIssue(issue);
  };

  const handleAddIssue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/report' as any);
  };

  const getMarkerColor = (status: Issue['status']) => {
    switch (status) {
      case 'open': return Colors.light.primary;
      case 'in_progress': return Colors.light.warning;
      case 'resolved': return Colors.light.success;
      default: return Colors.light.primary;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.headerGradient}
      >
        <Text style={[styles.headerTitle, { color: theme.text }]}>Community Map</Text>
        <View style={styles.statsContainer}>
          <Card style={[styles.statsCard, { backgroundColor: '#000000' }]}>
            <View style={styles.stat}>
              <Ionicons name="alert-circle" size={24} color={Colors.light.warning} />
              <ThemedText style={[styles.statValue, { color: '#FFFFFF' }]}>
                {issues.filter(i => i.status === 'open').length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#FFFFFF' }]}>
                Pending
              </ThemedText>
            </View>
          </Card>
          <Card style={[styles.statsCard, { backgroundColor: '#000000' }]}>
            <View style={styles.stat}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
              <ThemedText style={[styles.statValue, { color: '#FFFFFF' }]}>
                {issues.filter(i => i.status === 'resolved').length}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: '#FFFFFF' }]}>
                Resolved
              </ThemedText>
            </View>
          </Card>
        </View>
      </LinearGradient>

      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
        }}
        customMapStyle={mapStyle}
      >
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={{
              latitude: issue.location.coordinates[1],
              longitude: issue.location.coordinates[0],
            }}
            pinColor={getMarkerColor(issue.status)}
            onPress={() => handleMarkerPress(issue)}
          />
        ))}
      </MapView>

      <View style={styles.emptyState}>
        <TouchableOpacity 
          onPress={handleGuidePress}
          style={styles.guideButton}
        >
          <RNAnimated.View
            style={[
              styles.guideWrapper,
              {
                transform: [{
                  translateY: bounceAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -10]
                  })
                }]
              }
            ]}
          >
            <PokeguideCharacter 
              emotion={showGuideMessage ? "happy-with-football" : "explaining"} 
              size={20}
              animated={false}
            />
          </RNAnimated.View>
        </TouchableOpacity>

        {showGuideMessage && (
          <View style={styles.messageBox}>
            <Text style={[styles.messageText, { color: theme.textDim }]}>
              {issues.length === 0 
                ? "Hey trainer! Tap the + button to report issues you find during your adventure! Let's make our community better together! 🌟"
                : "Tap on any marker to view issue details. Use the refresh button to update the map! 🗺️"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        <FAB
          icon="add"
          onPress={handleAddIssue}
          style={styles.fab}
          size={28}
        />

        <TouchableOpacity 
          style={[
            styles.refreshButton,
            isLoadingIssues && styles.refreshButtonDisabled
          ]}
          onPress={loadIssuesInBounds}
          disabled={isLoadingIssues}
        >
          {isLoadingIssues ? (
            <ActivityIndicator color={Colors.light.primary} />
          ) : (
            <Ionicons 
              name="refresh" 
              size={24} 
              color={Colors.light.primary} 
            />
          )}
        </TouchableOpacity>
      </View>

      {selectedIssue && (
        <Modal
          visible={!!selectedIssue}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setSelectedIssue(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Card style={styles.issueCardModal}>
                <View style={styles.issueHeader}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setSelectedIssue(null)}
                  >
                    <Ionicons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                  <View style={styles.issueTitleContainer}>
                    <ThemedText type="title" numberOfLines={2} style={styles.issueTitle}>
                      {selectedIssue.title}
                    </ThemedText>
                    <View style={styles.issueMetaContainer}>
                      <ThemedText style={styles.issueStatus} dimmed>
                        {selectedIssue.status.replace('_', ' ').toUpperCase()}
                      </ThemedText>
                      <ThemedText style={styles.issueCategory} dimmed>
                        {selectedIssue.category.toUpperCase()}
                      </ThemedText>
                    </View>
                  </View>
                </View>
                <ScrollView style={styles.issueContent}>
                  <ThemedText style={styles.issueDescription}>
                    {selectedIssue.description}
                  </ThemedText>
                  {selectedIssue.photos && selectedIssue.photos.length > 0 && (
                    <View style={styles.photoContainer}>
                      {selectedIssue.photos.map((photo, index) => (
                        <Image
                          key={index}
                          source={{ uri: photo }}
                          style={styles.issuePhoto}
                          resizeMode="cover"
                        />
                      ))}
                    </View>
                  )}
                  <View style={styles.issueStats}>
                    <ThemedText style={styles.statText} dimmed>
                      Verifications: {selectedIssue.verification_count}
                    </ThemedText>
                    <ThemedText style={styles.statText} dimmed>
                      Reported: {new Date(selectedIssue.created_at).toLocaleDateString()}
                    </ThemedText>
                  </View>
                </ScrollView>
              </Card>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  stat: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 8,
  },
  buttonsContainer: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -50 }], // Adjust for two buttons instead of three
    gap: 16,
    zIndex: 1,
  },
  fab: {
    backgroundColor: Colors.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  guideButton: {
    width: 60, // Constrain the touchable area width
    alignItems: 'center',
  },
  guideWrapper: {
    padding: 4,
  },
  messageBox: {
    position: 'absolute',
    bottom: 120,
    width: 200,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignSelf: 'center',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 16,
    color: '#4A4A4A',
  },
  issueCard: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    maxHeight: '50%',
    padding: 16,
    zIndex: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  issueTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  issueTitle: {
    fontSize: 18,
    marginRight: 32,
  },
  issueStatus: {
    fontSize: 12,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  issueDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  issueMetaContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  issueCategory: {
    fontSize: 12,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  issueContent: {
    marginTop: 16,
  },
  photoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  issuePhoto: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  issueStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statText: {
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#FFFFFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  refreshButtonDisabled: {
    opacity: 0.7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingBottom: 34,
    paddingTop: 20,
  },
  issueCardModal: {
    padding: 16,
    maxHeight: '100%',
    borderRadius: 16,
    minHeight: '100%',
  },
});

const mapStyle = [
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#FFFFFF"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "featureType": "transit.station",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#FF5D00"
      }
    ]
  }
];
