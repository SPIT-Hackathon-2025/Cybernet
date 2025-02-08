-- First, clean up existing tables and functions
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS user_achievements CASCADE;
DROP TABLE IF EXISTS quests CASCADE;
DROP TABLE IF EXISTS point_transactions CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS issue_verifications CASCADE;
DROP TABLE IF EXISTS lost_items CASCADE;

DROP FUNCTION IF EXISTS increment_coins CASCADE;
DROP FUNCTION IF EXISTS get_full_profile CASCADE;
DROP FUNCTION IF EXISTS update_user_rank CASCADE;
DROP FUNCTION IF EXISTS get_issues_in_bounds CASCADE;
DROP FUNCTION IF EXISTS get_nearby_verified_venues(double precision, double precision, integer);
DROP FUNCTION IF EXISTS get_nearby_verified_venues(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS get_nearby_verified_venues(lat double precision, lng double precision, radius_km double precision);
DROP FUNCTION IF EXISTS get_nearby_verified_venues(lat double precision, lng double precision, radius_meters integer);

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create base tables
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    rank TEXT NOT NULL DEFAULT 'Novice Trainer',
    trainer_level INTEGER NOT NULL DEFAULT 1,
    civic_coins INTEGER NOT NULL DEFAULT 0,
    trust_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    email_status email_status DEFAULT 'pending',
    email_verified_at TIMESTAMPTZ
);

CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL,
    required_coins INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    unlocked BOOLEAN NOT NULL DEFAULT FALSE,
    unlocked_at TIMESTAMPTZ,
    progress INTEGER,
    required INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

CREATE TABLE quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reward_amount INTEGER NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    required INTEGER NOT NULL,
    expires_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE point_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    location GEOGRAPHY(POINT) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    photos TEXT[],
    verification_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issue_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(issue_id, user_id)
);

CREATE TABLE lost_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location GEOGRAPHY(POINT) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id),
    status TEXT NOT NULL DEFAULT 'lost',
    photos TEXT[],
    item_type TEXT NOT NULL,
    contact_info JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX venues_location_idx ON venues USING gist (ST_SetSRID(ST_Point(longitude, latitude), 4326));
CREATE INDEX issues_location_idx ON issues USING gist (location);
CREATE INDEX lost_items_location_idx ON lost_items USING gist (location);
CREATE INDEX issues_status_idx ON issues(status);
CREATE INDEX lost_items_status_idx ON lost_items(status);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Users can view any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for authentication service" ON user_profiles;

-- Create updated policies
CREATE POLICY "Users can view any profile"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can do everything"
    ON user_profiles
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Users can insert their own profile"
    ON user_profiles FOR INSERT
    TO authenticated
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
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view venues" ON venues
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create venues" ON venues
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can view lost items" ON lost_items
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can create lost items" ON lost_items
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lost items" ON lost_items
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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
    WHERE ST_Intersects(
        location::geometry,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_coins(user_id UUID, amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_amount INTEGER;
BEGIN
    UPDATE user_profiles
    SET civic_coins = civic_coins + amount
    WHERE id = user_id
    RETURNING civic_coins INTO new_amount;
    
    RETURN new_amount;
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

-- Create the function with both parameter options
CREATE OR REPLACE FUNCTION get_nearby_verified_venues(
    lat double precision,
    lng double precision,
    radius_km double precision DEFAULT 1.0
)
RETURNS SETOF venues AS $$
DECLARE
    radius_meters integer;
BEGIN
    -- Convert km to meters
    radius_meters := (radius_km * 1000)::integer;
    
    RETURN QUERY
    SELECT *
    FROM venues
    WHERE verified = true
    AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
        radius_meters
    )
    ORDER BY ST_Distance(
        location,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_nearby_verified_venues(double precision, double precision, double precision) TO authenticated;

-- Create update_user_rank function
CREATE OR REPLACE FUNCTION update_user_rank()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.civic_coins >= 5000 THEN
        NEW.rank := 'Elite PokeRanger';
    ELSIF NEW.civic_coins >= 2500 THEN
        NEW.rank := 'District Champion';
    ELSIF NEW.civic_coins >= 1000 THEN
        NEW.rank := 'Community Guardian';
    ELSIF NEW.civic_coins >= 500 THEN
        NEW.rank := 'Issue Scout';
    ELSE
        NEW.rank := 'Novice Trainer';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_user_rank_trigger
    BEFORE UPDATE OF civic_coins ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_user_rank();

CREATE TRIGGER update_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lost_items_updated_at
    BEFORE UPDATE ON lost_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
    ('Local Hero', 'Make a significant impact in your area', 'trophy', 'Community', 500);

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
ON CONFLICT ON CONSTRAINT user_profiles_pkey DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create email status enum
CREATE TYPE email_status AS ENUM ('pending', 'verified');

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile for new user immediately
    INSERT INTO user_profiles (
        id,
        username,
        email_status,
        avatar_url,
        rank,
        trainer_level,
        civic_coins,
        trust_score
    ) VALUES (
        NEW.id,
        COALESCE(
            (NEW.raw_user_meta_data->>'username')::text,
            SPLIT_PART(NEW.email, '@', 1)
        ),
        CASE 
            WHEN NEW.email_confirmed_at IS NOT NULL THEN 'verified'::email_status 
            ELSE 'pending'::email_status 
        END,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || NEW.id,
        'Novice Trainer',
        1,
        50, -- Give initial coins regardless of verification
        0
    );

    -- Record the initial coin transaction
    INSERT INTO point_transactions (
        user_id,
        amount,
        type
    ) VALUES (
        NEW.id,
        50,
        'welcome_bonus'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Modify the email verification handler to just update status
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user profile when email is verified
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE user_profiles
        SET 
            email_status = 'verified',
            email_verified_at = NEW.email_confirmed_at,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Additional verification bonus
        INSERT INTO point_transactions (
            user_id,
            amount,
            type
        ) VALUES (
            NEW.id,
            25, -- Bonus for email verification
            'email_verification_bonus'
        );
        
        -- Update user's civic coins
        UPDATE user_profiles
        SET civic_coins = civic_coins + 25
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the policies to allow access regardless of email verification
DROP POLICY IF EXISTS "Users can update their own profile after email verification" ON user_profiles;
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create triggers for user management
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_email_verified ON auth.users;
CREATE TRIGGER on_auth_user_email_verified
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_email_verification();

-- Add policies for email verification
CREATE POLICY "Users can view their own email status"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Create function to get nearby lost items
CREATE OR REPLACE FUNCTION get_nearby_lost_items(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    location GEOGRAPHY,
    user_id UUID,
    venue_id UUID,
    status TEXT,
    photos TEXT[],
    item_type TEXT,
    contact_info JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION,
    venue_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.*,
        ST_Distance(l.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_meters,
        v.name as venue_name
    FROM lost_items l
    LEFT JOIN venues v ON l.venue_id = v.id
    WHERE 
        l.status = 'lost'
        AND ST_DWithin(
            l.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get nearby found items
CREATE OR REPLACE FUNCTION get_nearby_found_items(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    location GEOGRAPHY,
    user_id UUID,
    venue_id UUID,
    status TEXT,
    photos TEXT[],
    item_type TEXT,
    contact_info JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION,
    venue_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.*,
        ST_Distance(l.location, ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) as distance_meters,
        v.name as venue_name
    FROM lost_items l
    LEFT JOIN venues v ON l.venue_id = v.id
    WHERE 
        l.status = 'found'
        AND ST_DWithin(
            l.location,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
            radius_meters
        )
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_nearby_lost_items(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_found_items(double precision, double precision, integer) TO authenticated;