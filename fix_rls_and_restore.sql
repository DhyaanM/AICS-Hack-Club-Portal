-- AICS Hack Club Portal – Fix RLS And Restore Projects
-- RUN IN SUPABASE SQL EDITOR

-- 1. Fix the RLS Helper Functions 
-- (auth.email() can sometimes return null in older Supabase Postgres versions, auth.jwt()->>'email' is universally safer)
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


-- 2. Restore Deleted Projects
-- Restore Daksh's project (submitted Mar 4)
INSERT INTO public.projects (id, title, description, category, status, type, is_group, created_by, member_ids, created_at, updated_at)
SELECT 'proj-' || left(md5(random()::text), 10), 'AI Grader', 'An AI grader tool', 'Other', 'proposed', 'solo', false, id::text, ARRAY[id::text], '2026-03-04', now()
FROM public.club_users
WHERE name ILIKE '%Daksh%'
LIMIT 1;

-- Restore Kota's HTML+CSS project (submitted Mar 3)
INSERT INTO public.projects (id, title, description, category, status, type, is_group, created_by, member_ids, created_at, updated_at)
SELECT 'proj-' || left(md5(random()::text), 10), 'HTML + CSS Website', 'HTML + CSS Website', 'Web Development', 'proposed', 'solo', false, id::text, ARRAY[id::text], '2026-03-03', now()
FROM public.club_users
WHERE name ILIKE '%Kota%'
LIMIT 1;

-- Restore Kota's Minecraft Mod project (submitted Mar 3)
INSERT INTO public.projects (id, title, description, category, status, type, is_group, created_by, member_ids, created_at, updated_at)
SELECT 'proj-' || left(md5(random()::text), 10), 'Minecraft Mod', 'Aims to get 200 downloads within the first month', 'Other', 'proposed', 'solo', false, id::text, ARRAY[id::text], '2026-03-03', now()
FROM public.club_users
WHERE name ILIKE '%Kota%'
LIMIT 1;
