# Database Management

## Simple Setup

This project uses an **online-first** approach with Supabase:

### Files Structure
```
supabase/
├── config.toml          # Local development configuration
├── schema.sql           # Reference schema for local development
└── README.md           # This file

scripts/
└── add_signup_flag.sql  # Example one-time script
```

### How to Make Database Changes

1. **For Online Database (Production):**
   - Go to your Supabase Dashboard → SQL Editor
   - Write and run your SQL directly
   - Changes are immediately live

2. **For Local Development:**
   - Start local Supabase: `npx supabase start`
   - Use the local dashboard or run SQL scripts
   - Local data is separate from production

### Adding New Features

**Example: Adding a new challenge flag**
1. Create a script in `scripts/` folder (see `add_signup_flag.sql`)
2. Run it in your Supabase Dashboard
3. Test in your application

### Key Benefits
- ✅ Simple and straightforward
- ✅ Online database is single source of truth
- ✅ No migration conflicts
- ✅ Fast development cycle
- ✅ Easy to understand

### Current Database Schema
- `profiles` - User profiles extending auth.users
- `challenges` - CTF challenge definitions
- `submissions` - User flag submissions and scoring
- `user_projects` - User robotic arm projects with progress
- `leaderboard` - View of user scores and rankings
