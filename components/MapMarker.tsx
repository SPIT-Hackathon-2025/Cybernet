import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View } from 'react-native';
import { ThemedText } from './ThemedText';

interface MapMarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  onPress?: () => void;
}

const MapMarker: React.FC<MapMarkerProps> = ({
  coordinate,
  title,
  description,
  onPress
}) => {
  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
    >
      {(title || description) && (
        <Callout>
          <View>
            {title && <ThemedText type="subtitle">{title}</ThemedText>}
            {description && <ThemedText>{description}</ThemedText>}
          </View>
        </Callout>
      )}
    </Marker>
  );
};

export default MapMarker; 