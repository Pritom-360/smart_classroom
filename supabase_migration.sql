-- SUPABASE DATABASE MIGRATION SCRIPT
-- Execute these statements in the SQL Editor of your Supabase Dashboard.

-- 1. Add the missing 'member_name' column to the 'team_members' table
ALTER TABLE team_members 
ADD COLUMN IF NOT EXISTS member_name TEXT;

-- 2. Add signature_url to the 'competitions' table to store official organizer signatures
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS signature_url TEXT;

-- 3. Add certificate issuance columns to the 'registrations' table
ALTER TABLE registrations 
ADD COLUMN IF NOT EXISTS certificate_issued BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS certificate_name TEXT;

-- 4. Verify / update Row Level Security (RLS) policies for team_members if needed
-- Allow authenticated users to insert members
DROP POLICY IF EXISTS "Allow authenticated insert to team_members" ON team_members;
CREATE POLICY "Allow authenticated insert to team_members" 
ON team_members FOR INSERT 
TO authenticated 
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select from team_members" ON team_members;
CREATE POLICY "Allow public select from team_members" 
ON team_members FOR SELECT 
USING (true);

-- 5. Indexes to optimize query response times and lower database load
CREATE INDEX IF NOT EXISTS idx_team_members_member_email ON team_members(member_email);
CREATE INDEX IF NOT EXISTS idx_registrations_user_id ON registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_competition_id ON registrations(competition_id);
CREATE INDEX IF NOT EXISTS idx_team_members_registration_id ON team_members(registration_id);

-- 6. Verify / update Row Level Security (RLS) policies for registrations
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Allow public read access to registrations (so teammates and leaderboards can view entries)
DROP POLICY IF EXISTS "Allow public select from registrations" ON registrations;
CREATE POLICY "Allow public select from registrations" 
ON registrations FOR SELECT 
USING (true);

-- Allow authenticated users to insert their own registrations
DROP POLICY IF EXISTS "Allow authenticated insert to registrations" ON registrations;
CREATE POLICY "Allow authenticated insert to registrations" 
ON registrations FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow creators (Team Leaders) to update their own registrations (e.g. for submitting work)
DROP POLICY IF EXISTS "Allow update for creators" ON registrations;
CREATE POLICY "Allow update for creators" 
ON registrations FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Add ranking_structure JSONB to competitions to support dynamic rankings per segment
ALTER TABLE competitions 
ADD COLUMN IF NOT EXISTS ranking_structure JSONB DEFAULT '[{"placement": 1, "title": "Champion", "points": 100}, {"placement": 2, "title": "1st Runner Up", "points": 60}, {"placement": 3, "title": "2nd Runner Up", "points": 40}]'::jsonb;
