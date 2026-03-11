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

-- 3. Secure Invitation Acceptance Function
CREATE OR REPLACE FUNCTION public.accept_project_invitation(invitation_uuid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to update projects table
SET search_path = public
AS $$
DECLARE
  v_invitee_email TEXT;
  v_project_id UUID;
  v_invitee_id UUID;
BEGIN
  -- 1. Get current user's email
  v_invitee_email := auth.jwt() ->> 'email';
  
  -- 2. Find and lock the invitation
  SELECT project_id, invitee_id INTO v_project_id, v_invitee_id
  FROM public.project_invitations
  WHERE id = invitation_uuid
    AND status = 'pending'
    AND invitee_id = (SELECT id FROM public.club_users WHERE email ILIKE v_invitee_email);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or not pending for this user.';
  END IF;

  -- 3. Add member to project
  UPDATE public.projects
  SET member_ids = array_append(member_ids, v_invitee_id::text)
  WHERE id = v_project_id
    AND NOT (v_invitee_id::text = ANY(member_ids));

  -- 4. Mark invitation as accepted
  UPDATE public.project_invitations
  SET status = 'accepted'
  WHERE id = invitation_uuid;
END;
$$;

-- 4. Harden Projects Table RLS
-- Drop existing insert/update policies to replace them
DROP POLICY IF EXISTS "Member Submit Projects" ON public.projects;
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "Member Update Own Project" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_insert_hardened" ON public.projects;
DROP POLICY IF EXISTS "projects_update_hardened" ON public.projects;

-- Strict Insert: created_by MUST match the authenticated user's ID
CREATE POLICY "projects_insert_hardened" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_club_member() AND
    created_by = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
  );

-- Strict Update: Leaders, Owners, or existing members can update details
CREATE POLICY "projects_update_hardened" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.is_leader() 
    OR 
    created_by = (SELECT id::text FROM public.club_users WHERE email ILIKE (auth.jwt() ->> 'email'))
    OR
    EXISTS (
      SELECT 1 FROM public.club_users
      WHERE email ILIKE (auth.jwt() ->> 'email')
        AND id::text = ANY(member_ids)
    )
  );
