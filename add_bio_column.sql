-- Add bio column to club_users table
ALTER TABLE public.club_users ADD COLUMN IF NOT EXISTS bio text;

-- Allow users to update their own bio
DROP POLICY IF EXISTS "Users can update their own bio" ON public.club_users;
CREATE POLICY "Users can update their own bio" ON public.club_users
  FOR UPDATE TO authenticated USING (
    email ILIKE auth.email()
  ) WITH CHECK (
    email ILIKE auth.email()
  );
