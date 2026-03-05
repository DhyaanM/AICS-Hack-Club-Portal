-- AICS Hack Club Portal – Complete Secure Schema Initialization
-- Run this in the Supabase SQL Editor to set up your new project correctly and securely.

-- 1. Create Tables
CREATE TABLE public.club_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('leader', 'member')),
  avatar TEXT,
  join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  title TEXT
);

CREATE TABLE public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.club_users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused', 'n/a'))
);

CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.club_users(id) ON DELETE CASCADE,
  meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'in-progress', 'completed', 'rejected')),
  created_by TEXT NOT NULL, -- Storing as TEXT array or UUID, matching previous implementation
  member_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_group BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  type TEXT,
  links TEXT[] DEFAULT ARRAY[]::TEXT[],
  image_url TEXT,
  feedback TEXT,
  leader_comment TEXT,
  progress_notes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.problem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved')),
  leader_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- 2. Security Helpers
-- These use auth.jwt()->>'email' which is the most robust way to verify the user
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
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
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.club_users
    WHERE email ILIKE (auth.jwt() ->> 'email')
  );
$$;


-- 3. Enable Row Level Security
ALTER TABLE public.club_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;


-- 4. Define Strict RLS Policies
-- club_users: everyone in the club can see users, but only leaders can edit
CREATE POLICY "users_select" ON public.club_users FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "users_insert" ON public.club_users FOR INSERT TO authenticated WITH CHECK (public.is_leader());
CREATE POLICY "users_update" ON public.club_users FOR UPDATE TO authenticated USING (public.is_leader());
CREATE POLICY "users_delete" ON public.club_users FOR DELETE TO authenticated USING (public.is_leader());

-- meetings: all members can read, only leaders can modify
CREATE POLICY "meetings_select" ON public.meetings FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT TO authenticated WITH CHECK (public.is_leader());
CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE TO authenticated USING (public.is_leader());
CREATE POLICY "meetings_delete" ON public.meetings FOR DELETE TO authenticated USING (public.is_leader());

-- attendance_records: members can read their own or all (depending on privacy, usually read all is ok), leaders can modify
CREATE POLICY "attendance_select" ON public.attendance_records FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "attendance_insert" ON public.attendance_records FOR INSERT TO authenticated WITH CHECK (public.is_leader());
CREATE POLICY "attendance_update" ON public.attendance_records FOR UPDATE TO authenticated USING (public.is_leader());
CREATE POLICY "attendance_delete" ON public.attendance_records FOR DELETE TO authenticated USING (public.is_leader());

-- leave_requests: members can read all (or their own) and insert, leaders can update (approve/deny)
CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "leave_insert" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "leave_update" ON public.leave_requests FOR UPDATE TO authenticated USING (
  public.is_leader() 
  OR 
  (public.is_club_member() AND user_id::text = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email')))
);
CREATE POLICY "leave_delete" ON public.leave_requests FOR DELETE TO authenticated USING (public.is_leader());

-- projects: members can read all, insert, but only update their own. leaders have full access.
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (
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
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (public.is_leader());

-- problem_reports: members can read all, insert, but only update their own. leaders full access.
CREATE POLICY "reports_select" ON public.problem_reports FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "reports_insert" ON public.problem_reports FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "reports_update" ON public.problem_reports FOR UPDATE TO authenticated USING (public.is_leader());
CREATE POLICY "reports_delete" ON public.problem_reports FOR DELETE TO authenticated USING (public.is_leader());

-- Verify Policies Done
