-- Add recurring task fields to tasks table
-- Run this in your Supabase SQL Editor

-- Add is_recurring boolean column (defaults to false)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false;

-- Add recurring_frequency text column (nullable, stores frequency as string or JSON)
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS recurring_frequency TEXT;

-- Optional: Add a comment to document the recurring_frequency format
COMMENT ON COLUMN tasks.recurring_frequency IS 
  'Stores frequency as simple string (daily, weekly, monthly, yearly) or JSON string for custom intervals (e.g., {"interval": 2, "unit": "weeks"})';












