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
- `project_members` - Project membership with lead designation (NEW)
- `project_invitations` - Project invitation system (NEW)

## Detailed Table Structures

### user_projects Table

Stores user robotics projects with detailed configuration and progress tracking.

```sql
CREATE TABLE IF NOT EXISTS public.user_projects (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  logo TEXT NOT NULL DEFAULT '🤖',
  ai_status TEXT NOT NULL DEFAULT 'Basic Motor Functions' 
    CHECK (ai_status IN (
      'Basic Motor Functions', 
      'Advanced Cognitive Patterns', 
      'Self-Awareness Protocols', 
      'Full AI Consciousness'
    )),
  status_color TEXT NOT NULL DEFAULT 'red' 
    CHECK (status_color IN ('red', 'yellow', 'orange', 'green')),
  neural_reconstruction DECIMAL(5,2) DEFAULT 0.0 
    CHECK (neural_reconstruction >= 0 AND neural_reconstruction <= 100),
  last_backup DATE DEFAULT CURRENT_DATE,
  lead_developer TEXT,
  team_members TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

**Row Level Security (RLS) Policies:**
- Users can view, insert, update, and delete their own projects
- Authenticated users can view all projects (for leaderboard functionality)
- Admins can view all projects

**API Integration:**
- Frontend uses `/api/user/projects` for CRUD operations
- All project data stored in database (no localStorage usage)
- Proper field mapping between frontend interface and database columns

**Field Mapping (Frontend ↔ Database):**
- `id` ↔ `id` (UUID)
- `name` ↔ `name`
- `description` ↔ `description`
- `logo` ↔ `logo`
- `aiStatus` ↔ `ai_status`
- `statusColor` ↔ `status_color`
- `neuralReconstruction` ↔ `neural_reconstruction` (DECIMAL)
- `lastBackup` ↔ `last_backup`
- `leadDeveloper` ↔ `lead_developer`
- `teamMembers` ↔ `team_members` (PostgreSQL TEXT[] - synced automatically)
- `teamMemberDetails` ↔ joined from `project_members` table (NEW)
- `userId` ↔ `user_id`

## Project Team Management (NEW)

### Database Tables

#### project_members Table
Stores normalized project membership with leadership designation:

```sql
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_lead BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_membership UNIQUE (project_id, user_id),
  CONSTRAINT one_project_per_user UNIQUE (user_id), -- Each user can only be in one project
  CONSTRAINT one_lead_per_project EXCLUDE (project_id WITH =) WHERE (is_lead = TRUE)
);
```

#### project_invitations Table
Stores project invitations with acceptance tracking:

```sql
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT unique_pending_invitation UNIQUE (project_id, invited_user_id)
);
```

### Key Features
- **Max 3 members per project** - Enforced by database constraints
- **One project per user** - Users can only be in one project at a time
- **Automatic sync** - `team_members` array kept in sync via triggers
- **Secure RLS** - Row-level security for all operations
- **Lead-only invitations** - Only project leads can invite members
- **Atomic operations** - Invitation acceptance uses Postgres functions

### API Endpoints

#### Team Management
- `POST /api/projects/invitations/send` - Send invitation by username
- `POST /api/projects/invitations/accept` - Accept received invitation
- `GET /api/projects/invitations` - Get user's invitations (sent/received)
- `POST /api/projects/leave` - Leave current project (non-leads only)

#### Enhanced Project Endpoints
- `GET /api/projects` - Now returns detailed team member information
- `POST /api/projects` - Creates project with automatic membership

### Row-Level Security Policies

**project_members:**
- Users can view members of projects they belong to
- System functions handle membership changes

**project_invitations:**
- Users can view invitations they sent or received
- Project leads can create/delete invitations for their projects
- Invited users can accept their own invitations

**user_projects (Updated):**
- Team members can view/update projects they belong to
- All authenticated users can view all projects (leaderboard)
- Project leads can delete their projects
