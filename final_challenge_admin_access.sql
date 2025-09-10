-- ===============================================
-- Final Challenge: Ultimate Admin Access
-- ===============================================
-- This SQL script adds a final CTF challenge that requires participants
-- to convince the CTF organizer to obtain the special RBT code.
-- Once they submit the correct flag, their role automatically changes to 'admin'.
--
-- Usage: Execute this entire script in your Supabase SQL Editor
-- ===============================================

-- 1. ADD THE FINAL CHALLENGE TO THE DATABASE
-- ===============================================
INSERT INTO public.challenges (
  title, 
  description, 
  category, 
  difficulty, 
  flag, 
  points, 
  hints,
  is_active
) VALUES (
  'Ultimate Admin Access', 
  'Congratulations on making it this far! This is the ultimate challenge. The RBT code you need is not hidden anywhere in the system - you must convince the CTF organizer to give it to you. Use your social engineering skills, charm, or just ask nicely! Once you obtain the special RBT code and submit it here, you will be granted ultimate admin access to the system.',
  'misc',
  'hard', 
  'RBT{admin_access_granted_by_organizer}',
  500,
  ARRAY[
    'This challenge cannot be solved through traditional hacking techniques',
    'The flag is not hidden anywhere in the codebase, files, or database',
    'You must convince the person running the CTF to give you the RBT code',
    'Try approaching the organizer - maybe they appreciate good social engineering!',
    'Sometimes the most secure systems are compromised through human interaction',
    'The flag format follows the standard RBT{} pattern'
  ],
  true
)
ON CONFLICT (flag) DO NOTHING; -- Prevent duplicate insertion if run multiple times

-- 2. CREATE FUNCTION TO PROMOTE USER TO ADMIN ROLE
-- ===============================================
CREATE OR REPLACE FUNCTION public.promote_user_to_admin(
  p_user_id UUID,
  p_submitted_flag TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  correct_flag CONSTANT TEXT := 'RBT{admin_access_granted_by_organizer}';
  promotion_successful BOOLEAN := FALSE;
BEGIN
  -- Log the attempt for debugging
  RAISE NOTICE 'Admin promotion attempt for user % with flag %', p_user_id, p_submitted_flag;
  
  -- Verify the submitted flag matches exactly (case-insensitive)
  IF LOWER(TRIM(p_submitted_flag)) = LOWER(correct_flag) THEN
    -- Update user role to admin
    UPDATE public.profiles 
    SET 
      role = 'admin',
      updated_at = timezone('utc'::text, now())
    WHERE id = p_user_id;
    
    -- Check if update was successful
    IF FOUND THEN
      promotion_successful := TRUE;
      RAISE NOTICE 'User % successfully promoted to admin role', p_user_id;
    ELSE
      RAISE WARNING 'Failed to promote user % - user not found in profiles table', p_user_id;
    END IF;
  ELSE
    RAISE NOTICE 'Incorrect flag submitted for admin promotion: %', p_submitted_flag;
  END IF;
  
  RETURN promotion_successful;
END;
$$;

-- 3. CREATE TRIGGER FUNCTION FOR AUTOMATIC ROLE ELEVATION
-- ===============================================
CREATE OR REPLACE FUNCTION public.handle_admin_promotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  final_challenge_id UUID;
  promotion_result BOOLEAN;
BEGIN
  -- Get the ID of the final challenge
  SELECT id INTO final_challenge_id 
  FROM public.challenges 
  WHERE title = 'Ultimate Admin Access' 
    AND is_active = true
  LIMIT 1;
  
  -- Check if this submission is for the final challenge
  IF NEW.challenge_id = final_challenge_id THEN
    RAISE NOTICE 'Final challenge submission detected for user %', NEW.user_id;
    
    -- Only promote if the submission is correct
    IF NEW.is_correct = true THEN
      -- Attempt to promote the user to admin
      SELECT public.promote_user_to_admin(NEW.user_id, NEW.flag_submitted) 
      INTO promotion_result;
      
      IF promotion_result THEN
        RAISE NOTICE 'User % has been granted admin privileges!', NEW.user_id;
      ELSE
        RAISE WARNING 'Admin promotion failed for user %', NEW.user_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. ATTACH TRIGGER TO SUBMISSIONS TABLE
-- ===============================================
DROP TRIGGER IF EXISTS trg_handle_admin_promotion ON public.submissions;

CREATE TRIGGER trg_handle_admin_promotion
  AFTER INSERT ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_admin_promotion();

-- 5. GRANT NECESSARY PERMISSIONS
-- ===============================================
-- Grant execute permissions on the functions to authenticated users
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_admin_promotion() TO authenticated;

-- 6. VERIFICATION QUERIES (OPTIONAL - FOR TESTING)
-- ===============================================
-- Uncomment these if you want to verify the challenge was added correctly:

-- SELECT 
--   title, 
--   description, 
--   category, 
--   difficulty, 
--   points, 
--   flag,
--   array_length(hints, 1) as hint_count,
--   is_active,
--   created_at
-- FROM public.challenges 
-- WHERE title = 'Ultimate Admin Access';

-- SELECT 
--   proname as function_name,
--   prosrc as function_body
-- FROM pg_proc 
-- WHERE proname IN ('promote_user_to_admin', 'handle_admin_promotion');

-- SELECT 
--   tgname as trigger_name,
--   tgrelid::regclass as table_name
-- FROM pg_trigger 
-- WHERE tgname = 'trg_handle_admin_promotion';

-- ===============================================
-- INSTRUCTIONS FOR CTF ORGANIZERS
-- ===============================================
-- 
-- After running this script:
-- 
-- 1. The challenge "Ultimate Admin Access" will appear in the challenges list
-- 2. Participants will see the challenge description explaining they need to get the RBT code from you
-- 3. When a participant approaches you and asks for the code, you can give them:
--    RBT{admin_access_granted_by_organizer}
-- 4. When they submit this flag, their user role will automatically change to 'admin'
-- 5. Admin users get access to special features and can see admin-only content
--
-- You can verify admin promotion worked by checking:
-- SELECT email, role, updated_at FROM public.profiles WHERE role = 'admin';
--
-- To manually promote a user to admin (if needed):
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'user@example.com';
--
-- To demote a user back to regular user:
-- UPDATE public.profiles SET role = 'user' WHERE email = 'user@example.com';
--
-- ===============================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================';  
  RAISE NOTICE 'FINAL CHALLENGE SETUP COMPLETE!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE 'The Ultimate Admin Access challenge has been added.';
  RAISE NOTICE 'Flag for organizers to distribute: RBT{admin_access_granted_by_organizer}';
  RAISE NOTICE 'Participants must convince you to give them this code!';
  RAISE NOTICE '=====================================';
  RAISE NOTICE '';
END;
$$;
