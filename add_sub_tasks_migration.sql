-- Add sub_tasks table
-- Run this in your Supabase SQL Editor

-- Create sub_tasks table
CREATE TABLE IF NOT EXISTS sub_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  due_date DATE,
  completion_date DATE,
  points INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sub_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sub_tasks
-- Users can view sub-tasks for their own tasks
CREATE POLICY "Users can view sub-tasks for their own tasks"
  ON sub_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = sub_tasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can insert sub-tasks for their own tasks
CREATE POLICY "Users can insert sub-tasks for their own tasks"
  ON sub_tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = sub_tasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can update sub-tasks for their own tasks
CREATE POLICY "Users can update sub-tasks for their own tasks"
  ON sub_tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = sub_tasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Users can delete sub-tasks for their own tasks
CREATE POLICY "Users can delete sub-tasks for their own tasks"
  ON sub_tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = sub_tasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_tasks_task_id ON sub_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_sub_tasks_sort_order ON sub_tasks(sort_order);

