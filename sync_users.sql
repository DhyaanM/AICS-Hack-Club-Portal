-- 1. Sync any existing users from auth.users that aren't in club_users yet
INSERT INTO public.club_users (id, email, name, role, tags)
SELECT
    id,
    LOWER(email),
    SPLIT_PART(email, '@', 1), -- fallback name
    CASE
        WHEN LOWER(email) IN ('s936832@aics.espritscholen.nl', 's936404@aics.espritscholen.nl') THEN 'leader'
        ELSE 'member'
    END,
    '{}'::text[]
FROM auth.users
ON CONFLICT (email) DO NOTHING;


-- 2. Create a function that automatically adds future users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.club_users (id, email, name, role, tags)
  VALUES (
    new.id,
    LOWER(new.email),
    SPLIT_PART(new.email, '@', 1),
    CASE
        WHEN LOWER(new.email) IN ('s936832@aics.espritscholen.nl', 's936404@aics.espritscholen.nl') THEN 'leader'
        ELSE 'member'
    END,
    '{}'::text[]
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create the trigger to run every time a user is invited/signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
