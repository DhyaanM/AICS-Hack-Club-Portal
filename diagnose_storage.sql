-- ============================================================
-- AICS Hack Club Portal – Detailed Storage Diagnosis
-- ============================================================
-- Run this in the Supabase SQL Editor to find the 55GB bloat.
-- ============================================================

-- 1. Check Database Table Sizes (Top 10 largest tables)
-- This shows which tables are taking up scientific amounts of space.
SELECT
    relname AS table_name,
    pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
    pg_size_pretty(pg_relation_size(relid)) AS data_size,
    pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) AS index_size,
    n_live_tup AS estimate_row_count
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- 2. Check Storage Bucket Usage
-- This shows how many files are in each bucket.
SELECT 
    bucket_id, 
    COUNT(*) AS file_count, 
    pg_size_pretty(SUM(COALESCE((metadata->>'size')::bigint, 0))) AS total_file_size
FROM storage.objects
GROUP BY bucket_id;

-- 3. Check for specific "Ghost" files in avatars
-- If there are millions of files with weird names, we'll see them here.
SELECT name, created_at, (metadata->>'size')::bigint as size
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 100;

-- 4. Check Authentication Bloat
-- Sometimes bot attacks fill up auth.users or auth.identities
SELECT COUNT(*) as total_auth_users FROM auth.users;
