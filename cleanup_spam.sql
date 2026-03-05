-- AICS Hack Club Portal – Full Spam Content Cleanup
-- Deletes all orphaned/spam content left behind by the banned user
-- RUN IN SUPABASE SQL EDITOR

-- ─── 1. Orphaned leave requests ───────────────────────────────────────────────
DELETE FROM leave_requests
WHERE meeting_id NOT IN (SELECT id FROM meetings);

DELETE FROM leave_requests
WHERE user_id::text NOT IN (SELECT id::text FROM club_users);

-- ─── 2. Spam projects ─────────────────────────────────────────────────────────
DELETE FROM projects
WHERE created_by NOT IN (SELECT id::text FROM club_users);

-- ─── 3. Spam problem reports ──────────────────────────────────────────────────
DELETE FROM problem_reports
WHERE user_id::text NOT IN (SELECT id::text FROM club_users);

-- ─── 4. Orphaned attendance ───────────────────────────────────────────────────
DELETE FROM attendance
WHERE meeting_id NOT IN (SELECT id FROM meetings)
   OR user_id::text NOT IN (SELECT id::text FROM club_users);

-- ─── 5. Verify ────────────────────────────────────────────────────────────────
SELECT 'leave_requests' AS table_name, COUNT(*) FROM leave_requests
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'problem_reports', COUNT(*) FROM problem_reports
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance;
