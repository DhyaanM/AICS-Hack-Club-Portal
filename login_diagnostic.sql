-- Diagnostic Query: Run this in your Supabase SQL Editor
-- This will help us see if users are properly confirmed or missing passwords.

SELECT 
  id, 
  email, 
  confirmed_at, 
  last_sign_in_at, 
  created_at,
  -- Check if they have an encrypted password
  CASE WHEN (encrypted_password IS NOT NULL AND encrypted_password != '') THEN 'Yes' ELSE 'No' END as has_password,
  -- Check if they are confirmed (Supabase requires this for login by default)
  CASE WHEN confirmed_at IS NOT NULL THEN 'Confirmed' ELSE 'UNCONFIRMED' END as auth_status
FROM auth.users
ORDER BY created_at DESC;

/* 
💡 COMMON REASONS FOR "INVALID LOGIN CREDENTIALS":

1. EMAIL CONFIRMATION: If 'auth_status' is 'UNCONFIRMED', Supabase will block login. 
   FIX: In Supabase Dashboard, go to Auth -> Provider Settings -> Email -> Toggle OFF "Confirm Email".

2. MISSING PASSWORD: If you added users via CSV or certain API calls, they might lack a password.
   FIX: You may need to manually reset their password in the Auth table or use the "Reset Password" feature.

3. UNCONFIRMED FLAG: When adding users via the dashboard, make sure the "Auto-confirm" toggle is ON.
*/
