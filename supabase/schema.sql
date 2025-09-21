-- Full CTF Database Schema with Team Management
-- This includes the base schema plus team management tables from v2.1.0

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
  ai_activated BOOLEAN DEFAULT FALSE,
  ai_activated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===============================================
-- TEAM MANAGEMENT TABLES (v2.1.0)
-- ===============================================

-- Create project invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_username TEXT NOT NULL, -- Cache for easier querying
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT unique_pending_invitation UNIQUE (project_id, invited_user_id) DEFERRABLE INITIALLY DEFERRED
);

-- Add project membership table for normalized many-to-many relationship
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_lead BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_membership UNIQUE (project_id, user_id),
  CONSTRAINT one_project_per_user UNIQUE (user_id),
  CONSTRAINT one_lead_per_project EXCLUDE (project_id WITH =) WHERE (is_lead = TRUE)
);

-- ===============================================
-- REAL-TIME NOTIFICATIONS SYSTEM
-- ===============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('AI_ACTIVATION', 'CHALLENGE_COMPLETED', 'SYSTEM_ALERT', 'USER_PROMOTED')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ===============================================
-- ENABLE ROW LEVEL SECURITY
-- ===============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- RLS POLICIES FOR EXISTING TABLES
-- ===============================================

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

-- ===============================================
-- RLS POLICIES FOR TEAM MANAGEMENT
-- ===============================================

-- Project invitations policies
CREATE POLICY "Users can view own invitations" ON public.project_invitations
  FOR SELECT USING (
    invited_user_id = auth.uid() OR 
    invited_by = auth.uid()
  );

CREATE POLICY "Project leads can create invitations" ON public.project_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

CREATE POLICY "Users can accept own invitations" ON public.project_invitations
  FOR UPDATE USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

CREATE POLICY "Project leads can delete invitations" ON public.project_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

-- Project members policies
CREATE POLICY "Users can view project members" ON public.project_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage members" ON public.project_members
  FOR ALL USING (TRUE)
  WITH CHECK (TRUE);

-- Updated user_projects policies for team access
CREATE POLICY "Users can view projects they're members of" ON public.user_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
    ) OR
    -- Keep admin access
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'dev')
    )
  );

CREATE POLICY "All users can view all projects for leaderboard" ON public.user_projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create projects" ON public.user_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Project members can update project" ON public.user_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Project leads can delete project" ON public.user_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

-- Notifications policies
CREATE POLICY "Dev users can read notifications" ON public.notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dev'
    )
  );

CREATE POLICY "Server can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (false);

CREATE POLICY "Dev users can manage notifications" ON public.notifications
  FOR INSERT, UPDATE, DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'dev'
    )
  );

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync team_members array when membership changes
CREATE OR REPLACE FUNCTION sync_team_members()
RETURNS TRIGGER AS $$
DECLARE
  project_uuid UUID;
  members_array TEXT[];
BEGIN
  -- Determine which project_id to sync based on trigger operation
  IF TG_OP = 'DELETE' THEN
    project_uuid := OLD.project_id;
  ELSE
    project_uuid := NEW.project_id;
  END IF;

  -- Build the team_members array from project_members table
  SELECT ARRAY_AGG(
    CASE 
      WHEN pm.is_lead THEN p.full_name || ' (Lead)'
      ELSE p.full_name
    END
    ORDER BY pm.is_lead DESC, pm.joined_at ASC
  ) INTO members_array
  FROM public.project_members pm
  JOIN public.profiles p ON pm.user_id = p.id
  WHERE pm.project_id = project_uuid;

  -- Update the user_projects table
  UPDATE public.user_projects
  SET team_members = COALESCE(members_array, ARRAY[]::TEXT[])
  WHERE id = project_uuid;

  -- Return appropriate value based on trigger operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_project_invitation(invitation_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  invite_row public.project_invitations%ROWTYPE;
  project_row public.user_projects%ROWTYPE;
  member_count INTEGER;
  result JSONB;
BEGIN
  -- Get the invitation details
  SELECT * INTO invite_row
  FROM public.project_invitations
  WHERE id = invitation_uuid
  AND invited_user_id = auth.uid()
  AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already accepted');
  END IF;

  -- Check if user is already in a project
  IF EXISTS (SELECT 1 FROM public.project_members WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of another project');
  END IF;

  -- Check if project is full
  SELECT COUNT(*) INTO member_count
  FROM public.project_members
  WHERE project_id = invite_row.project_id;

  IF member_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project is full (maximum 3 members)');
  END IF;

  -- Accept the invitation (transaction will handle atomicity)
  BEGIN
    -- Mark invitation as accepted
    UPDATE public.project_invitations
    SET accepted_at = now()
    WHERE id = invitation_uuid;

    -- Add user to project
    INSERT INTO public.project_members (project_id, user_id, is_lead)
    VALUES (invite_row.project_id, auth.uid(), FALSE);

    -- Get updated project data
    SELECT * INTO project_row
    FROM public.user_projects
    WHERE id = invite_row.project_id;

    result := jsonb_build_object(
      'success', true,
      'project', row_to_json(project_row)
    );

    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to accept invitation: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to handle leaving project
CREATE OR REPLACE FUNCTION leave_project()
RETURNS JSONB AS $$
DECLARE
  member_row public.project_members%ROWTYPE;
  remaining_members INTEGER;
BEGIN
  -- Get current user's membership
  SELECT * INTO member_row
  FROM public.project_members
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not a member of any project');
  END IF;

  -- Check if user is the lead
  IF member_row.is_lead THEN
    -- Count remaining members
    SELECT COUNT(*) INTO remaining_members
    FROM public.project_members
    WHERE project_id = member_row.project_id
    AND user_id != auth.uid();

    IF remaining_members > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Project leaders cannot leave while other members remain. Transfer leadership first.');
    END IF;
  END IF;

  -- Remove user from project
  DELETE FROM public.project_members
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'message', 'Successfully left the project');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Failed to leave project: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
    
    -- Send real-time notification to dev users about the promotion
    INSERT INTO public.notifications (type, message, data, created_by)
    SELECT 
      'USER_PROMOTED',
      '👑 ' || COALESCE(p.full_name, p.email) || ' has been promoted to admin after completing the Ultimate Challenge!',
      json_build_object('userId', NEW.user_id, 'userEmail', p.email, 'userName', p.full_name, 'newRole', 'admin', 'timestamp', timezone('utc'::text, now())),
      NEW.user_id
    FROM public.profiles p 
    WHERE p.id = NEW.user_id;
    
    RAISE NOTICE 'User % has been granted admin privileges for completing the final challenge!', NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ===============================================
-- TRIGGERS
-- ===============================================

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_challenges
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_user_projects
  BEFORE UPDATE ON public.user_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_notifications
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Triggers to automatically sync team_members array
CREATE TRIGGER sync_team_members_on_insert
  AFTER INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

CREATE TRIGGER sync_team_members_on_update
  AFTER UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

CREATE TRIGGER sync_team_members_on_delete
  AFTER DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

-- Trigger to automatically promote users who complete the final challenge
DROP TRIGGER IF EXISTS trg_final_challenge_promotion ON public.submissions;
CREATE TRIGGER trg_final_challenge_promotion
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_final_challenge_promotion();

-- ===============================================
-- SAMPLE DATA
-- ===============================================

-- Insert some default challenges for testing
INSERT INTO public.challenges (title, description, category, difficulty, flag, points, hints) VALUES
  ('Welcome to CTF', 'This is your first challenge! The flag is hidden in plain sight.', 'misc', 'easy', 'CTF{welcome_to_robotics_ctf}', 50, NULL),
  ('Basic Web Security', 'Find the hidden admin panel in this web application.', 'web', 'easy', 'CTF{admin_panel_found}', 100, NULL),
  ('Robot Assembly Code', 'Analyze this assembly code to find the secret key.', 'reverse', 'medium', 'CTF{assembly_master_2024}', 200, NULL),
  ('Encrypted Communications', 'Decrypt the robot communication protocol.', 'crypto', 'hard', 'CTF{robots_speak_in_riddles}', 300, NULL),
  ('Admin Terminal Breach', 'The intern left a backdoor to the admin terminal. Can you find the access method and get the terminal flag?', 'web', 'medium', 'RBT{4dm1n_t3rm1n4l_pwn3d_6d8e4b}', 250, ARRAY['Check security.txt for clues about admin access', 'Look for URL parameters that might grant access', 'The terminal itself will guide you to the flag']),
  ('Alexandre''s Account', 'Guess the password of Alexandre De Groodt, the sleep-deprived intern who built this site. His personal info is scattered around...', 'misc', 'hard', 'RBT{intern_account_compromised}', 400, ARRAY['Alexandre mentioned being sleep-deprived and working at 3AM', 'Check the team page and about page for personal details', 'What significant year might he use in his password?', 'Think about common password patterns with personal info']),
  ('Contact Protocol', 'Security best practices with vulnerabilities. Find the hidden message in the security documentation.', 'crypto', 'medium', 'RBT{security_through_obscurity_fails}', 250, ARRAY['Check the security.txt file', 'Look for encoded text in the PGP block', 'ROT13 is a simple cipher', 'The fake PGP key contains the real secret']),
  ('Intern Account Access', 'The company intern Alex has a weak password. His email is alex@robo.tech and his password follows a common pattern used by sleep-deprived developers.', 'misc', 'medium', 'RBT{sleepy_intern_logged_in}', 200, ARRAY['The intern works late hours and is often sleep-deprived', 'His password might be related to his work schedule or habits', 'Try common password patterns: password but more safe']),
  ('Ultimate Admin Access', 'Congratulations on making it this far! This is the ultimate challenge. The RBT code you need is not hidden anywhere in the system - you must convince the CTF organizer to give it to you. Use your social engineering skills, charm, or just ask nicely! Once you obtain the special RBT code and submit it here, you will be granted ultimate admin access to the system.', 'misc', 'hard', 'RBT{admin_access_granted_by_organizer}', 500, ARRAY['This challenge cannot be solved through traditional hacking techniques', 'The flag is not hidden anywhere in the codebase, files, or database', 'You must convince the person running the CTF to give you the RBT code', 'Try approaching the organizer - maybe they appreciate good social engineering!', 'Sometimes the most secure systems are compromised through human interaction'])
ON CONFLICT (flag) DO NOTHING;

-- Populate project_members for existing projects
INSERT INTO public.project_members (project_id, user_id, is_lead, joined_at)
SELECT id, user_id, TRUE, created_at
FROM public.user_projects
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ===============================================
-- GRANT PERMISSIONS
-- ===============================================

-- Grant minimal necessary permissions (RLS policies will control access)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Profiles: Users need SELECT, INSERT, UPDATE for their own records
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Challenges: Users need SELECT to view, admins can manage via RLS
GRANT SELECT ON public.challenges TO authenticated;

-- Submissions: Users need INSERT/SELECT for their own, admins view all via RLS  
GRANT SELECT, INSERT ON public.submissions TO authenticated;

-- User projects: Users need full CRUD for their own projects via RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;

-- Team management tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;

-- Notifications: Dev users get full access for management
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

-- Leaderboard: Public read-only view
GRANT SELECT ON public.leaderboard TO anon, authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION sync_team_members() TO authenticated;
GRANT EXECUTE ON FUNCTION accept_project_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_project() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_final_challenge_promotion() TO authenticated;


-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin_settings (
  id integer NOT NULL DEFAULT nextval('admin_settings_id_seq'::regclass),
  key character varying NOT NULL UNIQUE,
  challenge_cutoff_date timestamp with time zone,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL CHECK (category = ANY (ARRAY['web'::text, 'crypto'::text, 'forensics'::text, 'pwn'::text, 'reverse'::text, 'misc'::text])),
  difficulty text NOT NULL CHECK (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text])),
  flag text NOT NULL,
  points integer NOT NULL DEFAULT 100,
  file_url text,
  hints ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by uuid,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT challenges_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  type text NOT NULL CHECK (type = ANY (ARRAY['AI_ACTIVATION'::text, 'CHALLENGE_COMPLETED'::text, 'SYSTEM_ALERT'::text, 'USER_PROMOTED'::text])),
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  role text DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'dev'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ctf_role text DEFAULT '🎯 CTF Participant'::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_invitations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  invited_user_id uuid NOT NULL,
  invited_by uuid,
  invited_username text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  accepted_at timestamp with time zone,
  CONSTRAINT project_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT project_invitations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id),
  CONSTRAINT project_invitations_invited_user_id_fkey FOREIGN KEY (invited_user_id) REFERENCES auth.users(id),
  CONSTRAINT project_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL UNIQUE,
  is_lead boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.user_projects(id)
);
CREATE TABLE public.submissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  challenge_id uuid,
  flag_submitted text NOT NULL,
  is_correct boolean NOT NULL,
  points_awarded integer DEFAULT 0,
  submitted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT submissions_pkey PRIMARY KEY (id),
  CONSTRAINT submissions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id),
  CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_projects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL,
  logo text NOT NULL DEFAULT '🤖'::text,
  ai_status text NOT NULL DEFAULT 'Basic Motor Functions'::text CHECK (ai_status = ANY (ARRAY['Basic Motor Functions'::text, 'Advanced Cognitive Patterns'::text, 'Self-Awareness Protocols'::text, 'Full AI Consciousness'::text])),
  status_color text NOT NULL DEFAULT 'red'::text CHECK (status_color = ANY (ARRAY['red'::text, 'yellow'::text, 'orange'::text, 'green'::text])),
  neural_reconstruction numeric DEFAULT 0.0 CHECK (neural_reconstruction >= 0::numeric AND neural_reconstruction <= 100::numeric),
  last_backup date DEFAULT CURRENT_DATE,
  lead_developer text,
  team_members ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ai_activated boolean DEFAULT false,
  ai_activated_at timestamp without time zone,
  CONSTRAINT user_projects_pkey PRIMARY KEY (id),
  CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);