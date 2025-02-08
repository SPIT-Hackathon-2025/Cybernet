import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';

interface MapProps {
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: any;
  onRegionChange?: (region: any) => void;
  onPress?: (event: any) => void;
  children?: React.ReactNode;
}

const Map: React.FC<MapProps> = ({
  initialRegion,
  style,
  onRegionChange,
  onPress,
  children
}) => {
  return (
    <MapView
      provider={PROVIDER_GOOGLE}
      style={[styles.container, style]}
      initialRegion={initialRegion}
      onRegionChange={onRegionChange}
      onPress={onPress}
    >
      {children}
    </MapView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
});

export default Map; 