import { supabase } from '@/lib/supabase';
import { UserProfile, Achievement, TrainerRank, Badge } from '@/types';

interface AchievementData {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  required_coins: number;
}

interface UserAchievementData {
  id: string;
  achievement: AchievementData;
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number | null;
  required: number | null;
}

class GamificationService {
  async awardPoints(userId: string, amount: number, reason: string) {
    const { data: transaction, error: transactionError } = await supabase
      .from('point_transactions')
      .insert([
        {
          user_id: userId,
          amount,
          type: reason,
        },
      ])
      .select()
      .single();

    if (transactionError) throw transactionError;

    // Update user's civic coins
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .update({
        civic_coins: supabase.rpc('increment_coins', { user_id: userId, amount })
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) throw profileError;

    // Check for new achievements
    await this.checkAchievements(userId);

    return { transaction, profile };
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        username,
        avatar_url,
        rank,
        trainer_level,
        civic_coins,
        trust_score
      `)
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get achievements
    const { data: achievements, error: achievementsError } = await supabase
      .from('user_achievements')
      .select(`
        id,
        achievement:achievements (
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

    if (achievementsError) throw achievementsError;

    // Get recent activity
    const { data: activity, error: activityError } = await supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (activityError) throw activityError;

    const badges: Badge[] = (achievements as any[]).map(a => ({
      id: a.id,
      name: a.achievement.name,
      description: a.achievement.description,
      icon: a.achievement.icon,
      category: a.achievement.category,
      unlocked: a.unlocked,
      unlocked_at: a.unlocked_at,
      progress: a.progress,
      required: a.required,
    }));

    return {
      ...profile,
      badges,
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
      .from('user_achievements')
      .select(`
        id,
        achievement:achievements (
          id,
          name,
          description,
          icon,
          category,
          required_coins
        ),
        unlocked,
        unlocked_at,
        progress,
        required
      `)
      .eq('user_id', userId);

    if (error) throw error;

    const achievements: Achievement[] = (data as any[]).map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      category: ua.achievement.category,
      unlocked: ua.unlocked,
      unlocked_at: ua.unlocked_at,
      progress: ua.progress,
      required: ua.required || ua.achievement.required_coins,
    }));

    return achievements;
  }

  async getRankRequirements(): Promise<{ rank: TrainerRank; required_coins: number; description: string; }[]> {
    const { data, error } = await supabase
      .from('rank_requirements')
      .select('*')
      .order('required_coins', { ascending: true });

    if (error) throw error;
    return data;
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

  private async checkAchievements(userId: string) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('civic_coins')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Get all achievements that could be unlocked
    const { data: achievements, error: achievementsError } = await supabase
      .from('achievements')
      .select('*')
      .lte('required_coins', profile.civic_coins)
      .order('required_coins', { ascending: true });

    if (achievementsError) throw achievementsError;

    // Update or insert user achievements
    for (const achievement of achievements) {
      const { error: upsertError } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked: true,
          unlocked_at: new Date().toISOString(),
          progress: profile.civic_coins,
          required: achievement.required_coins,
        }, {
          onConflict: 'user_id,achievement_id',
        });

      if (upsertError) throw upsertError;
    }
  }

  private getActivityIcon(type: string): string {
    const icons: Record<string, string> = {
      'issue_report': 'alert-circle',
      'issue_verification': 'checkmark-circle',
      'quest_completion': 'trophy',
      'badge_earned': 'medal',
      'rank_up': 'star',
      'default': 'star',
    };

    return icons[type] || icons.default;
  }
}

export const gamificationService = new GamificationService(); 