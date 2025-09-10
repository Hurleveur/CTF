-- Add this to the end of your existing supabase/schema.sql file

-- Final Challenge: Ultimate Admin Access
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_final_challenge_promotion() TO authenticated;
