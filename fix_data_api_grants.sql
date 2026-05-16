-- ============================================================
-- AICS Hack Club Portal – Explicit Data API Grants
-- ============================================================
-- Required by Supabase's new Data API policy:
--   • New projects: enforced from May 30, 2026
--   • Existing projects: enforced from October 30, 2026
--
-- Without these GRANTs, PostgREST / supabase-js will return
-- a "42501" error when accessing these tables.
--
-- RLS policies still apply on top of these grants — they
-- restrict what authenticated users can actually read/write.
--
-- Run this ONCE in the Supabase SQL Editor.
-- ============================================================

-- Core tables (created in secure_database_setup.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.club_users        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.problem_reports   TO authenticated;

-- Feature tables (created in new_tables.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_kudos     TO authenticated;

-- Project invitations table (created in project_security_hardening.sql)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invitations TO authenticated;

-- anon role: read-only access to public-facing data only
-- (club_users excluded intentionally – members shouldn't be visible to anon)
GRANT SELECT ON public.meetings TO anon;

-- Verify: list all grants on public tables
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
