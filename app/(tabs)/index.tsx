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

export default function MapScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const [issues, setIssues] = useState<Issue[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const mapRef = useRef<MapView>(null);
  const [showGuideMessage, setShowGuideMessage] = useState(false);
  const bounceAnimation = useRef(new RNAnimated.Value(0)).current;
  const locationTimeout = useRef<NodeJS.Timeout>();
  const [isLocatingUser, setIsLocatingUser] = useState(false);

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

  const loadIssuesInView = async (newRegion: Region) => {
    try {
      const bounds = {
        north: newRegion.latitude + newRegion.latitudeDelta / 2,
        south: newRegion.latitude - newRegion.latitudeDelta / 2,
        east: newRegion.longitude + newRegion.longitudeDelta / 2,
        west: newRegion.longitude - newRegion.longitudeDelta / 2,
      };
      const data = await issueService.getIssues(bounds);
      setIssues(data);
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
      case 'pending': return theme.warning;
      case 'verified': return theme.success;
      case 'in_progress': return theme.primary;
      case 'resolved': return theme.textDim;
      default: return theme.primary;
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
          <Card style={styles.statCard}>
            <Ionicons name="alert-circle" size={24} color={theme.warning} />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {issues.filter(i => i.status === 'pending').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textDim }]}>Pending</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            <Text style={[styles.statNumber, { color: theme.text }]}>
              {issues.filter(i => i.status === 'resolved').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textDim }]}>Resolved</Text>
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
          loadIssuesInView(newRegion);
        }}
        customMapStyle={mapStyle}
      >
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={{
              latitude: issue.location.latitude,
              longitude: issue.location.longitude,
            }}
            title={issue.title}
            description={issue.description}
            onPress={() => handleMarkerPress(issue)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(issue.status) }]}>
              <Ionicons name="alert-circle" size={24} color="white" />
            </View>
          </Marker>
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
  statCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
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
