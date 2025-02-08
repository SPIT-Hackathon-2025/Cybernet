import { supabase } from '@/lib/supabase';
import { UserProfile, Achievement } from '@/types';

class GamificationService {
  async awardPoints(userId: string, amount: number, reason: string) {
    const { data, error } = await supabase
      .from('point_transactions')
      .insert([
        {
          user_id: userId,
          amount,
          type: reason,
        },
      ]);

    if (error) throw error;
    return data;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    // Get basic user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get badges
    const { data: badges, error: badgesError } = await supabase
      .from('user_badges')
      .select(`
        id,
        badge:badges (
          name,
          description,
          icon,
          category
        ),
        unlocked,
        unlocked_at,
        progress,
        required
      `)
      .eq('user_id', userId);

    if (badgesError) throw badgesError;

    // Get recent activity
    const { data: activity, error: activityError } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    return {
      ...user,
      badges: badges.map(b => ({
        id: b.id,
        name: b.badge.name,
        description: b.badge.description,
        icon: b.badge.icon,
        category: b.badge.category,
        unlocked: b.unlocked,
        unlocked_at: b.unlocked_at,
        progress: b.progress,
        required: b.required,
      })),
      recent_activity: activity.map(a => ({
        id: a.id,
        title: a.type,
        description: `Earned ${a.amount} CivicCoins`,
        icon: this.getActivityIcon(a.type),
        points: a.amount,
        timestamp: a.created_at,
      })),
    };
  }

  async getAchievements(userId: string): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select(`
        id,
        name,
        description,
        icon,
        category,
        user_achievements (
          unlocked,
          unlocked_at,
          progress,
          required
        )
      `)
      .eq('user_achievements.user_id', userId);

    if (error) throw error;

    return data.map(achievement => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      category: achievement.category,
      unlocked: achievement.user_achievements?.[0]?.unlocked ?? false,
      unlocked_at: achievement.user_achievements?.[0]?.unlocked_at,
      progress: achievement.user_achievements?.[0]?.progress,
      required: achievement.user_achievements?.[0]?.required,
    }));
  }

  async getActiveQuests(userId: string) {
    const { data, error } = await supabase
      .from('quests')
      .select(`
        id,
        title,
        description,
        reward_amount,
        progress,
        required,
        expires_at,
        status
      `)
      .eq('user_id', userId)
      .eq('status', 'active');

    if (error) throw error;
    return data.map(quest => ({
      ...quest,
      isNew: new Date(quest.expires_at).getTime() - Date.now() > 86400000, // 24 hours
      completed: quest.progress >= quest.required
    }));
  }

  async updateQuestProgress(questId: string, actionType: string) {
    const { data, error } = await supabase
      .rpc('update_quest_progress', {
        quest_id: questId,
        action_type: actionType,
      });

    if (error) throw error;
    return data;
  }

  async checkBadgeEligibility(userId: string) {
    const { data, error } = await supabase
      .rpc('check_badge_eligibility', {
        user_id: userId,
      });

    if (error) throw error;
    return data;
  }

  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'issue_report': 'alert-circle',
      'issue_verification': 'checkmark-circle',
      'quest_completion': 'trophy',
      'badge_earned': 'medal',
      'default': 'star',
    };

    return icons[type] || icons.default;
  }
}

export const gamificationService = new GamificationService(); 