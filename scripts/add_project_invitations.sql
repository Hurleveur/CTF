-- Project Invitations and Team Membership Schema
-- Run this in Supabase SQL Editor to add invitation functionality

-- 1. Create project invitations table
CREATE TABLE IF NOT EXISTS public.project_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_username TEXT NOT NULL, -- Cache for easier querying
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  CONSTRAINT unique_pending_invitation UNIQUE (project_id, invited_user_id) DEFERRABLE INITIALLY DEFERRED
);

-- 2. Add project membership table for normalized many-to-many relationship
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.user_projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_lead BOOLEAN DEFAULT FALSE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_membership UNIQUE (project_id, user_id),
  CONSTRAINT one_lead_per_project EXCLUDE (project_id WITH =) WHERE (is_lead = TRUE)
);

-- 3. Ensure each user can only be in one project at a time
-- Add unique constraint on user_id for project_members
ALTER TABLE public.project_members 
ADD CONSTRAINT one_project_per_user UNIQUE (user_id);

-- 4. Add max 3 members constraint
ALTER TABLE public.project_members 
ADD CONSTRAINT max_three_members_check CHECK (
  (SELECT COUNT(*) FROM public.project_members WHERE project_id = project_members.project_id) <= 3
);

-- 5. Row Level Security Policies for project_invitations
ALTER TABLE public.project_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view their own invitations (invited or sent)
CREATE POLICY "Users can view own invitations" ON public.project_invitations
  FOR SELECT USING (
    invited_user_id = auth.uid() OR 
    invited_by = auth.uid()
  );

-- Project leads can create invitations for their projects
CREATE POLICY "Project leads can create invitations" ON public.project_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

-- Invited users can accept invitations (update accepted_at)
CREATE POLICY "Users can accept own invitations" ON public.project_invitations
  FOR UPDATE USING (invited_user_id = auth.uid())
  WITH CHECK (invited_user_id = auth.uid());

-- Project leads can delete their project invitations
CREATE POLICY "Project leads can delete invitations" ON public.project_invitations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = project_invitations.project_id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

-- 6. Row Level Security Policies for project_members
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of their project
CREATE POLICY "Users can view project members" ON public.project_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.project_members pm2
      WHERE pm2.project_id = project_members.project_id
      AND pm2.user_id = auth.uid()
    )
  );

-- System can insert members (handled by functions)
CREATE POLICY "System can manage members" ON public.project_members
  FOR ALL USING (TRUE)
  WITH CHECK (TRUE);

-- 7. Update user_projects RLS to allow team members access
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Authenticated users can view all projects" ON public.user_projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON public.user_projects;

-- Create new policies for team-based access
CREATE POLICY "Users can view projects they're members of" ON public.user_projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
    ) OR
    -- Keep admin access
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.role IN ('admin', 'dev')
    )
  );

-- All authenticated users can view all projects (for leaderboard)
CREATE POLICY "All users can view all projects for leaderboard" ON public.user_projects
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Users can insert projects (they become lead automatically)
CREATE POLICY "Users can create projects" ON public.user_projects
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Project members can update their project
CREATE POLICY "Project members can update project" ON public.user_projects
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
    )
  );

-- Project leads can delete their project
CREATE POLICY "Project leads can delete project" ON public.user_projects
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.project_members pm
      WHERE pm.project_id = user_projects.id
      AND pm.user_id = auth.uid()
      AND pm.is_lead = TRUE
    )
  );

-- 8. Function to sync team_members array when membership changes
CREATE OR REPLACE FUNCTION sync_team_members()
RETURNS TRIGGER AS $$
DECLARE
  project_uuid UUID;
  members_array TEXT[];
BEGIN
  -- Determine which project_id to sync based on trigger operation
  IF TG_OP = 'DELETE' THEN
    project_uuid := OLD.project_id;
  ELSE
    project_uuid := NEW.project_id;
  END IF;

  -- Build the team_members array from project_members table
  SELECT ARRAY_AGG(
    CASE 
      WHEN pm.is_lead THEN p.full_name || ' (Lead)'
      ELSE p.full_name
    END
    ORDER BY pm.is_lead DESC, pm.joined_at ASC
  ) INTO members_array
  FROM public.project_members pm
  JOIN public.profiles p ON pm.user_id = p.id
  WHERE pm.project_id = project_uuid;

  -- Update the user_projects table
  UPDATE public.user_projects
  SET team_members = COALESCE(members_array, ARRAY[]::TEXT[])
  WHERE id = project_uuid;

  -- Return appropriate value based on trigger operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Triggers to automatically sync team_members array
CREATE TRIGGER sync_team_members_on_insert
  AFTER INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

CREATE TRIGGER sync_team_members_on_update
  AFTER UPDATE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

CREATE TRIGGER sync_team_members_on_delete
  AFTER DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION sync_team_members();

-- 10. Function to handle invitation acceptance
CREATE OR REPLACE FUNCTION accept_project_invitation(invitation_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  invite_row public.project_invitations%ROWTYPE;
  project_row public.user_projects%ROWTYPE;
  member_count INTEGER;
  result JSONB;
BEGIN
  -- Get the invitation details
  SELECT * INTO invite_row
  FROM public.project_invitations
  WHERE id = invitation_uuid
  AND invited_user_id = auth.uid()
  AND accepted_at IS NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or already accepted');
  END IF;

  -- Check if user is already in a project
  IF EXISTS (SELECT 1 FROM public.project_members WHERE user_id = auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are already a member of another project');
  END IF;

  -- Check if project is full
  SELECT COUNT(*) INTO member_count
  FROM public.project_members
  WHERE project_id = invite_row.project_id;

  IF member_count >= 3 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project is full (maximum 3 members)');
  END IF;

  -- Accept the invitation (transaction will handle atomicity)
  BEGIN
    -- Mark invitation as accepted
    UPDATE public.project_invitations
    SET accepted_at = now()
    WHERE id = invitation_uuid;

    -- Add user to project
    INSERT INTO public.project_members (project_id, user_id, is_lead)
    VALUES (invite_row.project_id, auth.uid(), FALSE);

    -- Get updated project data
    SELECT * INTO project_row
    FROM public.user_projects
    WHERE id = invite_row.project_id;

    result := jsonb_build_object(
      'success', true,
      'project', row_to_json(project_row)
    );

    RETURN result;

  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to accept invitation: ' || SQLERRM);
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to handle leaving project
CREATE OR REPLACE FUNCTION leave_project()
RETURNS JSONB AS $$
DECLARE
  member_row public.project_members%ROWTYPE;
  remaining_members INTEGER;
BEGIN
  -- Get current user's membership
  SELECT * INTO member_row
  FROM public.project_members
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not a member of any project');
  END IF;

  -- Check if user is the lead
  IF member_row.is_lead THEN
    -- Count remaining members
    SELECT COUNT(*) INTO remaining_members
    FROM public.project_members
    WHERE project_id = member_row.project_id
    AND user_id != auth.uid();

    IF remaining_members > 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Project leaders cannot leave while other members remain. Transfer leadership first.');
    END IF;
  END IF;

  -- Remove user from project
  DELETE FROM public.project_members
  WHERE user_id = auth.uid();

  RETURN jsonb_build_object('success', true, 'message', 'Successfully left the project');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', 'Failed to leave project: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Populate project_members for existing projects
INSERT INTO public.project_members (project_id, user_id, is_lead, joined_at)
SELECT id, user_id, TRUE, created_at
FROM public.user_projects
ON CONFLICT (project_id, user_id) DO NOTHING;

COMMENT ON TABLE public.project_invitations IS 'Stores project invitations sent to users';
COMMENT ON TABLE public.project_members IS 'Stores project membership with lead designation';
COMMENT ON FUNCTION accept_project_invitation IS 'Handles invitation acceptance with proper validation';
COMMENT ON FUNCTION leave_project IS 'Handles user leaving their current project';
COMMENT ON FUNCTION sync_team_members IS 'Keeps team_members array in sync with project_members table';