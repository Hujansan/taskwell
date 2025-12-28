-- Create habit_groups table
CREATE TABLE IF NOT EXISTS habit_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  group_id UUID REFERENCES habit_groups(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create habit_completions table
CREATE TABLE IF NOT EXISTS habit_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date, user_id)
);

-- Create calibrations table
CREATE TABLE IF NOT EXISTS calibrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calibration_scores table
CREATE TABLE IF NOT EXISTS calibration_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calibration_id UUID NOT NULL REFERENCES calibrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calibration_id, date, user_id)
);

-- Enable Row Level Security
ALTER TABLE habit_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for habit_groups
CREATE POLICY "Users can view their own habit groups"
  ON habit_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit groups"
  ON habit_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit groups"
  ON habit_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit groups"
  ON habit_groups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for habits
CREATE POLICY "Users can view their own habits"
  ON habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habits"
  ON habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habits"
  ON habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habits"
  ON habits FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for habit_completions
CREATE POLICY "Users can view their own habit completions"
  ON habit_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own habit completions"
  ON habit_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own habit completions"
  ON habit_completions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own habit completions"
  ON habit_completions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for calibrations
CREATE POLICY "Users can view their own calibrations"
  ON calibrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calibrations"
  ON calibrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calibrations"
  ON calibrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calibrations"
  ON calibrations FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for calibration_scores
CREATE POLICY "Users can view their own calibration scores"
  ON calibration_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own calibration scores"
  ON calibration_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calibration scores"
  ON calibration_scores FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calibration scores"
  ON calibration_scores FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_group_id ON habits(group_id);
CREATE INDEX IF NOT EXISTS idx_habits_sort_order ON habits(sort_order);
CREATE INDEX IF NOT EXISTS idx_habit_groups_user_id ON habit_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_groups_sort_order ON habit_groups(sort_order);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_user_id ON calibrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calibrations_sort_order ON calibrations(sort_order);
CREATE INDEX IF NOT EXISTS idx_calibration_scores_user_date ON calibration_scores(user_id, date);
CREATE INDEX IF NOT EXISTS idx_calibration_scores_calibration_id ON calibration_scores(calibration_id);






