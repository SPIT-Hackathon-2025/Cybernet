import React from 'react';
import { StyleSheet } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup, MapContainerProps } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import Leaflet assets directly
const markerIcon = require('leaflet/dist/images/marker-icon.png').default;
const markerShadow = require('leaflet/dist/images/marker-shadow.png').default;
const markerIconRetina = require('leaflet/dist/images/marker-icon-2x.png').default;

// Fix default icon issue in leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
});

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
  const position: [number, number] = [
    initialRegion?.latitude || 0,
    initialRegion?.longitude || 0
  ];

  const zoom = 13;

  return (
    <div style={{ ...styles.container, ...(style || {}) }}>
      <MapContainer
        center={position}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        eventHandlers={{
          click: onPress,
          moveend: (e: { target: LeafletMap }) => {
            if (onRegionChange) {
              const center = e.target.getCenter();
              const bounds = e.target.getBounds();
              onRegionChange({
                latitude: center.lat,
                longitude: center.lng,
                latitudeDelta: bounds.getNorth() - bounds.getSouth(),
                longitudeDelta: bounds.getEast() - bounds.getWest(),
              });
            }
          },
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {children}
      </MapContainer>
    </div>
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