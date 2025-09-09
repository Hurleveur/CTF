import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, logo, description, aiStatus, statusColor, neuralReconstruction, leadDeveloper, teamMembers } = body;

    // Update project (RLS will ensure user can only update their own projects)
    const { data: project, error } = await supabase
      .from('user_projects')
      .update({
        ...(name !== undefined && { name }),
        ...(logo !== undefined && { logo }),
        ...(description !== undefined && { description }),
        ...(aiStatus !== undefined && { ai_status: aiStatus }),
        ...(statusColor !== undefined && { status_color: statusColor }),
        ...(neuralReconstruction !== undefined && { neural_reconstruction: neuralReconstruction }),
        ...(leadDeveloper !== undefined && { lead_developer: leadDeveloper }),
        ...(teamMembers !== undefined && { team_members: teamMembers })
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating project:', error);
      if (error.code === 'PGRST116') { // No rows returned
        return NextResponse.json(
          { error: 'Project not found or unauthorized' }, 
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update project' }, 
        { status: 500 }
      );
    }

    // Transform to frontend format
    const transformedProject = {
      id: project.id,
      name: project.name,
      logo: project.logo,
      description: project.description,
      aiStatus: project.ai_status,
      statusColor: project.status_color as 'red' | 'yellow' | 'orange' | 'green',
      neuralReconstruction: parseFloat(project.neural_reconstruction?.toString() || '0'),
      lastBackup: project.last_backup,
      leadDeveloper: project.lead_developer,
      teamMembers: project.team_members || [],
      userId: project.user_id
    };

    return NextResponse.json(transformedProject);
    
  } catch (error) {
    console.error('Unexpected error in PUT /api/user/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get current user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Delete project (RLS will ensure user can only delete their own projects)
    const { error } = await supabase
      .from('user_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting project:', error);
      return NextResponse.json(
        { error: 'Failed to delete project' }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Unexpected error in DELETE /api/user/projects/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
