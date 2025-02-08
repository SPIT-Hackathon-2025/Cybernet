import { useEffect, useState } from 'react';
import { StyleSheet, View, Alert, Platform, Text } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { useAuth } from '@/contexts/AuthContext';
import { Issue } from '@/types';
import { issueService } from '@/services/issueService';
import { FAB } from '@/components/ui/FAB';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { Colors } from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';

export default function MapScreen() {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      try {
        // Request foreground location permission
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrorMsg('Permission to access location was denied');
          Alert.alert(
            'Location Permission Required',
            'Please enable location services to use all features of the app.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Get current location
        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation(currentLocation);

        // Update region with current location
        setRegion({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });

        // Start location updates
        if (Platform.OS !== 'web') {
          Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            },
            (newLocation) => {
              setLocation(newLocation);
            }
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
        setErrorMsg('Error getting location');
      }
    })();

    // Set up realtime subscription for issues
    const subscription = issueService.subscribeToIssues((newIssue) => {
      setIssues(current => [...current, newIssue]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const getMarkerColor = (status: Issue['status']) => {
    switch (status) {
      case 'pending': return Colors.light.warning;
      case 'verified': return Colors.light.success;
      case 'in_progress': return Colors.light.primary;
      case 'resolved': return Colors.light.textDim;
      default: return Colors.light.primary;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0,0,0,0.5)', 'transparent']}
        style={styles.headerGradient}
      >
        <Text style={styles.headerTitle}>Community Map</Text>
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons name="alert-circle" size={24} color={Colors.light.warning} />
            <Text style={styles.statNumber}>
              {issues.filter(i => i.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={Colors.light.success} />
            <Text style={styles.statNumber}>
              {issues.filter(i => i.status === 'resolved').length}
            </Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </Card>
        </View>
      </LinearGradient>

      <MapView
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
            onPress={() => router.push(`/issue/${issue.id}`)}
          >
            <View style={[styles.markerContainer, { backgroundColor: getMarkerColor(issue.status) }]}>
              <Ionicons name="alert-circle" size={24} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      <FAB
        icon="add"
        onPress={() => router.push('/issue/new')}
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
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
    paddingTop: 48,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statCard: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 12,
    width: '45%',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textDim,
    marginTop: 2,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    borderWidth: 2,
    borderColor: 'white',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 80,
    backgroundColor: Colors.light.primary,
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});

const mapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#e9e9e9"
      },
      {
        "lightness": 17
      }
    ]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#f5f5f5"
      },
      {
        "lightness": 20
      }
    ]
  },
  // Add more map styles as needed
];
