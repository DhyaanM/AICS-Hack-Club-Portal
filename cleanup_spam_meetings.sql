-- AICS Hack Club Portal – Final Spam Meetings Cleanup
-- RUN IN SUPABASE SQL EDITOR

-- 1. Wipe all attendance (resets everyone to N/A, prevents Foreign Key errors)
DELETE FROM attendance;

-- 2. Delete all meetings that are NOT in the official schedule
DELETE FROM meetings
WHERE id NOT IN (
  'm9', 'm16', 'm23', 'm30',
  'm406', 'm413', 'm420', 'm427',
  'm504', 'm511', 'm518', 'm525',
  'm601', 'm608', 'm615', 'm622'
);

-- 3. Remove the banned user from club_users (if re-added)
DELETE FROM club_users WHERE email ILIKE 'akki17122009@gmail.com';

-- 4. Verify we are back to 16 meetings
SELECT COUNT(*) AS meetings_remaining FROM meetings;
