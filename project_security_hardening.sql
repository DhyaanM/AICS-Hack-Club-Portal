-- 1. Create Project Invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  inviter_id  UUID REFERENCES public.club_users(id) ON DELETE CASCADE,
  invitee_id  UUID REFERENCES public.club_users(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Define Project Invitation Policies
-- Members can see invitations they sent or received
CREATE POLICY "invitations_select" ON public.project_invitations
  FOR SELECT TO authenticated
  USING (
    public.is_club_member() AND (
      inviter_id::text = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
      OR 
      invitee_id::text = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
    )
  );

-- Members can insert invitations for projects they created
CREATE POLICY "invitations_insert" ON public.project_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_club_member() AND EXISTS (
      SELECT 1 FROM public.projects 
      WHERE id = project_id 
      AND created_by = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
    )
  );

-- Invitee can update status (accept/decline)
CREATE POLICY "invitations_update" ON public.project_invitations
  FOR UPDATE TO authenticated
  USING (
    invitee_id::text = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
  );

-- 3. Harden Projects Table RLS
-- Drop existing insert/update policies to replace them
DROP POLICY IF EXISTS "Member Submit Projects" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "Member Update Own Project" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;

-- Strict Insert: created_by MUST match the authenticated user's ID
CREATE POLICY "projects_insert_hardened" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_club_member() AND
    created_by = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
  );

-- Strict Update: Only owner can update project details (including member_ids)
-- Other members are added via the invitation accept logic (which runs via a trigger/RPC or just careful client-side logic with leader oversight)
-- For now, allow owner to update, and we'll handle the member_ids via invitation acceptance in the app logic.
CREATE POLICY "projects_update_hardened" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.is_leader() 
    OR 
    created_by = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
  );
