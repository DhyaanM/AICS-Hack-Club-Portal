-- AICS Hack Club Portal – Diagnostic & Investigation Script
-- Run this in Supabase SQL Editor to see what happened.

-- 1. Check for any unauthorized leader accounts
SELECT id, email, role, join_date
FROM club_users
WHERE role = 'leader';

-- 2. Check if there are ANY projects left
SELECT COUNT(*) AS total_projects FROM projects;
