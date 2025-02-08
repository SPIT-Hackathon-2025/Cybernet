import { supabase } from '@/lib/supabase';
import { Issue } from '@/types';

export const issueService = {
  async createIssue(issue: Omit<Issue, 'id' | 'created_at' | 'updated_at' | 'verification_count'>) {
    const { data, error } = await supabase
      .from('issues')
      .insert([issue])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getIssues(bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .filter('location', 'contained_by', `POLYGON((
        ${bounds.west} ${bounds.south},
        ${bounds.east} ${bounds.south},
        ${bounds.east} ${bounds.north},
        ${bounds.west} ${bounds.north},
        ${bounds.west} ${bounds.south}
      ))`);

    if (error) throw error;
    return data;
  },

  async getIssueById(id: string) {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async verifyIssue(issueId: string, userId: string) {
    const { data, error } = await supabase.rpc('verify_issue', {
      p_issue_id: issueId,
      p_user_id: userId
    });

    if (error) throw error;
    return data;
  },

  async updateIssueStatus(issueId: string, status: Issue['status']) {
    const { data, error } = await supabase
      .from('issues')
      .update({ status })
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}; 