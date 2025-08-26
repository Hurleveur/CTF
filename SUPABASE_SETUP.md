# Supabase Setup Instructions

This document provides step-by-step instructions to set up your Supabase project for the Robotics CTF platform.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. A Supabase project created
3. Your project URL and anon key (available in project settings)

## Environment Variables

Make sure your `.env.local` file contains:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Server-side only (DO NOT expose to client)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# NextAuth.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## Database Setup

### Step 1: Run the Schema SQL

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/schema.sql`
4. Paste and execute the SQL in the editor

This will create:
- User profiles table
- CTF challenges table
- Submissions tracking table
- Leaderboard view
- Row Level Security policies
- Database triggers for user creation

### Step 2: Configure Authentication

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable email confirmations if desired (recommended for production)
3. Configure any OAuth providers you want to support
4. Set up email templates if using email confirmation

### Step 3: Set Up Storage (Optional)

If you plan to host challenge files:

1. Go to Storage in your Supabase dashboard
2. Create a bucket called `challenge-files`
3. Set appropriate policies for file access

## Security Configuration

### Row Level Security (RLS)

The schema automatically enables RLS on all tables with appropriate policies:

- **Profiles**: Users can only modify their own profiles
- **Challenges**: Only active challenges are visible to authenticated users
- **Submissions**: Users can only see their own submissions
- **Admin Access**: Users with 'admin' role can manage challenges and view all submissions

### Environment Security

⚠️ **Important Security Notes:**

1. Never commit your `.env.local` file to version control
2. The `SUPABASE_SERVICE_ROLE_KEY` should never be exposed to the client
3. Use environment variables for all sensitive configuration
4. In production, use proper secret management

## Testing the Setup

### Create a Test User

1. Run your application: `npm run dev`
2. Go to `/login` and try to sign up with a test email
3. Check your Supabase dashboard to see if the user was created
4. Verify that a profile was automatically created in the profiles table

### Test Authentication Flow

1. Try logging in with your test user
2. Verify that protected routes are accessible when authenticated
3. Try accessing protected routes without authentication (should redirect to login)

### Test Database Operations

You can test the database setup by running queries in the Supabase SQL editor:

```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- View sample challenges
SELECT * FROM public.challenges;

-- Check if RLS policies are active
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

## Default Data

The schema includes some sample challenges for testing:
- Welcome to CTF (misc, easy, 50 points)
- Basic Web Security (web, easy, 100 points)
- Robot Assembly Code (reverse, medium, 200 points)
- Encrypted Communications (crypto, hard, 300 points)

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check that your environment variables are correct
2. **RLS blocking queries**: Ensure users are properly authenticated
3. **Profile not created**: Check the trigger function is working correctly
4. **Database connection errors**: Verify your connection string and credentials

### Debug Commands

Check your environment variables:
```bash
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Test your Supabase connection:
```javascript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
const { data, error } = await supabase.from('challenges').select('*');
console.log(data, error);
```

## Production Considerations

1. **Email Verification**: Enable email verification in production
2. **Rate Limiting**: Configure rate limiting on authentication endpoints  
3. **Backup Strategy**: Set up automated backups for your database
4. **Monitoring**: Enable logging and monitoring in Supabase
5. **SSL/HTTPS**: Ensure all connections use SSL in production

## Next Steps

After setting up the database:

1. Test all authentication flows
2. Create admin users by updating their role in the profiles table
3. Add your own CTF challenges
4. Customize the application features as needed
5. Set up monitoring and alerting

For more advanced features, refer to the Supabase documentation at https://supabase.com/docs
