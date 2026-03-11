-- ============================================================
-- AICS Hack Club Portal – Fix Member RLS Save Bug
-- ============================================================
-- The is_club_member() and is_leader() helpers used
-- auth.jwt() ->> 'email' which is NOT always populated.
-- Switching to auth.email() which is a stable Supabase built-in.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1. Fix helper functions
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE auth.email()
      AND role = 'leader'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_club_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE auth.email()
  );
$$;

-- 2. Re-apply leave_requests policies (drop & recreate to be safe)
DROP POLICY IF EXISTS "leave_select" ON public.leave_requests;
CREATE POLICY "leave_select" ON public.leave_requests
  FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "leave_insert" ON public.leave_requests;
CREATE POLICY "leave_insert" ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "leave_update" ON public.leave_requests;
CREATE POLICY "leave_update" ON public.leave_requests
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "leave_delete" ON public.leave_requests;
CREATE POLICY "leave_delete" ON public.leave_requests
  FOR DELETE TO authenticated USING (public.is_leader());

-- 3. Re-apply projects policies
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.is_leader()
    OR (
      public.is_club_member()
      AND EXISTS (
        SELECT 1 FROM public.club_users
        WHERE email ILIKE auth.email()
          AND id::text = ANY(member_ids)
      )
    )
  );

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated USING (public.is_leader());

-- 4. Re-apply problem_reports policies
DROP POLICY IF EXISTS "reports_select" ON public.problem_reports;
CREATE POLICY "reports_select" ON public.problem_reports
  FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "reports_insert" ON public.problem_reports;
CREATE POLICY "reports_insert" ON public.problem_reports
  FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "reports_update" ON public.problem_reports;
CREATE POLICY "reports_update" ON public.problem_reports
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "reports_delete" ON public.problem_reports;
CREATE POLICY "reports_delete" ON public.problem_reports
  FOR DELETE TO authenticated USING (public.is_leader());

-- 5. Verify
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
