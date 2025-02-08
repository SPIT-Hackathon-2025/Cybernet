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
  rank: string;
  trainer_level: number;
  civic_coins: number;
  trust_score: number;
  badges: Badge[];
  recent_activity: Activity[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: number;
  required?: number;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  timestamp: string;
}

export interface Achievement extends Badge {
  category: string;
  progress?: number;
  required?: number;
}

export interface Colors {
  light: ColorTheme;
  dark: ColorTheme;
}

export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  card: string;
  notification: string;
  tint: string;
  tabIconDefault: string;
  tabIconSelected: string;
  text: string;
  textDim: string;
  background: string;
  border: string;
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
  reward_amount: number;
  progress: number;
  required: number;
  expires_at?: string;
  status: 'active' | 'completed' | 'expired';
  isNew?: boolean;
  completed?: boolean;
};

export type QuestAction = {
  type: 'report_issue' | 'verify_issue' | 'resolve_issue';
  count: number;
  completed: number;
}; 