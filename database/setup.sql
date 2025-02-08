-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    trainer_level INTEGER DEFAULT 1,
    civic_coins INTEGER DEFAULT 0,
    trust_score INTEGER DEFAULT 0,
    rank TEXT DEFAULT 'Novice Trainer',
    badges JSONB[] DEFAULT ARRAY[]::JSONB[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id OR auth.jwt()->>'role' = 'admin');

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON TABLE user_profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Create issues table if it doesn't exist
CREATE TABLE IF NOT EXISTS issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326),
    status TEXT DEFAULT 'pending',
    reporter_id UUID REFERENCES auth.users,
    photos TEXT[],
    category TEXT,
    verification_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create achievements table if it doesn't exist
CREATE TABLE IF NOT EXISTS achievements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    type TEXT NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create quests table if it doesn't exist
CREATE TABLE IF NOT EXISTS quests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users,
    title TEXT NOT NULL,
    description TEXT,
    reward_coins INTEGER NOT NULL,
    required_actions JSONB NOT NULL,
    deadline TIMESTAMPTZ,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on other tables
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies for other tables
CREATE POLICY "Users can read all issues"
    ON issues FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create issues"
    ON issues FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read own achievements"
    ON achievements FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can read own quests"
    ON quests FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON TABLE issues TO authenticated;
GRANT ALL ON TABLE achievements TO authenticated;
GRANT ALL ON TABLE quests TO authenticated; 