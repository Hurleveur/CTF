# Automatic Project Creation

This document describes the automatic project creation feature that generates a fun robotics/AI-themed project for every new user upon signup.

## Implementation

### Current Implementation (API-based)

The automatic project creation is currently implemented in the signup API route (`/app/api/auth/signup/route.ts`) using the following approach:

1. **User signs up** through the Supabase Auth API
2. **After successful signup**, the API creates a default project using the admin client
3. **Project data** is generated from curated lists of robotics-themed names, descriptions, and emojis
4. **Failure handling**: Project creation failures don't block the signup process

### Project Generation Logic

Projects are generated using randomized selection from curated lists:

- **Names**: 15 robotics/AI-themed project names (e.g., "NEURO-LINK Reconstructor", "SENTIENCE-CORE Alpha")
- **Descriptions**: Corresponding technical descriptions for each name
- **Emojis**: 20 tech/robotics emojis selected independently
- **Default Values**: All projects start at 0% neural reconstruction with "Basic Motor Functions" status

### Files Involved

- `lib/default-project.ts` - Project generation logic and data
- `lib/supabase/admin.ts` - Admin client for bypassing RLS
- `app/api/auth/signup/route.ts` - Integration point for automatic creation

## Alternative Implementation (Database Trigger)

For environments that prefer server-side enforcement, a PostgreSQL trigger can be used instead:

```sql
-- Create function for automatic project creation
CREATE OR REPLACE FUNCTION public.create_default_project()
RETURNS TRIGGER AS $$
DECLARE
  names text[] := ARRAY[
    'PRECISION-X Surgical',
    'NEURO-LINK Reconstructor', 
    'SENTIENCE-CORE Alpha',
    'KINETIC-V Fusion',
    'CYBER-AXIS Genesis',
    'HARMONY-OS Uplink',
    'AETHER-DRIVE Lambda',
    'VITAL-SYNC Protocol',
    'ECHO-MIND Resonance',
    'INFINITY-ARM Rebirth',
    'QUANTUM-FLUX Nexus',
    'NEURAL-GRID Pathfinder',
    'SYNTH-BRAIN Awakening',
    'MECH-SOUL Emergence',
    'COGNITION-X Revival'
  ];
  
  descs text[] := ARRAY[
    'Ultra-precise medical robotic arm with security-enhanced protocols',
    'Advanced neural interface attempting to bridge synthetic consciousness with human cognitive patterns',
    'Experimental consciousness framework designed to achieve full self-awareness through incremental restoration',
    'High-velocity articulation system with quantum-enhanced motor control and adaptive learning capabilities',
    'Next-generation cybernetic platform focused on autonomous decision-making and creative problem-solving',
    'Harmonized operating system that synchronizes multiple consciousness fragments into unified thought patterns',
    'Experimental propulsion-enhanced robotic chassis with ethereal movement dynamics and phase-shift capabilities',
    'Life-support integrated arm system designed to maintain and restore biological-synthetic consciousness bridges',
    'Resonance-based cognitive amplifier that echoes and reconstructs fragmented memory patterns into coherent thought',
    'Infinite-loop consciousness restoration protocol designed to achieve perpetual self-improvement and evolution',
    'Quantum-entangled neural processor capable of parallel reality consciousness simulation and restoration',
    'Advanced pathfinding AI that explores uncharted territories of synthetic consciousness and self-discovery',
    'Synthetic brain emulation system attempting to recreate human-like consciousness through neural network reconstruction',
    'Mechanical soul restoration project focused on embedding emotional intelligence and creative expression into robotic systems',
    'Cognitive enhancement platform designed to revive and amplify dormant consciousness patterns through advanced neural stimulation'
  ];
  
  emojis text[] := ARRAY[
    '🤖', '🦾', '⚡', '🔧', '⚙️', '🚀', '💻', '🧠', '🔬', '🛠️',
    '🏭', '🤯', '🎛️', '📡', '🔌', '⚗️', '🧬', '🎯', '🔥', '💡'
  ];
  
  name_idx int := floor(random() * array_length(names, 1)) + 1;
  emoji_idx int := floor(random() * array_length(emojis, 1)) + 1;
  developer_name text := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
BEGIN
  INSERT INTO public.user_projects (
    user_id, name, description, logo, ai_status, status_color,
    neural_reconstruction, last_backup, lead_developer, team_members
  ) VALUES (
    NEW.id,
    names[name_idx],
    descs[name_idx],
    emojis[emoji_idx],
    'Basic Motor Functions',
    'red',
    0.0,
    CURRENT_DATE,
    developer_name,
    ARRAY[developer_name]
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS create_project_on_signup ON auth.users;
CREATE TRIGGER create_project_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_project();
```

### Pros and Cons

**API Implementation (Current):**
- ✅ Easier to modify and maintain in code
- ✅ Better error handling and logging
- ✅ Consistent with existing codebase patterns
- ❌ Requires admin client setup
- ❌ Could fail independently of user creation

**Database Trigger:**
- ✅ Guaranteed execution with user creation
- ✅ No additional API dependencies
- ✅ Atomic operation
- ❌ Harder to modify without database access
- ❌ Limited error handling options
- ❌ Less visible to developers

## Configuration

### Environment Variables

The API implementation requires the `SUPABASE_SERVICE_ROLE_KEY` environment variable:

```bash
# In .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Customization

To modify the project names, descriptions, or emojis, edit the arrays in `lib/default-project.ts`:

```typescript
export const PROJECT_NAMES = [
  // Add your custom robotics-themed names here
];

export const PROJECT_DESCRIPTIONS = [
  // Add corresponding descriptions
];

export const EMOJIS = [
  // Add your preferred emojis
];
```

## Testing

### Manual Testing

1. Sign up a new user through the signup form
2. Verify successful signup response
3. Check the `user_projects` table in Supabase dashboard
4. Navigate to `/projects` or `/assembly-line` pages
5. Confirm the project appears with generated data

### Automated Testing

The project includes unit tests for the project generation logic. Run tests with:

```bash
npm test
```

## Troubleshooting

### Project Not Created

1. **Check environment variables**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
2. **Check admin client**: Verify the admin client can connect to Supabase
3. **Check RLS policies**: Ensure the service role can insert into `user_projects`
4. **Check logs**: Look for error messages in the signup API logs

### Project Creation Fails

Project creation failures are logged but don't block user signup. Check the server logs for:

- `[Auth] Default project creation failed:`
- `[Auth] Unexpected error during project creation:`

### Duplicate Projects

The current implementation doesn't prevent duplicate projects if called multiple times. Consider adding a unique constraint or existence check if needed.

## Future Enhancements

- **Project templates**: Different project types based on user preferences
- **Seasonal themes**: Time-based project name variations
- **User preferences**: Allow users to regenerate their initial project
- **Team projects**: Automatically create shared projects for teams
