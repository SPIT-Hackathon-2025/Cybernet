import { supabase } from '@/lib/supabase';
import { Badge, Quest, UserProfile } from '@/types';

export const gamificationService = {
  async awardPoints(userId: string, amount: number, reason: string) {
    const { data, error } = await supabase.rpc('award_points', {
      p_user_id: userId,
      p_amount: amount,
      p_reason: reason
    });

    if (error) throw error;
    return data;
  },

  async getUserProfile(userId: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*, badges(*)')
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