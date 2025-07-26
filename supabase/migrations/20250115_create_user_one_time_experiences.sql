-- Create table to track one-time user experiences
-- This ensures users only see certain UI elements once per lifetime

CREATE TABLE IF NOT EXISTS user_one_time_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  experience_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Ensure one record per user per experience
  CONSTRAINT user_one_time_experiences_unique UNIQUE (user_id, experience_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_one_time_experiences ENABLE ROW LEVEL SECURITY;

-- Create policies for user_one_time_experiences
CREATE POLICY "Users can view their own experiences" ON user_one_time_experiences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own experiences" ON user_one_time_experiences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences" ON user_one_time_experiences
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences" ON user_one_time_experiences
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_one_time_experiences_user_id ON user_one_time_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_one_time_experiences_experience_id ON user_one_time_experiences(experience_id);
CREATE INDEX IF NOT EXISTS idx_user_one_time_experiences_completed_at ON user_one_time_experiences(completed_at);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_one_time_experiences TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE user_one_time_experiences IS 'Tracks one-time user experiences to ensure users only see certain UI elements once per lifetime';
COMMENT ON COLUMN user_one_time_experiences.experience_id IS 'Identifier for the specific experience (e.g., welcome_tutorial, first_upload)';
COMMENT ON COLUMN user_one_time_experiences.completed_at IS 'When the user completed or saw this experience';
COMMENT ON COLUMN user_one_time_experiences.metadata IS 'Additional data about the experience (optional)';
