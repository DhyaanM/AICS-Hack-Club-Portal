-- AICS Hack Club Portal – TOTAL SECURITY LOCKDOWN
-- This script ensures the portal is 100% secure.
-- It resets all Row Level Security (RLS) to the most restrictive state.
-- RUN THIS IN THE SUPABASE SQL EDITOR.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. CLEANUP & PRIVACY PREP
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove any remaining auto-sync triggers from the bot attack
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Ensure all tables have RLS enabled
ALTER TABLE public.club_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_reports ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SECURITY HELPERS
-- ─────────────────────────────────────────────────────────────────────────────

-- Robust helper to check if a user is a verified club member
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

-- Robust helper to check if a user is a leader
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

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLE POLICIES (AUTHENTICATED CLUB MEMBERS ONLY)
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to drop all policies on a table to ensure a clean slate
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- club_users
CREATE POLICY "Secure Read Users" ON public.club_users FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Leader Manage Users" ON public.club_users FOR ALL TO authenticated USING (public.is_leader());

-- meetings
CREATE POLICY "Secure Read Meetings" ON public.meetings FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Leader Manage Meetings" ON public.meetings FOR ALL TO authenticated USING (public.is_leader());

-- attendance_records
CREATE POLICY "Secure Read Attendance" ON public.attendance_records FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Leader Manage Attendance" ON public.attendance_records FOR ALL TO authenticated USING (public.is_leader());

-- leave_requests
CREATE POLICY "Secure Read Leaves" ON public.leave_requests FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Member Submit Leaves" ON public.leave_requests FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "Leader Manage Leaves" ON public.leave_requests FOR ALL TO authenticated USING (public.is_leader());

-- projects
CREATE POLICY "Secure Read Projects" ON public.projects FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Member Submit Projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "Member Update Own Project" ON public.projects FOR UPDATE TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email') AND id::text = ANY(member_ids)));
CREATE POLICY "Leader Manage Projects" ON public.projects FOR ALL TO authenticated USING (public.is_leader());

-- problem_reports
CREATE POLICY "Secure Read Reports" ON public.problem_reports FOR SELECT TO authenticated USING (public.is_club_member());
CREATE POLICY "Member Submit Reports" ON public.problem_reports FOR INSERT TO authenticated WITH CHECK (public.is_club_member());
CREATE POLICY "Leader Manage Reports" ON public.problem_reports FOR ALL TO authenticated USING (public.is_leader());

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. STORAGE SECURITY (PRIVATE AVATARS)
-- ─────────────────────────────────────────────────────────────────────────────

-- Ensure bucket is private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Drop old storage policies
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Member Read Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Leader Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Leader Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Leader Delete Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Leader Manage Avatars" ON storage.objects;

-- Member-only read access to avatars
CREATE POLICY "Member Read Avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND public.is_club_member());

-- Leader-only management of avatars
CREATE POLICY "Leader Manage Avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars' AND public.is_leader());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. VERIFICATION
-- ─────────────────────────────────────────────────────────────────────────────
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public' OR schemaname = 'storage'
ORDER BY tablename;
