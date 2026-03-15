-- Update the March 16, 2026 meeting to "Hack Club Launch" 🎉
-- Run this in the Supabase SQL Editor

UPDATE meetings
SET
  title       = 'Hack Club Launch',
  description = 'The first official AICS Hack Club meeting — launch day!'
WHERE
  date = '2026-03-16';

-- Verify
SELECT id, date, title, description
FROM meetings
WHERE date = '2026-03-16';
