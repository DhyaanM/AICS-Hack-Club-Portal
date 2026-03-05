-- 1. Create the function that handle's new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.club_users (id, email, name, role, join_date)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'member',
    now()
  )
  ON CONFLICT (email) DO NOTHING;
  RETURN new;
END;
$$;

-- 2. Create the trigger on auth.users
-- This trigger fires every time a new row is added to the auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Sync existing users (Optional migration)
-- This will add any users currently in Authentication who are missing from club_users
INSERT INTO public.club_users (id, email, name, role, join_date)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  'member',
  now()
FROM auth.users
ON CONFLICT (email) DO NOTHING;
