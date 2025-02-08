-- First, clean up existing tables and functions
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS issue_verifications CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;
DROP TABLE IF EXISTS found_items CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

DROP FUNCTION IF EXISTS increment_coins CASCADE;
DROP FUNCTION IF EXISTS get_full_profile CASCADE;
DROP FUNCTION IF EXISTS update_user_rank CASCADE;
DROP FUNCTION IF EXISTS get_issues_in_bounds CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create base tables
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    rank TEXT DEFAULT 'Novice Trainer',
    trainer_level INTEGER DEFAULT 1,
    civic_coins INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    category TEXT,
    required_coins INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked BOOLEAN DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    progress INTEGER DEFAULT 0,
    required INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    reward_amount INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    required INTEGER NOT NULL,
    expires_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE point_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326),
    status TEXT DEFAULT 'pending',
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    photos TEXT[],
    category TEXT NOT NULL,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE issue_verifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    verifier_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(issue_id, verifier_id)
);

-- Create helper functions
CREATE OR REPLACE FUNCTION get_issues_in_bounds(
    min_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION
) RETURNS SETOF issues AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM issues
    WHERE ST_Within(
        location,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    )
    AND status != 'resolved'
    ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_coins(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_coins INTEGER;
BEGIN
    UPDATE user_profiles 
    SET civic_coins = civic_coins + amount 
    WHERE id = user_id
    RETURNING civic_coins INTO new_coins;
    
    RETURN new_coins;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_full_profile(user_id UUID)
RETURNS jsonb AS $$
DECLARE
    profile_data jsonb;
    badges_data jsonb;
    activity_data jsonb;
BEGIN
    -- Get basic profile
    SELECT jsonb_build_object(
        'id', id,
        'username', username,
        'avatar_url', avatar_url,
        'rank', rank,
        'trainer_level', trainer_level,
        'civic_coins', civic_coins,
        'trust_score', trust_score
    )
    FROM user_profiles
    WHERE id = user_id
    INTO profile_data;

    -- Get badges (achievements)
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'description', a.description,
            'icon', a.icon,
            'category', a.category,
            'unlocked', ua.unlocked,
            'unlocked_at', ua.unlocked_at,
            'progress', ua.progress,
            'required', ua.required
        )
    )
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = user_id
    INTO badges_data;

    -- Get recent activity
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'title', reason,
            'description', CASE 
                WHEN reason = 'issue_report' THEN 'Reported an issue'
                WHEN reason = 'issue_verification' THEN 'Verified an issue'
                WHEN reason = 'quest_completion' THEN 'Completed a quest'
                ELSE reason
            END,
            'icon', CASE 
                WHEN reason = 'issue_report' THEN 'alert-circle'
                WHEN reason = 'issue_verification' THEN 'checkmark-circle'
                WHEN reason = 'quest_completion' THEN 'trophy'
                ELSE 'star'
            END,
            'points', amount,
            'timestamp', created_at
        )
    )
    FROM point_transactions
    WHERE user_id = user_id
    ORDER BY created_at DESC
    LIMIT 10
    INTO activity_data;

    RETURN jsonb_build_object(
        'profile', COALESCE(profile_data, '{}'::jsonb),
        'badges', COALESCE(badges_data, '[]'::jsonb),
        'recent_activity', COALESCE(activity_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;

-- Create update_user_rank function
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE user_profiles
    SET rank = CASE
        WHEN NEW.civic_coins >= 5000 THEN 'Elite PokeRanger'
        WHEN NEW.civic_coins >= 2500 THEN 'District Champion'
        WHEN NEW.civic_coins >= 1000 THEN 'Community Guardian'
        WHEN NEW.civic_coins >= 500 THEN 'Issue Scout'
        ELSE 'Novice Trainer'
    END
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_user_rank_trigger
    AFTER UPDATE OF civic_coins ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rank();

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view any profile" ON user_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can view achievements" ON achievements
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own achievements" ON user_achievements
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements" ON user_achievements
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quests" ON quests
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quests" ON quests
    FOR ALL TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own transactions" ON point_transactions
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view all issues" ON issues
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage own issues" ON issues
    FOR ALL TO authenticated
    USING (auth.uid() = reporter_id);

-- Insert default achievements
INSERT INTO achievements (name, description, icon, category, required_coins) VALUES
    ('Novice Trainer', 'Just starting your journey to help the community', 'medal', 'Rank', 0),
    ('Issue Scout', 'Learning to identify and report community issues', 'medal', 'Rank', 500),
    ('Community Guardian', 'Actively contributing to community improvement', 'medal', 'Rank', 1000),
    ('District Champion', 'A recognized leader in community service', 'medal', 'Rank', 2500),
    ('Elite PokeRanger', 'Master of civic engagement and community leadership', 'medal', 'Rank', 5000),
    
    -- Environmental Achievements
    ('Green Guardian', 'Report 5 environmental issues', 'leaf', 'Environmental', 100),
    ('Nature Protector', 'Get 10 environmental reports verified', 'tree', 'Environmental', 250),
    ('Eco Warrior', 'Successfully resolve 5 environmental issues', 'recycle', 'Environmental', 500),
    
    -- Infrastructure Achievements
    ('Road Ranger', 'Report 5 infrastructure issues', 'construct', 'Infrastructure', 100),
    ('City Builder', 'Get 10 infrastructure reports verified', 'building', 'Infrastructure', 250),
    ('Urban Legend', 'Successfully resolve 5 infrastructure issues', 'city', 'Infrastructure', 500),
    
    -- Safety Achievements
    ('Safety Scout', 'Report 5 safety issues', 'shield', 'Safety', 100),
    ('Guardian Angel', 'Get 10 safety reports verified', 'alert', 'Safety', 250),
    ('Safety Champion', 'Successfully resolve 5 safety issues', 'security', 'Safety', 500),
    
    -- Community Achievements
    ('Friendly Face', 'Help 5 community members', 'people', 'Community', 100),
    ('Community Star', 'Organize a community event', 'star', 'Community', 250),
    ('Local Hero', 'Make a significant impact in your area', 'trophy', 'Community', 500)
ON CONFLICT (name) DO NOTHING;

-- Create Rohan's profile (assuming the auth.users entry exists)
INSERT INTO user_profiles (id, username, avatar_url)
SELECT 
    id,
    'rohan.pawar',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=rohan'
FROM 
    auth.users 
WHERE 
    email = 'rohan.pawar@noulez.app'
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;