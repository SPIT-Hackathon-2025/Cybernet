import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Issue } from '@/types';
import { issueService } from '@/services/issueService';
import { IconSymbol } from './ui/IconSymbol';
import { useThemeColor } from '@/hooks/useThemeColor';

export function IssueMap() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [region, setRegion] = useState<Region>({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const iconColor = useThemeColor({}, 'icon');

  useEffect(() => {
    loadIssues();
  }, [region]);

  const loadIssues = async () => {
    try {
      const bounds = {
        north: region.latitude + region.latitudeDelta / 2,
        south: region.latitude - region.latitudeDelta / 2,
        east: region.longitude + region.longitudeDelta / 2,
        west: region.longitude - region.longitudeDelta / 2,
      };
      
      const data = await issueService.getIssues(bounds);
      setIssues(data);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  };

  const getMarkerColor = (status: Issue['status']) => {
    switch (status) {
      case 'pending':
        return '#FFB900';
      case 'verified':
        return '#2ECC71';
      case 'in_progress':
        return '#FF5D00';
      case 'resolved':
        return '#4A4A4A';
      default:
        return '#FF5D00';
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
      >
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            coordinate={issue.location}
            pinColor={getMarkerColor(issue.status)}
          >
            <IconSymbol
              name="house.fill"
              size={24}
              color={iconColor}
            />
          </Marker>
        ))}
      </MapView>
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
}); 