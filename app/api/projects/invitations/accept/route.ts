import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const acceptInvitationSchema = z.object({
  invitationId: z.string().uuid('Invalid invitation ID'),
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
    const validationResult = acceptInvitationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { invitationId } = validationResult.data;

    // Use the Postgres function to handle the complex transaction
    const { data: result, error: functionError } = await supabase
      .rpc('accept_project_invitation', { 
        invitation_uuid: invitationId 
      });

    if (functionError) {
      console.error('[Invitations] Function error:', functionError);
      return NextResponse.json(
        { error: 'Failed to accept invitation' },
        { status: 500 }
      );
    }

    if (!result.success) {
      console.error('[Invitations] Accept failed:', result.error);
      
      // Map specific errors to appropriate HTTP status codes
      let statusCode = 400;
      if (result.error.includes('not found')) {
        statusCode = 404;
      } else if (result.error.includes('already a member')) {
        statusCode = 409; // Conflict
      } else if (result.error.includes('full')) {
        statusCode = 409; // Conflict
      }
      
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    console.log('[Invitations] Successfully accepted invitation:', invitationId);

    // Transform the project data for consistency with frontend interface
    const project = result.project;
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      logo: project.logo,
      aiStatus: project.ai_status,
      statusColor: project.status_color,
      neuralReconstruction: parseFloat(project.neural_reconstruction || '0'),
      lastBackup: project.last_backup,
      leadDeveloper: project.lead_developer,
      teamMembers: project.team_members || [],
      userId: project.user_id,
    };

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the project!',
      project: transformedProject,
    });

  } catch (error) {
    console.error('[Invitations] Accept error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}