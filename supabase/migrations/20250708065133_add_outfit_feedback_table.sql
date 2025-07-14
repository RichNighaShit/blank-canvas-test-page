-- Create outfit_feedback table
CREATE TABLE IF NOT EXISTS outfit_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(user_id) ON DELETE CASCADE,
  outfit_item_ids text[] NOT NULL,
  feedback text CHECK (feedback IN ('like', 'dislike')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for faster lookup by user
CREATE INDEX IF NOT EXISTS idx_outfit_feedback_user_id ON outfit_feedback(user_id);
