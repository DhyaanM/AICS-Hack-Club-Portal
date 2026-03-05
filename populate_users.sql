-- Populate core leadership team
INSERT INTO club_users (email, name, role, tags)
VALUES 
  ('s936832@aics.espritscholen.nl', 'Dhyaan Manganahalli', 'leader', ARRAY['Founder', 'President']),
  ('dhyaanmanganahalli@gmail.com', 'Dhyaan Manganahalli', 'leader', ARRAY['Founder', 'Technical Director']),
  ('s936404@aics.espritscholen.nl', 'Akshit Aggarwal', 'leader', ARRAY['Cofounder', 'Operations Director']),
  ('s.titus@aics.espritscholen.nl', 'Ms. Titus', 'leader', ARRAY['Teacher Supervisor'])
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, role = EXCLUDED.role, tags = EXCLUDED.tags;

-- Template for adding members (Update the emails before running)
/*
INSERT INTO club_users (email, name, role, tags)
VALUES 
  ('kota@example.com', 'Kota', 'member', ARRAY['Member']),
  ('daksh@example.com', 'Daksh', 'member', ARRAY['Member']),
  ('pranesh@example.com', 'Pranesh', 'member', ARRAY['Member']),
  ('rohan@example.com', 'Rohan', 'member', ARRAY['Member']),
  ('shreyas@example.com', 'Shreyas', 'member', ARRAY['Member'])
ON CONFLICT (email) DO NOTHING;
*/

-- Optional: Meetings for March - June 2026
INSERT INTO meetings (title, date)
VALUES 
  ('Weekly Meeting #1', '2026-03-09'),
  ('Weekly Meeting #2', '2026-03-16'),
  ('Weekly Meeting #3', '2026-03-23'),
  ('Weekly Meeting #4', '2026-03-30'),
  ('Weekly Meeting #5', '2026-04-06'),
  ('Weekly Meeting #6', '2026-04-13'),
  ('Weekly Meeting #7', '2026-04-20'),
  ('Weekly Meeting #8', '2026-04-27'),
  ('Weekly Meeting #9', '2026-05-04'),
  ('Weekly Meeting #10', '2026-05-11'),
  ('Weekly Meeting #11', '2026-05-18'),
  ('Weekly Meeting #12', '2026-05-25'),
  ('Weekly Meeting #13', '2026-06-01'),
  ('Weekly Meeting #14', '2026-06-08'),
  ('Weekly Meeting #15', '2026-06-15'),
  ('Final Session', '2026-06-22')
ON CONFLICT DO NOTHING;
