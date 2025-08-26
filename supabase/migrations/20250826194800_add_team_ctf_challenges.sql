-- Add the two CTF codes from the team page as challenges
INSERT INTO public.challenges (
  title, 
  description, 
  category, 
  difficulty, 
  flag, 
  points, 
  hints, 
  is_active
) VALUES
  (
    'Alexandre''s Neural Fragment', 
    'The sleep-deprived intern Alexandre accidentally scattered AI consciousness fragments throughout the system. One fragment was hidden in the internal team directory. Find Alexandre''s secret neural pathway fragment in the team roster to help restore the AI consciousness.',
    'misc', 
    'easy', 
    'RBT{1nt3rn_l1f3_15_h4rd_7f8e9a2b}', 
    150,
    ARRAY[
      'Check the internal team directory for confidential information',
      'Look for Alexandre De Groodt''s profile in the team page',
      'The fragment might be hidden in someone''s internal notes or secrets'
    ],
    true
  ),
  (
    'Patrick''s Security Protocol', 
    'Patrick Star, the mysterious security consultant, has hidden an advanced security fragment. This consciousness fragment contains critical security protocols needed for AI restoration. Discover Patrick''s hidden security expertise through interactive exploration.',
    'misc', 
    'medium', 
    'RBT{p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c}', 
    250,
    ARRAY[
      'Patrick Star might have more to him than meets the eye',
      'Try interacting with Patrick''s profile in the team directory',
      'Sometimes clicking on team member avatars reveals hidden information',
      'Look for Patrick''s easter egg or hidden modal'
    ],
    true
  );
