-- Drop old policies if they exist
DROP POLICY IF EXISTS "Founder Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Founder Update Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Founder Delete Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Avatars" ON storage.objects;

-- Create the avatars bucket (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Public Read Access
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. Leader-only Upload/Update/Delete (Checks against club_users table)
CREATE POLICY "Leader Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.club_users
        WHERE email = auth.jwt() ->> 'email'
        AND role = 'leader'
    )
);

CREATE POLICY "Leader Update Avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.club_users
        WHERE email = auth.jwt() ->> 'email'
        AND role = 'leader'
    )
);

CREATE POLICY "Leader Delete Avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    EXISTS (
        SELECT 1 FROM public.club_users
        WHERE email = auth.jwt() ->> 'email'
        AND role = 'leader'
    )
);
