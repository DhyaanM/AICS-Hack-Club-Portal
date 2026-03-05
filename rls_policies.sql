-- AICS Hack Club Portal – Tightened RLS Policies
-- Restricts ALL writes to verified club members only.
-- Run in Supabase SQL Editor AFTER rls_policies.sql

-- Helper: returns true if the calling user exists in club_users
CREATE OR REPLACE FUNCTION public.is_club_member()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE auth.email()
  );
$$;

-- ─── leave_requests: only club members can submit ─────────────────────────────
DROP POLICY IF EXISTS "leave_insert" ON public.leave_requests;
CREATE POLICY "leave_insert" ON public.leave_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_club_member());

-- ─── projects: only club members can submit ───────────────────────────────────
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.is_club_member());

-- Members can only update projects they are part of
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

-- ─── problem_reports: only club members can submit ────────────────────────────
DROP POLICY IF EXISTS "reports_insert" ON public.problem_reports;
CREATE POLICY "reports_insert" ON public.problem_reports
  FOR INSERT TO authenticated
  WITH CHECK (public.is_club_member());

-- ─── Verify final state of all policies ──────────────────────────────────────
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
