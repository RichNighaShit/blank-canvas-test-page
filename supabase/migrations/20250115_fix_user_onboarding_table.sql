-- Enhanced user_onboarding table migration with proper error handling
-- This migration ensures the table exists and has all necessary columns

-- Drop existing policies and table if they exist (for clean migration)
DROP POLICY IF EXISTS "Users can view their own onboarding data" ON user_onboarding;
DROP POLICY IF EXISTS "Users can insert their own onboarding data" ON user_onboarding;
DROP POLICY IF EXISTS "Users can update their own onboarding data" ON user_onboarding;
DROP TRIGGER IF EXISTS update_user_onboarding_updated_at ON user_onboarding;
DROP TABLE IF EXISTS user_onboarding CASCADE;

-- Create comprehensive user_onboarding table
CREATE TABLE user_onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_flows TEXT[] DEFAULT ARRAY[]::TEXT[],
  current_step TEXT,
  terms_accepted BOOLEAN DEFAULT FALSE,
  privacy_accepted BOOLEAN DEFAULT FALSE,
  age_confirmed BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  tutorial_skipped BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one record per user
  CONSTRAINT user_onboarding_user_id_unique UNIQUE (user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create comprehensive policies for user_onboarding
CREATE POLICY "Users can view their own onboarding data" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding data" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding data" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding data" ON user_onboarding
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_terms ON user_onboarding(terms_accepted);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create trigger to update updated_at column
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default records for existing users (if any)
INSERT INTO user_onboarding (user_id, completed_flows, onboarding_completed)
SELECT 
  id as user_id,
  ARRAY[]::TEXT[] as completed_flows,
  FALSE as onboarding_completed
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_onboarding)
ON CONFLICT (user_id) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_onboarding TO authenticated;
GRANT USAGE ON SEQUENCE user_onboarding_id_seq TO authenticated;

COMMENT ON TABLE user_onboarding IS 'Tracks user onboarding progress, terms acceptance, and tutorial completion';
COMMENT ON COLUMN user_onboarding.completed_flows IS 'Array of completed onboarding flow IDs';
COMMENT ON COLUMN user_onboarding.terms_accepted IS 'Whether user has accepted terms of service';
COMMENT ON COLUMN user_onboarding.privacy_accepted IS 'Whether user has accepted privacy policy';
COMMENT ON COLUMN user_onboarding.age_confirmed IS 'Whether user has confirmed they meet age requirements';
COMMENT ON COLUMN user_onboarding.onboarding_completed IS 'Whether user has completed the full onboarding process';
COMMENT ON COLUMN user_onboarding.tutorial_skipped IS 'Whether user chose to skip the tutorial';
