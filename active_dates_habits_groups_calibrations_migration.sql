-- Add active date ranges to habits, habit groups, and calibrations
-- This allows adding/removing items without affecting historical scoring.

ALTER TABLE IF EXISTS habit_groups
  ADD COLUMN IF NOT EXISTS active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS active_to DATE;

ALTER TABLE IF EXISTS habits
  ADD COLUMN IF NOT EXISTS active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS active_to DATE;

ALTER TABLE IF EXISTS calibrations
  ADD COLUMN IF NOT EXISTS active_from DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS active_to DATE;

-- Backfill existing rows (keep historical intent as best as possible)
UPDATE habit_groups
SET active_from = COALESCE(active_from, created_at::date, CURRENT_DATE)
WHERE active_from IS NULL;

UPDATE habits
SET active_from = COALESCE(active_from, created_at::date, CURRENT_DATE)
WHERE active_from IS NULL;

UPDATE calibrations
SET active_from = COALESCE(active_from, created_at::date, CURRENT_DATE)
WHERE active_from IS NULL;

-- Basic integrity: end date cannot be before start date
ALTER TABLE IF EXISTS habit_groups
  DROP CONSTRAINT IF EXISTS habit_groups_active_dates_check;
ALTER TABLE IF EXISTS habit_groups
  ADD CONSTRAINT habit_groups_active_dates_check
  CHECK (active_to IS NULL OR active_to >= active_from);

ALTER TABLE IF EXISTS habits
  DROP CONSTRAINT IF EXISTS habits_active_dates_check;
ALTER TABLE IF EXISTS habits
  ADD CONSTRAINT habits_active_dates_check
  CHECK (active_to IS NULL OR active_to >= active_from);

ALTER TABLE IF EXISTS calibrations
  DROP CONSTRAINT IF EXISTS calibrations_active_dates_check;
ALTER TABLE IF EXISTS calibrations
  ADD CONSTRAINT calibrations_active_dates_check
  CHECK (active_to IS NULL OR active_to >= active_from);

-- Helpful indexes for date filtering
CREATE INDEX IF NOT EXISTS idx_habit_groups_user_active_dates ON habit_groups(user_id, active_from, active_to);
CREATE INDEX IF NOT EXISTS idx_habits_user_active_dates ON habits(user_id, active_from, active_to);
CREATE INDEX IF NOT EXISTS idx_calibrations_user_active_dates ON calibrations(user_id, active_from, active_to);

