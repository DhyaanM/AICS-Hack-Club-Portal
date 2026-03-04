-- Remove the auto-creation trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove the function that automatically adds users
DROP FUNCTION IF EXISTS public.handle_new_user();
