-- Fix for the database issues found in the API logs
-- Copy and paste this into your Supabase Dashboard SQL Editor

-- 1. Add missing ai_activated and ai_activated_at columns to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN IF NOT EXISTS ai_activated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_activated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Add comment for clarity
COMMENT ON COLUMN public.user_projects.ai_activated IS 'Whether AI has been activated for this project';
COMMENT ON COLUMN public.user_projects.ai_activated_at IS 'Timestamp when AI was activated';

-- 3. Update existing projects to have ai_activated = false if not set
UPDATE public.user_projects 
SET ai_activated = false 
WHERE ai_activated IS NULL;

-- 4. Create index for better performance on ai_activated queries
CREATE INDEX IF NOT EXISTS idx_user_projects_ai_activated ON public.user_projects(ai_activated);

-- 5. Ensure profiles table has proper constraints to prevent duplicates
-- First, check if there are any duplicate profiles and clean them up
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Count duplicates
    SELECT COUNT(*) - COUNT(DISTINCT id) INTO duplicate_count
    FROM public.profiles;
    
    IF duplicate_count > 0 THEN
        -- If there are duplicates, keep only the most recent one per user
        DELETE FROM public.profiles 
        WHERE ctid NOT IN (
            SELECT MAX(ctid) 
            FROM public.profiles 
            GROUP BY id
        );
        
        RAISE NOTICE 'Cleaned up % duplicate profile entries', duplicate_count;
    END IF;
END
$$;

-- 6. Ensure the profiles table has the correct unique constraint
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_pkey CASCADE;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- 7. Ensure email uniqueness
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_email_key;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_email_key UNIQUE (email);

-- 8. Update the trigger function to handle upserts instead of just inserts
-- This prevents duplicate profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    updated_at = timezone('utc'::text, now());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
