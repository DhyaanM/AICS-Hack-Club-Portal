-- nukes the trigger that auto-creates club_users
-- RUN THIS IN SUPABASE SQL EDITOR

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Also ensure no other weird triggers are messing with club_users
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_user_update();

-- Verify it's gone
SELECT 'Trigger and Function removed successfully' as status;
