-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'dev')),
  ctf_role TEXT DEFAULT '🎯 CTF Participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create CTF challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('web', 'crypto', 'forensics', 'pwn', 'reverse', 'misc')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  flag TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 100,
  file_url TEXT,
  hints TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create submissions table to track user attempts
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  flag_submitted TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  points_awarded INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  p.id,
  p.full_name,
  p.email,
  COALESCE(SUM(s.points_awarded), 0) as total_points,
  COUNT(DISTINCT CASE WHEN s.is_correct THEN s.challenge_id END) as challenges_solved,
  MAX(s.submitted_at) as last_submission
FROM public.profiles p
LEFT JOIN public.submissions s ON p.id = s.user_id AND s.is_correct = true
GROUP BY p.id, p.full_name, p.email
ORDER BY total_points DESC, last_submission ASC;

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- RLS Policies for challenges table
CREATE POLICY "Active challenges are viewable by authenticated users" ON public.challenges
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Admins and dev users can manage all challenges
CREATE POLICY "Admin users can manage all challenges" ON public.challenges
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- RLS Policies for submissions table
CREATE POLICY "Users can view their own submissions" ON public.submissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" ON public.submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all submissions, dev users can manage all
CREATE POLICY "Admin users can view all submissions" ON public.submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- Only dev users can modify/delete submissions
CREATE POLICY "Dev users can manage all submissions" ON public.submissions
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dev'
    )
  );

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_challenges
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create user projects table for robotic arm projects
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '🤖',
  ai_status TEXT NOT NULL DEFAULT 'Basic Motor Functions' CHECK (ai_status IN ('Basic Motor Functions', 'Advanced Cognitive Patterns', 'Self-Awareness Protocols', 'Full AI Consciousness')),
  status_color TEXT NOT NULL DEFAULT 'red' CHECK (status_color IN ('red', 'yellow', 'orange', 'green')),
  neural_reconstruction DECIMAL(5,2) DEFAULT 0.0 CHECK (neural_reconstruction >= 0 AND neural_reconstruction <= 100),
  last_backup DATE DEFAULT CURRENT_DATE,
  lead_developer TEXT,
  team_members TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert some default challenges for testing
INSERT INTO public.challenges (title, description, category, difficulty, flag, points, hints) VALUES
  ('Welcome to CTF', 'This is your first challenge! The flag is hidden in plain sight.', 'misc', 'easy', 'CTF{welcome_to_robotics_ctf}', 50, NULL),
  ('Basic Web Security', 'Find the hidden admin panel in this web application.', 'web', 'easy', 'CTF{admin_panel_found}', 100, NULL),
  ('Robot Assembly Code', 'Analyze this assembly code to find the secret key.', 'reverse', 'medium', 'CTF{assembly_master_2024}', 200, NULL),
  ('Encrypted Communications', 'Decrypt the robot communication protocol.', 'crypto', 'hard', 'CTF{robots_speak_in_riddles}', 300, NULL),
  ('Admin Terminal Breach', 'The intern left a backdoor to the admin terminal. Can you find the access method and get the terminal flag?', 'web', 'medium', 'RBT{admin_terminal_pwned}', 250, ARRAY['Check security.txt for clues about admin access', 'Look for URL parameters that might grant access', 'The terminal itself will guide you to the flag']),
  ('Alexandre\'s Account', 'Guess the password of Alexandre De Groodt, the sleep-deprived intern who built this site. His personal info is scattered around...', 'misc', 'hard', 'RBT{intern_account_compromised}', 400, ARRAY['Alexandre mentioned being sleep-deprived and working at 3AM', 'Check the team page and about page for personal details', 'What significant year might he use in his password?', 'Think about common password patterns with personal info']),
  ('Contact Protocol', 'Security best practices with vulnerabilities. Find the hidden message in the security documentation.', 'crypto', 'medium', 'RBT{security_through_obscurity_fails}', 250, ARRAY['Check the security.txt file', 'Look for encoded text in the PGP block', 'ROT13 is a simple cipher', 'The fake PGP key contains the real secret']),
  ('Intern Account Access', 'The company intern Alex has a weak password. His email is alex@robo.tech and his password follows a common pattern used by sleep-deprived developers.', 'misc', 'medium', 'RBT{sleepy_intern_logged_in}', 200, ARRAY['The intern works late hours and is often sleep-deprived', 'His password might be related to his work schedule or habits', 'Try common password patterns: password but more safe'])
ON CONFLICT (flag) DO NOTHING;

-- Enable RLS for user_projects
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_projects table
CREATE POLICY "Users can view their own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.user_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.user_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Authenticated users can view all projects for leaderboard
CREATE POLICY "Authenticated users can view all projects" ON public.user_projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can view all projects
CREATE POLICY "Admin users can view all projects" ON public.user_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'dev')
    )
  );

-- Only dev users can modify projects
CREATE POLICY "Dev users can manage all projects" ON public.user_projects
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dev'
    )
  );

-- Trigger for updated_at on user_projects
CREATE TRIGGER handle_updated_at_user_projects
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Grant minimal necessary permissions (RLS policies will control access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Profiles: Users need SELECT, INSERT, UPDATE for their own records
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon; -- For public leaderboard only

-- Challenges: Users need SELECT to view, admins can manage via RLS
GRANT SELECT ON public.challenges TO authenticated;

-- Submissions: Users need INSERT/SELECT for their own, admins view all via RLS  
GRANT SELECT, INSERT ON public.submissions TO authenticated;

-- User projects: Users need full CRUD for their own projects via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;

-- Leaderboard: Public read-only view
GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- ===============================================
-- FINAL CHALLENGE: Ultimate Admin Access
-- ===============================================
-- This challenge requires participants to convince the CTF organizer
-- to give them the RBT code. Once submitted, their role changes to 'admin'.

-- Add the final challenge
INSERT INTO public.challenges (title, description, category, difficulty, flag, points, hints) VALUES
  ('Ultimate Admin Access', 'Congratulations on making it this far! This is the ultimate challenge. The RBT code you need is not hidden anywhere in the system - you must convince the CTF organizer to give it to you. Use your social engineering skills, charm, or just ask nicely! Once you obtain the special RBT code and submit it here, you will be granted ultimate admin access to the system.', 'misc', 'hard', 'RBT{admin_access_granted_by_organizer}', 500, ARRAY['This challenge cannot be solved through traditional hacking techniques', 'The flag is not hidden anywhere in the codebase, files, or database', 'You must convince the person running the CTF to give you the RBT code', 'Try approaching the organizer - maybe they appreciate good social engineering!', 'Sometimes the most secure systems are compromised through human interaction'])
ON CONFLICT (flag) DO NOTHING;

-- Function to promote user to admin when they submit the correct final flag
CREATE OR REPLACE FUNCTION public.handle_final_challenge_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  final_challenge_id UUID;
BEGIN
  -- Get the ID of the final challenge
  SELECT id INTO final_challenge_id 
  FROM public.challenges 
  WHERE title = 'Ultimate Admin Access' AND is_active = true
  LIMIT 1;
  
  -- Check if this submission is for the final challenge and is correct
  IF NEW.challenge_id = final_challenge_id AND NEW.is_correct = true THEN
    -- Promote user to admin role
    UPDATE public.profiles 
    SET role = 'admin', updated_at = timezone('utc'::text, now())
    WHERE id = NEW.user_id;
    
    RAISE NOTICE 'User % has been granted admin privileges for completing the final challenge!', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically promote users who complete the final challenge
DROP TRIGGER IF EXISTS trg_final_challenge_promotion ON public.submissions;
CREATE TRIGGER trg_final_challenge_promotion
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_final_challenge_promotion();

-- Grant permissions for the final challenge function
GRANT EXECUTE ON FUNCTION public.handle_final_challenge_promotion() TO authenticated;
