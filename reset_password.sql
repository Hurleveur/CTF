-- Method 1: Generate a password recovery link
-- Run this in your Supabase SQL editor
SELECT auth.generate_recovery_link('alex@robo.tech'::text);

-- Method 2: Update password directly (if you have the user ID)
-- First, find the user ID
SELECT id, email FROM auth.users WHERE email = 'alex@robo.tech';

-- Then update the password (replace USER_ID with actual ID)
-- Note: This requires the password to be hashed properly
-- It's recommended to use the Supabase Admin API instead

-- Method 3: Force password reset (generates recovery link)
UPDATE auth.users 
SET encrypted_password = '', 
    password_change_token_new = encode(gen_random_bytes(32), 'base64'),
    password_change_token_new_sent_at = now()
WHERE email = 'alex@robo.tech';

-- Check if user exists
SELECT 
    id,
    email, 
    email_confirmed_at,
    last_sign_in_at,
    created_at
FROM auth.users 
WHERE email = 'alex@robo.tech';

-- Check user profile in the CTF system
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM public.profiles p
WHERE p.email = 'alex@robo.tech';
