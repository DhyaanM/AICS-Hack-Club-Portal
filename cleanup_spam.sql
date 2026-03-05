-- AICS Hack Club Portal – Spam Cleanup Script
-- Run this in the Supabase SQL Editor

-- ─── Step 1: Nuke ALL attendance records ─────────────────────────────────────
-- This resets every member's attendance to N/A across all meetings.
DELETE FROM attendance;

-- ─── Step 2: Delete all meetings that are NOT in the official schedule ────────
-- Keeps only the 16 real weekly meetings; removes every spam meeting.
DELETE FROM meetings
WHERE id NOT IN (
  'm9', 'm16', 'm23', 'm30',
  'm406', 'm413', 'm420', 'm427',
  'm504', 'm511', 'm518', 'm525',
  'm601', 'm608', 'm615', 'm622'
);

-- ─── Step 3: Remove the banned user from club_users (if still present) ────────
DELETE FROM club_users WHERE email ILIKE 'akki17122009@gmail.com';

-- ─── Step 4: Verify ──────────────────────────────────────────────────────────
SELECT 'Meetings remaining:' AS info, COUNT(*) AS count FROM meetings
UNION ALL
SELECT 'Attendance records:' AS info, COUNT(*) AS count FROM attendance
UNION ALL
SELECT 'Banned users removed:' AS info, COUNT(*) AS count FROM club_users WHERE email ILIKE 'akki17122009@gmail.com';
