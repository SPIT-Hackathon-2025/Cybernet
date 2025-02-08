export type Issue = {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'pending' | 'verified' | 'in_progress' | 'resolved';
  reporter_id: string;
  photos: string[];
  category: string;
  created_at: string;
  updated_at: string;
  verification_count: number;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  trainer_level: number;
  civic_coins: number;
  badges: Badge[];
  rank: TrainerRank;
  trust_score: number;
  created_at: string;
};

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  category: 'environmental' | 'infrastructure' | 'safety' | 'community';
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
};

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