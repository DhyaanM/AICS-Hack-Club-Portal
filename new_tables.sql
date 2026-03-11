-- ============================================================
-- AICS Hack Club Portal – New Feature Tables
-- ============================================================
-- Run AFTER fix_member_rls.sql in the Supabase SQL Editor.
-- ============================================================

-- 1. Announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id          text PRIMARY KEY DEFAULT 'ann-' || substr(md5(random()::text), 1, 8),
  title       text NOT NULL,
  content     text NOT NULL,
  created_by  text NOT NULL,  -- club_users.id
  pinned      boolean NOT NULL DEFAULT false,
  created_at  text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD')
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- All authenticated members can read announcements
DROP POLICY IF EXISTS "ann_select" ON public.announcements;
CREATE POLICY "ann_select" ON public.announcements
  FOR SELECT TO authenticated USING (public.is_club_member());

-- Only leaders can create/update/delete announcements
DROP POLICY IF EXISTS "ann_insert" ON public.announcements;
CREATE POLICY "ann_insert" ON public.announcements
  FOR INSERT TO authenticated WITH CHECK (public.is_leader());

DROP POLICY IF EXISTS "ann_update" ON public.announcements;
CREATE POLICY "ann_update" ON public.announcements
  FOR UPDATE TO authenticated USING (public.is_leader());

DROP POLICY IF EXISTS "ann_delete" ON public.announcements;
CREATE POLICY "ann_delete" ON public.announcements
  FOR DELETE TO authenticated USING (public.is_leader());

-- 2. Project Kudos table (one kudo per user per project)
CREATE TABLE IF NOT EXISTS public.project_kudos (
  id          text PRIMARY KEY DEFAULT 'kudo-' || substr(md5(random()::text), 1, 8),
  project_id  text NOT NULL,
  user_id     text NOT NULL,  -- club_users.id
  created_at  text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD'),
  UNIQUE (project_id, user_id)
);

ALTER TABLE public.project_kudos ENABLE ROW LEVEL SECURITY;

-- All members can see kudos
DROP POLICY IF EXISTS "kudos_select" ON public.project_kudos;
CREATE POLICY "kudos_select" ON public.project_kudos
  FOR SELECT TO authenticated USING (public.is_club_member());

-- Members can add their own kudo
DROP POLICY IF EXISTS "kudos_insert" ON public.project_kudos;
CREATE POLICY "kudos_insert" ON public.project_kudos
  FOR INSERT TO authenticated WITH CHECK (
    public.is_club_member()
    AND EXISTS (
      SELECT 1 FROM public.club_users
      WHERE email ILIKE auth.email()
        AND id::text = user_id
    )
  );

-- Members can only remove their own kudo (leaders can remove any)
DROP POLICY IF EXISTS "kudos_delete" ON public.project_kudos;
CREATE POLICY "kudos_delete" ON public.project_kudos
  FOR DELETE TO authenticated USING (
    public.is_leader()
    OR EXISTS (
      SELECT 1 FROM public.club_users
      WHERE email ILIKE auth.email()
        AND id::text = user_id
    )
  );

SELECT 'Tables created successfully!' as status;
