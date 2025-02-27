export interface Issue {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  created_at: string;
  updated_at: string;
  user_id: string;
  category: string;
  photos?: string[];
  verification_count?: number;
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
  rank: TrainerRank;
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
  unlocked_at: string | null;
  progress: number | null;
  required: number | null;
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
  progress: number | null;
  required: number | null;
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

export type QuestType = 
  | 'verify_issues'
  | 'report_issues'
  | 'report_lost_items'
  | 'help_found_items'
  | 'visit_locations'
  | 'daily_login';

export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  reward_amount: number;
  progress: number;
  required: number;
  expires_at: string;
  status: 'active' | 'completed' | 'expired';
  type: QuestType;
  created_at: string;
  updated_at: string;
  isNew?: boolean;
  completed?: boolean;
}

export type QuestAction = {
  type: 'report_issue' | 'verify_issue' | 'resolve_issue';
  count: number;
  completed: number;
}; 