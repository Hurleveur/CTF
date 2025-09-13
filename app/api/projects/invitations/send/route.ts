import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const sendInvitationSchema = z.object({
  username: z.string().min(2, 'Username must be at least 2 characters').max(50, 'Username too long'),
  projectId: z.string().uuid('Invalid project ID'),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = sendInvitationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { username, projectId } = validationResult.data;

    // Check if user is the project lead or project owner
    // First check project_members table
    const { data: membership } = await supabase
      .from('project_members')
      .select('is_lead')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();

    let isAuthorized = false;
    
    if (membership && membership.is_lead) {
      // User is marked as lead in project_members
      isAuthorized = true;
    } else {
      // Fallback: check if user owns the project in user_projects table
      const { data: project } = await supabase
        .from('user_projects')
        .select('user_id')
        .eq('id', projectId)
        .eq('user_id', user.id)
        .single();
      
      if (project) {
        // User owns the project
        isAuthorized = true;
        
        // Ensure they're also marked as lead in project_members
        const { error: insertError } = await supabase
          .from('project_members')
          .upsert({
            project_id: projectId,
            user_id: user.id,
            is_lead: true,
            joined_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.log('[Invitations] Note: Could not ensure project membership:', insertError.message);
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Only project leaders can send invitations' },
        { status: 403 }
      );
    }

    // Check if project is already full (3 members max)
    const { data: currentMembers, error: countError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (countError) {
      console.error('[Invitations] Error checking member count:', countError);
      return NextResponse.json(
        { error: 'Failed to check project capacity' },
        { status: 500 }
      );
    }

    if (currentMembers && currentMembers.length >= 3) {
      return NextResponse.json(
        { error: 'Project is full (maximum 3 members)' },
        { status: 400 }
      );
    }

    // Find the target user by username (using profiles table)
    const { data: targetProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('full_name', username)
      .single();

    if (profileError || !targetProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if target user is already in a project
    const { data: existingMembership, error: existingError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', targetProfile.id);

    if (existingError) {
      console.error('[Invitations] Error checking existing membership:', existingError);
      return NextResponse.json(
        { error: 'Failed to check user membership status' },
        { status: 500 }
      );
    }

    if (existingMembership && existingMembership.length > 0) {
      return NextResponse.json(
        { error: 'User is already a member of another project' },
        { status: 400 }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation, error: inviteCheckError } = await supabase
      .from('project_invitations')
      .select('id, accepted_at')
      .eq('project_id', projectId)
      .eq('invited_user_id', targetProfile.id);

    if (inviteCheckError) {
      console.error('[Invitations] Error checking existing invitation:', inviteCheckError);
      return NextResponse.json(
        { error: 'Failed to check existing invitations' },
        { status: 500 }
      );
    }

    if (existingInvitation && existingInvitation.length > 0) {
      const pendingInvite = existingInvitation.find(invite => !invite.accepted_at);
      if (pendingInvite) {
        return NextResponse.json(
          { error: 'Invitation already sent to this user' },
          { status: 400 }
        );
      }
    }

    // Create the invitation
    const { data: invitation, error: createError } = await supabase
      .from('project_invitations')
      .insert({
        project_id: projectId,
        invited_user_id: targetProfile.id,
        invited_by: user.id,
        invited_username: username,
      })
      .select()
      .single();

    if (createError) {
      console.error('[Invitations] Error creating invitation:', createError);
      return NextResponse.json(
        { error: 'Failed to send invitation' },
        { status: 500 }
      );
    }

    console.log('[Invitations] Successfully sent invitation:', invitation.id);

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${username}`,
      invitation: {
        id: invitation.id,
        username: username,
        createdAt: invitation.created_at,
      },
    });

  } catch (error) {
    console.error('[Invitations] Send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}