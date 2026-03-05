-- AICS Hack Club Portal – Final Spam Attendance Cleanup
-- RUN IN SUPABASE SQL EDITOR

-- 1. Wipe all attendance (resets everyone to N/A)
DELETE FROM attendance;

-- 2. Verify it is empty (should return 0)
SELECT COUNT(*) AS remaining_attendance FROM attendance;
