import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's invitations (both received and sent)
export async function GET(_request: NextRequest) {
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

    // Get received invitations (pending only)
    const { data: receivedInvitations, error: receivedError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        invited_username,
        created_at,
        user_projects!project_invitations_project_id_fkey (
          name,
          description,
          logo,
          lead_developer
        )
      `)
      .eq('invited_user_id', user.id)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    if (receivedError) {
      console.error('[Invitations] Error fetching received invitations:', receivedError);
      return NextResponse.json(
        { error: 'Failed to fetch invitations' },
        { status: 500 }
      );
    }

    // Get sent invitations (for project leads)
    const { data: sentInvitations, error: sentError } = await supabase
      .from('project_invitations')
      .select(`
        id,
        project_id,
        invited_username,
        created_at,
        accepted_at,
        user_projects!project_invitations_project_id_fkey (
          name,
          description,
          logo
        )
      `)
      .eq('invited_by', user.id)
      .order('created_at', { ascending: false });

    if (sentError) {
      console.error('[Invitations] Error fetching sent invitations:', sentError);
      return NextResponse.json(
        { error: 'Failed to fetch sent invitations' },
        { status: 500 }
      );
    }

    // Transform the data for easier frontend consumption
    const transformedReceived = receivedInvitations?.map(invite => {
      const projectData = invite as typeof invite & {
        user_projects?: {
          name?: string;
          description?: string;
          logo?: string;
          lead_developer?: string;
        };
      };
      return {
        id: invite.id,
        projectId: invite.project_id,
        projectName: projectData.user_projects?.name || 'Unknown Project',
        projectDescription: projectData.user_projects?.description || '',
        projectLogo: projectData.user_projects?.logo || '🤖',
        projectLead: projectData.user_projects?.lead_developer || 'Unknown',
        createdAt: invite.created_at,
        type: 'received'
      };
    }) || [];

    const transformedSent = sentInvitations?.map(invite => {
      const projectData = invite as typeof invite & {
        user_projects?: {
          name?: string;
          logo?: string;
        };
      };
      return {
        id: invite.id,
        projectId: invite.project_id,
        projectName: projectData.user_projects?.name || 'Unknown Project',
        projectLogo: projectData.user_projects?.logo || '🤖',
        username: invite.invited_username,
        createdAt: invite.created_at,
        accepted: !!invite.accepted_at,
        acceptedAt: invite.accepted_at,
        type: 'sent'
      };
    }) || [];

    console.log(`[Invitations] Retrieved ${transformedReceived.length} received and ${transformedSent.length} sent invitations for user:`, user.id);

    return NextResponse.json({
      success: true,
      invitations: {
        received: transformedReceived,
        sent: transformedSent,
      },
    });

  } catch (error) {
    console.error('[Invitations] Get error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}