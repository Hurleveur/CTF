-- Simple script to ensure all existing projects have proper team member records
-- This can be run safely multiple times (uses ON CONFLICT DO NOTHING)

-- Insert missing project_members records for all projects
INSERT INTO project_members (project_id, user_id, is_lead, joined_at)
SELECT 
    up.id as project_id,
    up.user_id,
    TRUE as is_lead,
    up.created_at as joined_at
FROM user_projects up
LEFT JOIN project_members pm ON up.id = pm.project_id AND pm.user_id = up.user_id
WHERE pm.id IS NULL  -- Only projects without existing member records
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Update lead_developer field where it's missing
UPDATE user_projects 
SET lead_developer = COALESCE(p.full_name, p.email, 'Unknown Developer'),
    updated_at = NOW()
FROM profiles p
WHERE user_projects.user_id = p.id
  AND (user_projects.lead_developer IS NULL 
       OR user_projects.lead_developer = '' 
       OR user_projects.lead_developer = 'Unknown');

-- Verify results
SELECT 
    'Projects fixed' as status,
    COUNT(*) as total_projects,
    COUNT(pm.id) as projects_with_members,
    COUNT(*) - COUNT(pm.id) as projects_still_missing_members
FROM user_projects up
LEFT JOIN project_members pm ON up.id = pm.project_id AND pm.user_id = up.user_id;