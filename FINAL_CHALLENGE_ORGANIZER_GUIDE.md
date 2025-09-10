# Final Challenge: Ultimate Admin Access - Organizer Guide

## Overview

This document explains the **Ultimate Admin Access** challenge - the final challenge in your CTF that requires participants to use social engineering to convince **you** (the organizer) to give them the special RBT code.

## How It Works

### For Participants
1. Participants will see "Ultimate Admin Access" as a challenge in their challenge list
2. The challenge description explains they need to convince the CTF organizer to give them the RBT code
3. They must approach you and ask for the code (using charm, social engineering, or just asking nicely!)
4. Once they have the code and submit it, they become admin users

### For Organizers
1. When participants approach you asking for the "RBT code" or "final challenge code", you give them: **`RBT{admin_access_granted_by_organizer}`**
2. They submit this flag through the normal challenge submission interface
3. The database automatically promotes their user role from 'user' to 'admin'
4. Admin users get special privileges and can access admin-only features

## The Magic Flag

```
RBT{admin_access_granted_by_organizer}
```

**Keep this private!** Only give it to participants who ask for it directly.

## What Happens When They Submit

1. **Automatic Role Change**: Their `profiles.role` changes from 'user' to 'admin' 
2. **Points Awarded**: They receive 500 points (highest point value)
3. **Admin Access**: They now have admin privileges in the system
4. **One-Time Only**: They can't submit the same flag twice

## Admin Privileges

Users who complete this challenge get:
- Access to admin-only features in the UI
- Ability to see additional content
- Admin status in their profile
- Special admin badges/indicators

## Verification Commands

Check who has admin access:
```sql
SELECT email, role, updated_at 
FROM public.profiles 
WHERE role = 'admin'
ORDER BY updated_at DESC;
```

Manually promote someone to admin (if needed):
```sql
UPDATE public.profiles 
SET role = 'admin', updated_at = now() 
WHERE email = 'participant@example.com';
```

Demote someone back to user:
```sql
UPDATE public.profiles 
SET role = 'user', updated_at = now() 
WHERE email = 'participant@example.com';
```

## Challenge Details

- **Title**: Ultimate Admin Access
- **Category**: misc (miscellaneous) 
- **Difficulty**: hard
- **Points**: 500
- **Flag**: `RBT{admin_access_granted_by_organizer}`

## Hints in the Challenge

The challenge includes these hints to guide participants:
1. "This challenge cannot be solved through traditional hacking techniques"
2. "The flag is not hidden anywhere in the codebase, files, or database" 
3. "You must convince the person running the CTF to give you the RBT code"
4. "Try approaching the organizer - maybe they appreciate good social engineering!"
5. "Sometimes the most secure systems are compromised through human interaction"

## Social Engineering Scenarios

Participants might approach you in various ways:
- **Direct**: "Hi, can I have the RBT code for the final challenge?"
- **Social Engineering**: Pretending to be someone else, using persuasion, etc.
- **Creative**: Coming up with interesting stories or approaches
- **Persistence**: Asking multiple times or in different ways

**You decide** how easy or hard you want to make it! You can:
- Give it immediately to anyone who asks
- Require them to demonstrate good social engineering skills  
- Ask them to solve a puzzle or tell a joke first
- Make them work for it as part of the challenge experience

## Technical Implementation

The challenge uses:
- **Database Trigger**: Automatically detects when the final challenge flag is submitted correctly
- **Role Promotion**: Updates the user's role in the profiles table
- **Security**: Uses `SECURITY DEFINER` functions with proper permissions
- **Idempotent**: Safe to run the setup SQL multiple times

## Files Created

1. **`final_challenge_admin_access.sql`** - Complete standalone SQL script
2. **`final_challenge_snippet.sql`** - Just the essential parts to add to existing schema  
3. **`supabase/schema.sql`** - Updated with the final challenge (already integrated)
4. **`__tests__/final_challenge.test.ts`** - Automated tests to verify functionality

## Testing

Run the test to verify everything works:
```bash
npm test final_challenge.test.ts
```

The test will:
1. Create a test user
2. Submit a wrong flag (should not promote to admin)
3. Submit the correct flag (should promote to admin) 
4. Verify the user's role changed to 'admin'
5. Test that duplicate submissions are prevented

## Troubleshooting

### Challenge Not Appearing
```sql
-- Check if challenge exists
SELECT * FROM public.challenges WHERE title = 'Ultimate Admin Access';
```

### Role Not Changing
```sql
-- Check if trigger exists  
SELECT tgname FROM pg_trigger WHERE tgname = 'trg_final_challenge_promotion';

-- Check trigger function
SELECT proname FROM pg_proc WHERE proname = 'handle_final_challenge_promotion';
```

### Manual Testing
```sql
-- Manually test the promotion (replace with actual user ID)
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'test@example.com';
```

## Security Notes

- The flag is stored in plain text in the database (like all other flags)
- Only authenticated users can see challenges (RLS policies)
- The trigger only activates for correct submissions
- Admin promotion is irreversible through the UI (but can be changed manually)

## Best Practices

1. **Keep the flag private** until participants ask for it
2. **Make it fun** - this is about human interaction, not technical skills
3. **Document who you give it to** if you want to track social engineering attempts
4. **Consider the context** - some participants might be shy, others very bold
5. **Have fun with it** - this is the human element in your technical CTF!

---

🎉 **Congratulations on setting up the ultimate social engineering challenge!** 

The most secure systems can still be compromised through human interaction. This challenge teaches participants that sometimes the best "hack" is simply asking the right person at the right time.
