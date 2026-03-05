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
INSERT INTO meetings (title, date, description)
VALUES 
  ('Weekly Meeting #1', '2026-03-09', 'First session of March'),
  ('Weekly Meeting #2', '2026-03-16', 'Hack session & project work'),
  ('Weekly Meeting #3', '2026-03-23', 'Technical workshop'),
  ('Weekly Meeting #4', '2026-03-30', 'End of month check-in'),
  ('Weekly Meeting #5', '2026-04-06', 'Spring projects kickoff'),
  ('Weekly Meeting #6', '2026-04-13', 'Guest speaker session'),
  ('Weekly Meeting #7', '2026-04-20', 'Mid-term hackathon prep'),
  ('Weekly Meeting #8', '2026-04-27', 'Final project scoping'),
  ('Weekly Meeting #9', '2026-05-04', 'May the 4th session'),
  ('Weekly Meeting #10', '2026-05-11', 'UI/UX workshop'),
  ('Weekly Meeting #11', '2026-05-18', 'Backend optimization talk'),
  ('Weekly Meeting #12', '2026-05-25', 'Hack Club showcase prep'),
  ('Weekly Meeting #13', '2026-06-01', 'Summer projects planning'),
  ('Weekly Meeting #14', '2026-06-08', 'Demo Day #1'),
  ('Weekly Meeting #15', '2026-06-15', 'Demo Day #2'),
  ('Final Session', '2026-06-22', 'Farewell & summer break')
ON CONFLICT DO NOTHING;
