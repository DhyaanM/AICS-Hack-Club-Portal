-- Add 'title' column to 'club_users' table
ALTER TABLE public.club_users ADD COLUMN IF NOT EXISTS title text;

-- Migrate existing hardcoded titles (optional but helpful)
UPDATE public.club_users SET title = 'Founder + President' WHERE email IN ('s936832@aics.espritscholen.nl', 'dhyaanmanganahalli@gmail.com');
UPDATE public.club_users SET title = 'Jobless Fellow' WHERE email = 's936404@aics.espritscholen.nl';
UPDATE public.club_users SET title = 'CEO | Yamada Industries' WHERE email = 's932344@aics.espritscholen.nl';
UPDATE public.club_users SET title = 'CEO | Bank of Sudhakar' WHERE email = 's929175@aics.espritscholen.nl';
UPDATE public.club_users SET title = 'Approved By The Singh Community' WHERE email = 's933681@aics.espritscholen.nl';
UPDATE public.club_users SET title = 'Just A Regular Member' WHERE email = 'daksh.prasad@aics.espritscholen.nl';
UPDATE public.club_users SET title = 'Part of The Top 1%' WHERE email = 's936724@aics.espritscholen.nl';
