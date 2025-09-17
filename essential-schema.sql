-- Essential tables to fix schema cache errors
-- Copy and paste this into your Supabase Dashboard SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
  ctf_role TEXT DEFAULT '🎯 CTF Participant',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

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

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for user_projects table
CREATE POLICY "Users can view their own projects" ON public.user_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON public.user_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.user_projects
  FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can view all projects for leaderboard
CREATE POLICY "Authenticated users can view all projects" ON public.user_projects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Grant minimal necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_projects TO authenticated;

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
