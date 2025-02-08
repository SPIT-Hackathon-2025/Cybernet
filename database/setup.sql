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
DROP FUNCTION IF EXISTS get_nearby_verified_venues CASCADE;
DROP FUNCTION IF EXISTS get_nearby_lost_items CASCADE;
DROP FUNCTION IF EXISTS get_nearby_found_items CASCADE;

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

-- Drop and recreate the issues table with proper PostGIS support
DROP TABLE IF EXISTS issues CASCADE;

CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    location geometry(Point, 4326) NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    photos TEXT[],
    verification_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT status_check CHECK (status IN ('open', 'in_progress', 'resolved'))
);

-- Create spatial index for better query performance
CREATE INDEX issues_location_idx ON issues USING GIST (location);

-- Enable RLS
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all issues"
    ON issues FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create issues"
    ON issues FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own issues"
    ON issues FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create or replace the function to get issues in bounds
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
        location,
        ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the trigger for updated_at
DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

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
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
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
CREATE INDEX venues_coords_idx ON venues(latitude, longitude);
CREATE INDEX lost_items_coords_idx ON lost_items(latitude, longitude);
CREATE INDEX lost_items_status_idx ON lost_items(status);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
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
    radius_meters integer DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    verified BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.*,
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(v.latitude)) *
                cos(radians(v.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(v.latitude))
            )
        )::DOUBLE PRECISION as distance_meters
    FROM venues v
    WHERE 
        v.verified = true
        AND (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(v.latitude)) *
                cos(radians(v.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(v.latitude))
            )
        ) <= radius_meters
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_nearby_verified_venues(double precision, double precision, integer) TO authenticated;

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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
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
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(l.latitude))
            )
        )::DOUBLE PRECISION as distance_meters,
        v.name as venue_name
    FROM lost_items l
    LEFT JOIN venues v ON l.venue_id = v.id
    WHERE 
        l.status = 'lost'
        AND (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(l.latitude))
            )
        ) <= radius_meters
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
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
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
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(l.latitude))
            )
        )::DOUBLE PRECISION as distance_meters,
        v.name as venue_name
    FROM lost_items l
    LEFT JOIN venues v ON l.venue_id = v.id
    WHERE 
        l.status = 'found'
        AND (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(l.latitude)) *
                cos(radians(l.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(l.latitude))
            )
        ) <= radius_meters
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_nearby_lost_items(double precision, double precision, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_found_items(double precision, double precision, integer) TO authenticated;

-- Add new tables for core features
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active',
    privacy TEXT NOT NULL DEFAULT 'public',
    total_distance INTEGER,
    estimated_time INTEGER,
    difficulty TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE waypoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    sequence_number INTEGER NOT NULL,
    poi_type TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE route_participants (
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (route_id, user_id)
);

CREATE TABLE civic_gyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    points INTEGER NOT NULL DEFAULT 0,
    owner_id UUID REFERENCES user_profiles(id),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pokestops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE issue_nests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    category_id UUID REFERENCES categories(id),
    severity TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'proposed',
    upvotes INTEGER NOT NULL DEFAULT 0,
    photos TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modify existing venues table
DROP TABLE IF EXISTS venues CASCADE;
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    type TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    photos TEXT[],
    operating_hours JSONB,
    contact_info JSONB,
    amenities TEXT[],
    rating DECIMAL(3,2),
    review_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Modify existing lost_items table
DROP TABLE IF EXISTS lost_items CASCADE;
CREATE TABLE lost_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues(id),
    status TEXT NOT NULL DEFAULT 'lost',
    reward_coins INTEGER,
    item_type TEXT NOT NULL,
    category TEXT NOT NULL,
    photos TEXT[],
    contact_info JSONB NOT NULL,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for spatial queries
CREATE INDEX venues_location_idx ON venues USING btree (latitude, longitude);
CREATE INDEX lost_items_location_idx ON lost_items USING btree (latitude, longitude);
CREATE INDEX civic_gyms_location_idx ON civic_gyms USING btree (latitude, longitude);
CREATE INDEX pokestops_location_idx ON pokestops USING btree (latitude, longitude);
CREATE INDEX issue_nests_location_idx ON issue_nests USING btree (latitude, longitude);

-- Create function for nearby venues
CREATE OR REPLACE FUNCTION get_nearby_points_of_interest(
    lat double precision,
    lng double precision,
    radius_meters integer DEFAULT 1000
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    type TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        'venue'::TEXT as type,
        v.latitude,
        v.longitude,
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(v.latitude)) *
                cos(radians(v.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(v.latitude))
            )
        )::DOUBLE PRECISION as distance_meters
    FROM venues v
    WHERE (
        6371000 * acos(
            cos(radians(lat)) * cos(radians(v.latitude)) *
            cos(radians(v.longitude) - radians(lng)) +
            sin(radians(lat)) * sin(radians(v.latitude))
        ) <= radius_meters
    
    UNION ALL
    
    SELECT 
        g.id,
        g.name,
        'gym'::TEXT as type,
        g.latitude,
        g.longitude,
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(g.latitude)) *
                cos(radians(g.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(g.latitude))
            )
        )::DOUBLE PRECISION as distance_meters
    FROM civic_gyms g
    WHERE (
        6371000 * acos(
            cos(radians(lat)) * cos(radians(g.latitude)) *
            cos(radians(g.longitude) - radians(lng)) +
            sin(radians(lat)) * sin(radians(g.latitude))
        ) <= radius_meters
    
    UNION ALL
    
    SELECT 
        p.id,
        p.name,
        'pokestop'::TEXT as type,
        p.latitude,
        p.longitude,
        (
            6371000 * acos(
                cos(radians(lat)) * cos(radians(p.latitude)) *
                cos(radians(p.longitude) - radians(lng)) +
                sin(radians(lat)) * sin(radians(p.latitude))
            )
        )::DOUBLE PRECISION as distance_meters
    FROM pokestops p
    WHERE (
        6371000 * acos(
            cos(radians(lat)) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(lng)) +
            sin(radians(lat)) * sin(radians(p.latitude))
        ) <= radius_meters
    
    ORDER BY distance_meters;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default categories
INSERT INTO categories (name, description, icon) VALUES
    ('Infrastructure', 'Road, building, and utility issues', 'construct'),
    ('Environment', 'Environmental and cleanliness issues', 'leaf'),
    ('Safety', 'Public safety and security concerns', 'shield'),
    ('Community', 'Social and community-related matters', 'people'),
    ('Transportation', 'Public transport and traffic issues', 'bus'),
    ('Health', 'Public health and sanitation issues', 'medkit'),
    ('Education', 'Educational facility issues', 'school'),
    ('Recreation', 'Parks and recreation facility issues', 'football');

-- Function to generate daily quests for a user
CREATE OR REPLACE FUNCTION generate_daily_quests(user_id_param UUID)
RETURNS SETOF quests AS $$
DECLARE
    quest_record quests%ROWTYPE;
    quest_count INTEGER;
    quest_types TEXT[] := ARRAY['verify_issues', 'report_issues', 'help_found_items', 'visit_locations'];
    difficulties INTEGER[] := ARRAY[1, 2, 3];
    selected_type TEXT;
    selected_difficulty INTEGER;
BEGIN
    -- First, expire old active quests
    UPDATE quests
    SET status = 'expired'
    WHERE user_id = user_id_param
    AND status = 'active'
    AND expires_at < NOW();

    -- Check if user already has active quests
    SELECT COUNT(*)
    INTO quest_count
    FROM quests
    WHERE user_id = user_id_param
    AND status = 'active';

    -- If user has no active quests, generate new ones
    IF quest_count = 0 THEN
        -- Always create a daily login quest
        INSERT INTO quests (
            user_id,
            title,
            description,
            reward_amount,
            progress,
            required,
            expires_at,
            status,
            type
        ) VALUES (
            user_id_param,
            'Daily Check-in',
            'Log in to the app today',
            50,
            0,
            1,
            (DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second')::TIMESTAMP,
            'active',
            'daily_login'
        ) RETURNING * INTO quest_record;
        
        RETURN NEXT quest_record;

        -- Generate 2 random quests
        FOR i IN 1..2 LOOP
            -- Select a random quest type and difficulty
            selected_type := quest_types[1 + floor(random() * array_length(quest_types, 1))::INTEGER];
            selected_difficulty := difficulties[1 + floor(random() * array_length(difficulties, 1))::INTEGER];

            INSERT INTO quests (
                user_id,
                title,
                description,
                reward_amount,
                progress,
                required,
                expires_at,
                status,
                type
            )
            SELECT
                user_id_param,
                CASE selected_type
                    WHEN 'verify_issues' THEN 'Verify Community Issues'
                    WHEN 'report_issues' THEN 'Report Community Issues'
                    WHEN 'help_found_items' THEN 'Help Find Lost Items'
                    WHEN 'visit_locations' THEN 'Visit New Locations'
                END,
                CASE selected_type
                    WHEN 'verify_issues' THEN 'Verify ' || (selected_difficulty * 2)::TEXT || ' reported issues in your area'
                    WHEN 'report_issues' THEN 'Report ' || selected_difficulty::TEXT || ' new community issues'
                    WHEN 'help_found_items' THEN 'Help locate ' || selected_difficulty::TEXT || ' lost items'
                    WHEN 'visit_locations' THEN 'Visit ' || (selected_difficulty * 3)::TEXT || ' new locations'
                END,
                CASE selected_difficulty
                    WHEN 1 THEN 100
                    WHEN 2 THEN 200
                    WHEN 3 THEN 300
                END,
                0,
                CASE selected_type
                    WHEN 'verify_issues' THEN selected_difficulty * 2
                    WHEN 'report_issues' THEN selected_difficulty
                    WHEN 'help_found_items' THEN selected_difficulty
                    WHEN 'visit_locations' THEN selected_difficulty * 3
                END,
                (DATE_TRUNC('day', NOW()) + INTERVAL '1 day' - INTERVAL '1 second')::TIMESTAMP,
                'active',
                selected_type
            ) RETURNING * INTO quest_record;

            RETURN NEXT quest_record;
        END LOOP;
    ELSE
        -- Return existing active quests
        RETURN QUERY
        SELECT *
        FROM quests
        WHERE user_id = user_id_param
        AND status = 'active'
        ORDER BY created_at DESC;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update quest progress
CREATE OR REPLACE FUNCTION update_quest_progress(
    quest_id_param UUID,
    progress_increment INTEGER DEFAULT 1
)
RETURNS quests AS $$
DECLARE
    updated_quest quests;
    reward INTEGER;
BEGIN
    -- Update the quest progress
    UPDATE quests
    SET 
        progress = LEAST(progress + progress_increment, required),
        status = CASE 
            WHEN progress + progress_increment >= required THEN 'completed'
            ELSE status
        END,
        updated_at = NOW()
    WHERE id = quest_id_param
    RETURNING * INTO updated_quest;

    -- If quest was just completed, award the coins
    IF updated_quest.status = 'completed' AND updated_quest.progress >= updated_quest.required THEN
        -- Add coin transaction
        INSERT INTO point_transactions (
            user_id,
            amount,
            type
        ) VALUES (
            updated_quest.user_id,
            updated_quest.reward_amount,
            'quest_completion'
        );

        -- Update user's coin balance
        UPDATE user_profiles
        SET 
            civic_coins = civic_coins + updated_quest.reward_amount,
            updated_at = NOW()
        WHERE id = updated_quest.user_id;
    END IF;

    RETURN updated_quest;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_daily_quests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_quest_progress(UUID, INTEGER) TO authenticated;

-- Enable RLS on point_transactions
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for point_transactions
CREATE POLICY "Users can view their own transactions"
    ON point_transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all transactions"
    ON point_transactions
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Authenticated users can create transactions"
    ON point_transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Drop any existing create_issue functions
DROP FUNCTION IF EXISTS create_issue(text, text, text, double precision, double precision, text[], uuid, text);
DROP FUNCTION IF EXISTS create_issue(text, text, text, jsonb, text[], uuid, text);

-- Create a single, well-defined create_issue function
CREATE OR REPLACE FUNCTION create_issue(
    p_title TEXT,
    p_description TEXT,
    p_category TEXT,
    p_longitude DOUBLE PRECISION,
    p_latitude DOUBLE PRECISION,
    p_photos TEXT[],
    p_user_id UUID,
    p_status TEXT DEFAULT 'open'
)
RETURNS issues AS $$
DECLARE
    v_issue issues;
BEGIN
    -- Insert the issue with proper geometry conversion
    INSERT INTO issues (
        title,
        description,
        category,
        location,
        photos,
        user_id,
        status
    ) VALUES (
        p_title,
        p_description,
        p_category,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326),
        p_photos,
        p_user_id,
        p_status
    )
    RETURNING * INTO v_issue;

    -- Award points for creating an issue in a separate transaction
    BEGIN
        INSERT INTO point_transactions (
            user_id,
            amount,
            type
        ) VALUES (
            p_user_id,
            50,
            'issue_report'
        );

        -- Update user's civic coins
        UPDATE user_profiles
        SET civic_coins = civic_coins + 50
        WHERE id = p_user_id;
    EXCEPTION WHEN OTHERS THEN
        -- Log the error but don't fail the issue creation
        RAISE NOTICE 'Failed to award points: %', SQLERRM;
    END;

    RETURN v_issue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_issue(TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT[], UUID, TEXT) TO authenticated;