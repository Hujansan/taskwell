-- Add points column to tasks table
-- Run this in your Supabase SQL Editor

-- Add points integer column with default value of 10
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;

-- Add a comment to document the points field
COMMENT ON COLUMN tasks.points IS 
  'Points awarded when this task is completed. Default is 10. Daily points are the sum of points for all tasks completed on a given date.';

