import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { handleLocationError, handleSupabaseError } from '@/utils/errorHandling';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface LostFoundItem {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  user_id: string;
  venue_id: string | null;
  status: 'lost' | 'found';
  photos: string[];
  item_type: string;
  contact_info: {
    email: string;
    phone: string;
  };
  created_at: string;
  updated_at: string;
  distance_meters: number;
  venue_name: string | null;
}

export interface Venue {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  distance_meters?: number;
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

export const getNearbyLostItems = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<LostFoundItem[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_nearby_lost_items', {
        lat: latitude,
        lng: longitude,
        radius_meters: radiusMeters
      });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

export const getNearbyFoundItems = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<LostFoundItem[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_nearby_found_items', {
        lat: latitude,
        lng: longitude,
        radius_meters: radiusMeters
      });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw handleSupabaseError(error);
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

export const createLostFoundItem = async (
  item: Omit<LostFoundItem, 'id' | 'created_at' | 'updated_at' | 'distance_meters' | 'venue_name'>
) => {
  try {
    const { data, error } = await supabase
      .from('lost_items')
      .insert([item])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

export const getAllLostItems = async (): Promise<LostFoundItem[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_lost_items');

    if (error) throw error;
    return data.map((item: any) => ({
      ...item,
      contact_info: {
        email: item.contact_info.email || '',
        phone: item.contact_info.phone || ''
      }
    }));
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

export const getAllVerifiedVenues = async () => {
  try {
    const { data, error } = await supabase
      .rpc('get_all_venues');

    if (error) throw error;
    return data.filter(venue => venue.verified).map(venue => ({
      id: venue.id,
      name: venue.name,
      latitude: venue.coordinates.latitude,
      longitude: venue.coordinates.longitude,
      verified: venue.verified,
      created_at: venue.created_at,
      updated_at: venue.updated_at
    }));
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
};

export const submitLostItem = async (item: {
  title: string;
  description: string;
  venue_id: string;
  item_type: string;
  contact_info: {
    email: string;
    phone: string;
  };
  photos?: string[];
}) => {
  try {
    const { data, error } = await supabase
      .rpc('submit_lost_item', {
        p_title: item.title,
        p_description: item.description,
        p_venue_id: item.venue_id,
        p_item_type: item.item_type,
        p_contact_info: item.contact_info,
        p_photos: item.photos
      });

    if (error) throw error;
    return data;
  } catch (error: any) {
    throw handleSupabaseError(error);
  }
}; 