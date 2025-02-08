-- Create user_profiles table if it doesn't exist
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

-- Create function to create new profile
CREATE OR REPLACE FUNCTION create_new_profile(
    p_user_id UUID,
    p_username TEXT
)
RETURNS user_profiles AS $$
BEGIN
    INSERT INTO user_profiles (
        id,
        username,
        avatar_url,
        trainer_level,
        civic_coins,
        trust_score,
        rank,
        badges
    ) VALUES (
        p_user_id,
        p_username,
        'https://api.dicebear.com/7.x/avataaars/svg?seed=' || p_username,
        1,
        0,
        0,
        'Novice Trainer',
        ARRAY[]::JSONB[]
    )
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user profile
CREATE OR REPLACE FUNCTION update_user_profile(
    p_user_id UUID,
    p_updates JSONB
)
RETURNS user_profiles AS $$
BEGIN
    UPDATE user_profiles
    SET
        username = COALESCE((p_updates->>'username')::TEXT, username),
        avatar_url = COALESCE((p_updates->>'avatar_url')::TEXT, avatar_url),
        trainer_level = COALESCE((p_updates->>'trainer_level')::INTEGER, trainer_level),
        civic_coins = COALESCE((p_updates->>'civic_coins')::INTEGER, civic_coins),
        trust_score = COALESCE((p_updates->>'trust_score')::INTEGER, trust_score),
        rank = COALESCE((p_updates->>'rank')::TEXT, rank),
        updated_at = NOW()
    WHERE id = p_user_id
    RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 