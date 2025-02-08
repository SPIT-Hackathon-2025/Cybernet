import { supabase } from '@/lib/supabase';

export const venueService = {
  async getNearbyVerifiedVenues(latitude: number, longitude: number, radiusInKm: number = 5) {
    const { data, error } = await supabase.rpc('get_nearby_verified_venues', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusInKm
    });
    
    if (error) throw error;
    return data;
  }
}; 