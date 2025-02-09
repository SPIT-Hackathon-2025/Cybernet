import { supabase } from '@/lib/supabase';
import { Issue } from '@/types';

export const issueService = {
  async getAllIssues(): Promise<Issue[]> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getIssues(bounds: { north: number; south: number; east: number; west: number }): Promise<Issue[]> {
    const { data, error } = await supabase
      .rpc('get_issues_in_bounds', {
        min_lng: bounds.west,
        min_lat: bounds.south,
        max_lng: bounds.east,
        max_lat: bounds.north
      });

    if (error) throw error;
    return data;
  },

  async createIssue(issueData: Partial<Issue>): Promise<Issue> {
    const response = await supabase
      .rpc('submit_issue', {
        p_title: issueData.title,
        p_description: issueData.description,
        p_category: issueData.category,
        p_location: issueData.location,
        p_photos: issueData.photos,
        p_user_id: issueData.user_id
      });

    // Log the complete response
    console.log('Complete response from submit_issue:', response);

    if (response.error) {
      console.error('Error creating issue:', response.error);
      throw response.error;
    }

    return response.data;
  },

  subscribeToIssues(callback: (issue: Issue) => void) {
    return supabase
      .channel('public:issues')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        (payload) => {
          callback(payload.new as Issue);
        }
      )
      .subscribe();
  },

  async getIssueById(id: string): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  getIssue: async function(id: string): Promise<Issue> {
    return this.getIssueById(id);
  },

  async updateIssue(id: string, updates: Partial<Issue>): Promise<Issue> {
    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
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
  },

  findIssueById(issues: Issue[], id: string): Issue | undefined {
    return issues.find(issue => issue.id === id);
  }
}; 