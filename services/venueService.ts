import { supabase } from '@/lib/supabase';
import { handleSupabaseError } from '@/utils/errorHandling';

export interface Venue {
  id: string;
  name: string;
  description: string | null;
  latitude: number;
  longitude: number;
  verified: boolean;
  created_at: string;
  updated_at: string;
  distance_meters: number;
}

export const getNearbyVerifiedVenues = async (
  latitude: number,
  longitude: number,
  radiusMeters: number = 1000
): Promise<Venue[]> => {
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

export const venueService = {
  getNearbyVerifiedVenues
}; 