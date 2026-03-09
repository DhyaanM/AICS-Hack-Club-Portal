-- Create the avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for the avatars bucket
-- 1. Anyone can view avatars (Public Read)
CREATE POLICY "Public Read Avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. Only the founder can upload/update avatars
-- Replace 'dhyaan@example.com' with the actual founder email from your .env.local if needed
-- For now, we'll use a service-role level check or specific email if possible.
-- Since we are using NEXT_PUBLIC_FOUNDER_EMAILS in the app, we can check against those emails in the DB.

CREATE POLICY "Founder Upload Avatars"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars' AND
    auth.jwt() ->> 'email' = ANY(string_to_array(COALESCE(current_setting('app.founder_emails', true), 'dhyaan.m@aics.espritscholen.nl'), ','))
);

CREATE POLICY "Founder Update Avatars"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars' AND
    auth.jwt() ->> 'email' = ANY(string_to_array(COALESCE(current_setting('app.founder_emails', true), 'dhyaan.m@aics.espritscholen.nl'), ','))
);

CREATE POLICY "Founder Delete Avatars"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars' AND
    auth.jwt() ->> 'email' = ANY(string_to_array(COALESCE(current_setting('app.founder_emails', true), 'dhyaan.m@aics.espritscholen.nl'), ','))
);
