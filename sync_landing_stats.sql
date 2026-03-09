-- sync_landing_stats.sql
-- This script creates a secure function to fetch club statistics for the public landing page.
-- It ensures sensitive data is not exposed while keeping statistics real-time.

CREATE OR REPLACE FUNCTION public.get_landing_stats(excluded_email TEXT DEFAULT '')
RETURNS TABLE (
  member_count bigint,
  project_count bigint,
  meeting_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT count(*) FROM public.club_users WHERE email != excluded_email),
    (SELECT count(*) FROM public.projects WHERE status = 'completed'),
    (SELECT count(*) FROM public.meetings WHERE date::date <= CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to both anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.get_landing_stats(TEXT) TO anon, authenticated;
