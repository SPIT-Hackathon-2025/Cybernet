import React from 'react';
import { Marker as LeafletMarker, Popup } from 'react-leaflet';

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
    <LeafletMarker
      position={[coordinate.latitude, coordinate.longitude]}
      eventHandlers={{
        click: onPress,
      }}
    >
      {(title || description) && (
        <Popup>
          {title && <strong>{title}</strong>}
          {description && <p>{description}</p>}
        </Popup>
      )}
    </LeafletMarker>
  );
};

export default MapMarker; 