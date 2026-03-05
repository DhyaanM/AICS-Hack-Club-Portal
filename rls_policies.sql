-- ════════════════════════════════════════════════════════════════════════════
-- AICS Hack Club – Row Level Security (RLS) Policies
-- Run this ONCE in the Supabase SQL Editor.
-- This is the REAL lock on the data – frontend checks can be bypassed,
-- these database policies cannot.
-- ════════════════════════════════════════════════════════════════════════════

-- Helper function: returns true if the calling auth user is a leader
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE (auth.email())
      AND role = 'leader'
  );
$$;

-- ─── meetings ────────────────────────────────────────────────────────────────
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read meetings
DROP POLICY IF EXISTS "meetings_select" ON public.meetings;
CREATE POLICY "meetings_select" ON public.meetings
  FOR SELECT TO authenticated USING (true);

-- Only leaders can insert / update / delete meetings
DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
CREATE POLICY "meetings_insert" ON public.meetings
  FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "meetings_update" ON public.meetings;
CREATE POLICY "meetings_update" ON public.meetings
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "meetings_delete" ON public.meetings;
CREATE POLICY "meetings_delete" ON public.meetings
  FOR DELETE TO authenticated USING (public.is_leader());

-- ─── attendance ──────────────────────────────────────────────────────────────
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read attendance
DROP POLICY IF EXISTS "attendance_select" ON public.attendance;
CREATE POLICY "attendance_select" ON public.attendance
  FOR SELECT TO authenticated USING (true);

-- Only leaders can write attendance
DROP POLICY IF EXISTS "attendance_insert" ON public.attendance;
CREATE POLICY "attendance_insert" ON public.attendance
  FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "attendance_update" ON public.attendance;
CREATE POLICY "attendance_update" ON public.attendance
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "attendance_delete" ON public.attendance;
CREATE POLICY "attendance_delete" ON public.attendance
  FOR DELETE TO authenticated USING (public.is_leader());

-- ─── club_users ──────────────────────────────────────────────────────────────
ALTER TABLE public.club_users ENABLE ROW LEVEL SECURITY;

-- Anyone logged in can read users
DROP POLICY IF EXISTS "club_users_select" ON public.club_users;
CREATE POLICY "club_users_select" ON public.club_users
  FOR SELECT TO authenticated USING (true);

-- Only leaders can insert / delete members
DROP POLICY IF EXISTS "club_users_insert" ON public.club_users;
CREATE POLICY "club_users_insert" ON public.club_users
  FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "club_users_delete" ON public.club_users;
CREATE POLICY "club_users_delete" ON public.club_users
  FOR DELETE TO authenticated USING (public.is_leader());

-- Only leaders can update other members; a member can update their own name/title
DROP POLICY IF EXISTS "club_users_update" ON public.club_users;
CREATE POLICY "club_users_update" ON public.club_users
  FOR UPDATE TO authenticated
  USING (
    public.is_leader()
    OR email ILIKE auth.email()
  );

-- ─── leave_requests ──────────────────────────────────────────────────────────
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Members can read all leave requests (leaders need to see them too)
DROP POLICY IF EXISTS "leave_select" ON public.leave_requests;
CREATE POLICY "leave_select" ON public.leave_requests
  FOR SELECT TO authenticated USING (true);

-- Any authenticated user can submit a leave request
DROP POLICY IF EXISTS "leave_insert" ON public.leave_requests;
CREATE POLICY "leave_insert" ON public.leave_requests
  FOR INSERT TO authenticated WITH CHECK (true);

-- Only leaders can update (approve/deny)
DROP POLICY IF EXISTS "leave_update" ON public.leave_requests;
CREATE POLICY "leave_update" ON public.leave_requests
  FOR UPDATE TO authenticated USING (public.is_leader());

-- ─── projects ────────────────────────────────────────────────────────────────
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select" ON public.projects;
CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated USING (true);

-- Any member can create a project proposal
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (true);

-- Members can update their own projects; leaders can update any
DROP POLICY IF EXISTS "projects_update" ON public.projects;
CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.is_leader()
    OR EXISTS (
      SELECT 1 FROM public.club_users
      WHERE email ILIKE auth.email()
        AND id::text = ANY(member_ids)
    )
  );

DROP POLICY IF EXISTS "projects_delete" ON public.projects;
CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated USING (public.is_leader());

-- ─── problem_reports ─────────────────────────────────────────────────────────
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_select" ON public.problem_reports;
CREATE POLICY "reports_select" ON public.problem_reports
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "reports_insert" ON public.problem_reports;
CREATE POLICY "reports_insert" ON public.problem_reports
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reports_update" ON public.problem_reports;
CREATE POLICY "reports_update" ON public.problem_reports
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "reports_delete" ON public.problem_reports;
CREATE POLICY "reports_delete" ON public.problem_reports
  FOR DELETE TO authenticated USING (public.is_leader());

-- ─── Verify ──────────────────────────────────────────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('meetings', 'attendance', 'club_users', 'leave_requests', 'projects', 'problem_reports');
