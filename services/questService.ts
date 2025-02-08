import { supabase } from '@/lib/supabase';
import { Quest } from '@/types';

class QuestService {
  async getActiveQuests(userId: string): Promise<Quest[]> {
    try {
      // This will automatically generate new quests if needed
      const { data: quests, error } = await supabase
        .rpc('generate_daily_quests', { user_id_param: userId });

      if (error) throw error;

      return quests.map(quest => ({
        ...quest,
        isNew: new Date(quest.expires_at).getTime() - Date.now() > 86400000, // 24 hours
        completed: quest.progress >= quest.required
      }));
    } catch (error) {
      console.error('Error getting active quests:', error);
      throw error;
    }
  }

  async updateQuestProgress(questId: string, increment: number = 1): Promise<Quest> {
    try {
      const { data: quest, error } = await supabase
        .rpc('update_quest_progress', {
          quest_id_param: questId,
          progress_increment: increment
        });

      if (error) throw error;
      return {
        ...quest,
        isNew: new Date(quest.expires_at).getTime() - Date.now() > 86400000,
        completed: quest.progress >= quest.required
      };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      throw error;
    }
  }

  async completeLoginQuest(userId: string): Promise<void> {
    try {
      const { data: quests } = await supabase
        .from('quests')
        .select('id, title')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('title', 'Daily Check-in')
        .single();

      if (quests?.id) {
        await this.updateQuestProgress(quests.id);
      }
    } catch (error) {
      console.error('Error completing login quest:', error);
    }
  }
}

export const questService = new QuestService(); 