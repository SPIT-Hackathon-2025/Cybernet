export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'in_progress' | 'resolved';
  location: {
    latitude: number;
    longitude: number;
  };
  reporter_id: string;
  created_at: string;
  photos?: string[];
  category?: string;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  trainer_level: number;
  civic_coins: number;
  trust_score: number;
  rank: string;
  badges: Badge[];
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon_url: string;
}

export type TrainerRank = 
  | 'Novice Trainer' 
  | 'Issue Scout' 
  | 'Community Guardian' 
  | 'District Champion' 
  | 'Elite PokeRanger';

export type Quest = {
  id: string;
  title: string;
  description: string;
  reward_coins: number;
  required_actions: QuestAction[];
  deadline?: string;
  status: 'active' | 'completed' | 'expired';
};

export type QuestAction = {
  type: 'report_issue' | 'verify_issue' | 'resolve_issue';
  count: number;
  completed: number;
}; 