import { supabase } from '@/lib/supabase';

export const lostItemService = {
  async createLostItem(data: {
    title: string;
    description: string;
    location: { latitude: number; longitude: number };
    reporter_id: string;
    photos: string[];
    item_type: string;
    contact_info: { email: string; phone: string; };
  }) {
    // Convert location to PostGIS point
    const point = `POINT(${data.location.longitude} ${data.location.latitude})`;
    
    const { data: item, error } = await supabase
      .from('lost_items')
      .insert([{
        ...data,
        location: point
      }])
      .select()
      .single();
      
    if (error) throw error;
    return item;
  },

  async getLostItems() {
    const { data, error } = await supabase
      .from('lost_items')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    
    // Get usernames in a separate query if needed
    if (data) {
      const userIds = [...new Set(data.map(item => item.reporter_id))];
      const { data: users } = await supabase
        .from('auth_users')
        .select('id, username')
        .in('id', userIds);
        
      return data.map(item => ({
        ...item,
        reporter: users?.find(u => u.id === item.reporter_id)
      }));
    }
    return data;
  }
}; 