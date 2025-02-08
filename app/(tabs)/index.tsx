import { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Alert, Platform, Text, TouchableOpacity, Animated as RNAnimated, useColorScheme } from 'react-native';
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

export default function HomeScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [issues, setIssues] = useState<Issue[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    // Mumbai Andheri coordinates
    latitude: 19.1136,
    longitude: 72.8697,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [showGuideMessage, setShowGuideMessage] = useState(false);
  const bounceAnimation = useRef(new RNAnimated.Value(0)).current;
  const locationTimeout = useRef<NodeJS.Timeout>();
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (user) {
      requestLocationAndZoom();
    }
    startBounceAnimation();

    const subscription = issueService.subscribeToIssues((newIssue) => {
      setIssues(current => [...current, newIssue]);
    });

    return () => {
      subscription.unsubscribe();
      if (locationTimeout.current) {
        clearTimeout(locationTimeout.current);
      }
    };
  }, [user]);

  useEffect(() => {
    loadIssuesInBounds();
  }, [region]);

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

  const requestLocationAndZoom = async () => {
    try {
      // Prevent multiple rapid location requests
      if (isLocatingUser) return;
      setIsLocatingUser(true);

      // First check if location services are enabled
      const locationEnabled = await Location.hasServicesEnabledAsync();
      
      if (!locationEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to use all features of the app.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => openSettings()
            }
          ]
        );
        setIsLocatingUser(false);
        return;
      }

      // Then check/request permissions
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'denied') {
        Alert.alert(
          'Permission Required',
          'PokéGuide needs location access to help you find nearby issues. Please enable it in your settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings',
              onPress: () => openSettings()
            }
          ]
        );
        setIsLocatingUser(false);
        return;
      }

      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Denied',
            'You need to grant location permissions to use all features of the app.',
            [{ text: 'OK' }]
          );
          setIsLocatingUser(false);
          return;
        }
      }

      // Get location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        mayShowUserSettingsDialog: false
      });
      
      setLocation(currentLocation);

      // Smoothly animate to user's location with a nice zoom effect
      if (mapRef.current) {
        // First zoom out slightly
        await mapRef.current.animateCamera({
          center: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          pitch: 45,
          heading: 0,
          altitude: 5000,
          zoom: 12
        }, { duration: 1000 });

        // Then zoom in closer to the location
        await mapRef.current.animateCamera({
          center: {
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          },
          pitch: 0,
          heading: 0,
          altitude: 1000,
          zoom: 16
        }, { duration: 1500 });
      }

      // Add debounce to prevent rapid location updates
      locationTimeout.current = setTimeout(() => {
        setIsLocatingUser(false);
      }, 5000);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Could not get your location. Please check your settings and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Open Settings',
            onPress: () => openSettings()
          }
        ]
      );
      setIsLocatingUser(false);
    }
  };

  const handleGuidePress = () => {
    setShowGuideMessage(!showGuideMessage);
    // Updated haptic feedback implementation
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const loadIssuesInBounds = async () => {
    try {
      const { data, error } = await supabase.rpc('get_issues_in_bounds', {
        min_lat: region.latitude - region.latitudeDelta / 2,
        min_lng: region.longitude - region.longitudeDelta / 2,
        max_lat: region.latitude + region.latitudeDelta / 2,
        max_lng: region.longitude + region.longitudeDelta / 2,
      });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const handleMarkerPress = (issue: Issue) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push({
      pathname: '/issue/[id]' as const,
      params: { id: issue.id }
    } as any);
  };

  const handleAddIssue = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/issue/new' as any);
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
          loadIssuesInBounds();
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
            onPress={() => setSelectedIssue(issue)}
          />
        ))}
      </MapView>

      {issues.length === 0 && (
        <TouchableOpacity 
          onPress={handleGuidePress}
          style={styles.emptyState}
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

          {showGuideMessage && (
            <View style={styles.messageBox}>
              <Text style={[styles.messageText, { color: theme.textDim }]}>
                Hey trainer! Tap the + button to report issues you find during your adventure! 
                Let's make our community better together! 🌟
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      <FAB
        icon="add"
        onPress={handleAddIssue}
        style={styles.fab}
        size={28}
      />

      <TouchableOpacity 
        style={styles.locationButton}
        onPress={requestLocationAndZoom}
        disabled={isLocatingUser}
      >
        <Ionicons 
          name={isLocatingUser ? "locate" : "locate-outline"} 
          size={24} 
          color={Colors.light.primary} 
        />
      </TouchableOpacity>

      {selectedIssue && (
        <Card style={styles.issueCard}>
          <View style={styles.issueHeader}>
            <View>
              <ThemedText type="title" style={styles.issueTitle}>
                {selectedIssue.title}
              </ThemedText>
              <ThemedText style={styles.issueStatus} dimmed>
                {selectedIssue.status.replace('_', ' ').toUpperCase()}
              </ThemedText>
            </View>
            <Button
              variant="outline"
              onPress={() => router.push(`/issue/${selectedIssue.id}`)}
            >
              View Details
            </Button>
          </View>
          <ThemedText style={styles.issueDescription} dimmed>
            {selectedIssue.description}
          </ThemedText>
        </Card>
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
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    zIndex: 1,
  },
  emptyState: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
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
    padding: 16,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  issueTitle: {
    fontSize: 18,
    marginBottom: 4,
  },
  issueStatus: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  issueDescription: {
    fontSize: 14,
  },
  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
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
