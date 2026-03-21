-- Remove the March 9 session and rename March 16 to Hack Club Launch
-- Run this in the Supabase SQL Editor

-- Step 1: Delete the March 9 meeting (and its attendance records first to avoid FK violations)
DELETE FROM attendance_records WHERE meeting_id IN (
  SELECT id FROM meetings WHERE date = '2026-03-09'
);
DELETE FROM meetings WHERE date = '2026-03-09';

-- Step 2: Rename March 16 to the official first meeting
UPDATE meetings
SET
  title       = 'Hack Club Launch',
  description = 'The first official AICS Hack Club meeting — launch day!'
WHERE date = '2026-03-16';

-- Verify
SELECT date, title, description
FROM meetings
ORDER BY date
LIMIT 5;
