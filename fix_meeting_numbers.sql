-- fix_meeting_numbers.sql
-- This script re-numbers all "Weekly Meeting #..." titles chronologically starting from 1.
-- It ensures there is no "Meeting #0" and that the sequence is perfect.

WITH renumbered AS (
  SELECT 
    id,
    'Weekly Meeting #' || ROW_NUMBER() OVER (ORDER BY date ASC) as new_title
  FROM public.meetings
  WHERE title LIKE 'Weekly Meeting #%'
)
UPDATE public.meetings
SET title = renumbered.new_title
FROM renumbered
WHERE public.meetings.id = renumbered.id;
