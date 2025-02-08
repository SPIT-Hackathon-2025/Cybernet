import { supabase } from '@/lib/supabase';
import { Badge, Quest, UserProfile } from '@/types';

export const gamificationService = {
  async awardPoints(userId: string, amount: number, reason: string) {
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('civic_coins')
      .eq('id', userId)
      .single();

    if (fetchError) throw fetchError;

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        civic_coins: (profile?.civic_coins || 0) + amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async getActiveQuests(userId: string): Promise<Quest[]> {
    const { data, error } = await supabase
      .from('quests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  },

  async updateQuestProgress(questId: string, actionType: string) {
    const { data, error } = await supabase.rpc('update_quest_progress', {
      p_quest_id: questId,
      p_action_type: actionType
    });

    if (error) throw error;
    return data;
  },

  async checkBadgeEligibility(userId: string): Promise<Badge[]> {
    const { data, error } = await supabase.rpc('check_badge_eligibility', {
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  }
}; 