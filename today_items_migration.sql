-- Create today_items table to track tasks and habits selected for today
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS today_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('task', 'habit')),
  item_id UUID NOT NULL,
  date DATE NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id, date)
);

-- Enable Row Level Security
ALTER TABLE today_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for today_items
CREATE POLICY "Users can view their own today items"
  ON today_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own today items"
  ON today_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own today items"
  ON today_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own today items"
  ON today_items FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_today_items_user_date ON today_items(user_id, date);
CREATE INDEX IF NOT EXISTS idx_today_items_sort_order ON today_items(user_id, date, sort_order);

