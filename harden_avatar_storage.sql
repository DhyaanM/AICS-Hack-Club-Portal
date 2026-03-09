-- harden_avatar_storage.sql
-- Restricts avatar visibility to club members only.
-- Run this in the Supabase SQL Editor.

-- 1. Make the bucket private (not public)
UPDATE storage.buckets
SET public = false
WHERE id = 'avatars';

-- 2. Drop the old public read policy
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;

-- 3. Create a member-only read policy
-- This uses the same helper function pattern from hardened_rls.sql
CREATE POLICY "Member Read Avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.club_users
        WHERE email = auth.jwt() ->> 'email'
    )
);

-- Note: Upload/Update/Delete policies remain leader-only from fix_avatar_storage.sql
