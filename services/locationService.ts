import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { handleLocationError, handleSupabaseError } from '@/utils/errorHandling';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export const getCurrentLocation = async (): Promise<LocationData> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      throw {
        code: 'PERMISSION_DENIED',
        message: 'Location permission is required'
      };
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  } catch (error) {
    throw handleLocationError(error);
  }
};

export const getNearbyVerifiedVenues = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
) => {
  try {
    const { data, error } = await supabase
      .rpc('get_nearby_verified_venues', {
        lat: latitude,
        lng: longitude,
        radius_meters: radiusMeters
      });

    if (error) throw error;
    return data;
  } catch (error: any) {
    // Check if it's a function not found error (wrong parameter names)
    if (error.code === 'PGRST202') {
      console.error('Function parameter mismatch:', error);
      throw new Error('Unable to fetch nearby venues. Please try again later.');
    }
    throw handleSupabaseError(error);
  }
};

export const reverseGeocode = async ({ latitude, longitude }: LocationData) => {
  try {
    const results = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (results && results[0]) {
      return results[0];
    }
    throw new Error('No address found for this location');
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Unable to get address for this location');
  }
}; 