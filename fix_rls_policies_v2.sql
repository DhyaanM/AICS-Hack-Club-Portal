-- Reset and Fix Row Level Security (RLS) Policies
-- This script safely drops existing policies and recreates them

-- 1. Enable RLS on all tables
ALTER TABLE public.club_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies to start fresh
DO $$ 
DECLARE 
    tbl RECORD; 
    pol RECORD; 
BEGIN 
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
    LOOP 
        FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl.tablename 
        LOOP 
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tbl.tablename); 
        END LOOP; 
    END LOOP; 
END $$;

-- 3. Create READ policies (Everyone logged in can see data)
CREATE POLICY "Enable read access for all authenticated users" ON public.club_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.meetings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.leave_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable read access for all authenticated users" ON public.problem_reports FOR SELECT TO authenticated USING (true);

-- 4. Create WRITE/DELETE policies (Only 'leaders' can modify data)
-- We check if the acting user's email exists in club_users with role='leader'
CREATE OR REPLACE FUNCTION public.is_leader()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.club_users 
    WHERE lower(email) = lower((SELECT auth.jwt()->>'email')) 
    AND role = 'leader'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Enable insert/update/delete for leaders" ON public.club_users FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());
CREATE POLICY "Enable insert/update/delete for leaders" ON public.projects FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());
CREATE POLICY "Enable insert/update/delete for leaders" ON public.meetings FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());
CREATE POLICY "Enable insert/update/delete for leaders" ON public.attendance FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());
CREATE POLICY "Enable insert/update/delete for leaders" ON public.leave_requests FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());
CREATE POLICY "Enable insert/update/delete for leaders" ON public.problem_reports FOR ALL TO authenticated USING (public.is_leader()) WITH CHECK (public.is_leader());

-- Special exceptions:
-- Allow members to insert their own leave requests and problem reports
CREATE POLICY "Enable insert for own leave requests" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.club_users WHERE email = (SELECT auth.jwt()->>'email')));
CREATE POLICY "Enable insert for own problem reports" ON public.problem_reports FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT id FROM public.club_users WHERE email = (SELECT auth.jwt()->>'email')));
