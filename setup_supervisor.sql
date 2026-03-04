-- Setup Supervisor Account
-- This script creates a supervisor account with a 'leader' role in the club_users table

-- First check if she already exists in the auth.users table (from trying to login before)
-- If not, she will need to login first so the auth.user is created.
-- But since resolveClubUser auto-creates them on first login, we just need to ensure she's created as a leader.
-- Wait, actually the `resolveClubUser` looks at `LEADER_EMAILS` array.
-- Let's just create her club_user record directly. Supabase auth will link it by email when she logs in.

INSERT INTO public.club_users (name, email, role, tags)
VALUES ('Ms. Titus', 's.titus@aics.espritscholen.nl', 'leader', ARRAY[]::text[])
ON CONFLICT (email) 
DO UPDATE SET role = 'leader';

-- Give her the proper title
UPDATE public.club_users
SET title = 'Teacher Supervisor'
WHERE email = 's.titus@aics.espritscholen.nl';
