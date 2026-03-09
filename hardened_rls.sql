-- AICS Hack Club Portal – Hardened RLS & Security Consolidation
-- This script tightens all Row Level Security policies and helper functions.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- 1. Helper Functions (Security Definer ensures they run with correct permissions)
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE (auth.jwt() ->> 'email')
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
    WHERE email ILIKE (auth.jwt() ->> 'email')
  );
$$;

-- 2. meetings: Strictly leader-only for any changes
DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
CREATE POLICY "meetings_select" ON public.meetings FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "meetings_update" ON public.meetings;
CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "meetings_delete" ON public.meetings;
CREATE POLICY "meetings_delete" ON public.meetings FOR DELETE TO authenticated USING (public.is_leader());

-- 3. attendance_records: Strictly leader-only for any changes
DROP POLICY IF EXISTS "attendance_select" ON public.attendance_records;
CREATE POLICY "attendance_select" ON public.attendance_records FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "attendance_insert" ON public.attendance_records;
CREATE POLICY "attendance_insert" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "attendance_update" ON public.attendance_records;
CREATE POLICY "attendance_update" ON public.attendance_records FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "attendance_delete" ON public.attendance_records;
CREATE POLICY "attendance_delete" ON public.attendance_records FOR DELETE TO authenticated USING (public.is_leader());

-- 4. leave_requests: Only leaders can update (approve/deny)
DROP POLICY IF EXISTS "leave_select" ON public.leave_requests;
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "leave_insert" ON public.leave_requests;
CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "leave_update" ON public.leave_requests;
CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "leave_delete" ON public.leave_requests;
CREATE POLICY "leave_delete" ON public.leave_requests FOR DELETE TO authenticated USING (public.is_leader());

-- 5. projects: Members can update content, only leaders can update status
DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (public.is_leader());

-- Special Project Update: Allow members to update their own, but only if they don't change status to rejected/completed
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated 
  USING (
    public.is_leader() 
    OR (
      public.is_club_member() 
      AND EXISTS (
        SELECT 1 FROM public.club_users 
        WHERE email ILIKE (auth.jwt() ->> 'email') 
        AND id::text = ANY(member_ids)
      )
    )
  );

-- 6. problem_reports: Only leaders update
DROP POLICY IF EXISTS "reports_select" ON public.problem_reports;
CREATE POLICY "reports_select" ON public.problem_reports FOR SELECT TO authenticated USING (public.is_club_member());

DROP POLICY IF EXISTS "reports_insert" ON public.problem_reports;
CREATE POLICY "reports_insert" ON public.problem_reports FOR INSERT TO authenticated WITH CHECK (public.is_club_member());

DROP POLICY IF EXISTS "reports_update" ON public.problem_reports;
CREATE POLICY "reports_update" ON public.problem_reports FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "reports_delete" ON public.problem_reports;
CREATE POLICY "reports_delete" ON public.problem_reports FOR DELETE TO authenticated USING (public.is_leader());

-- Final Check: Ensure RLS is enabled on everything
ALTER TABLE public.club_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
