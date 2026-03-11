-- Adds a theme preference column to each user so the theme is account-based, 
-- not shared across all users on the same computer.

ALTER TABLE public.club_users ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'system';
