import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user (more secure than getSession)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Fetch user's projects from database
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' }, 
        { status: 500 }
      );
    }

    // Transform database format to frontend format
    const transformedProjects = projects.map((project, index) => ({
      id: project.id ? 1000 + index : index, // Use database UUID or fallback to index
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
    }));

    return NextResponse.json(transformedProjects);
    
  } catch (error) {
    console.error('Unexpected error in GET /api/user/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user (more secure than getSession)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, logo, description, aiStatus, statusColor, neuralReconstruction, leadDeveloper, teamMembers } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Project name is required' }, 
        { status: 400 }
      );
    }

    // Check if project name already exists
    const { data: existingProject, error: nameCheckError } = await supabase
      .from('user_projects')
      .select('id, name')
      .eq('name', name)
      .limit(1);

    if (nameCheckError) {
      console.error('Error checking project name uniqueness:', nameCheckError);
      return NextResponse.json(
        { error: 'Failed to validate project name' }, 
        { status: 500 }
      );
    }

    if (existingProject && existingProject.length > 0) {
      return NextResponse.json(
        { error: `Project name "${name}" is already taken. Please choose a different name.` }, 
        { status: 400 }
      );
    }

    // Insert new project
    const { data: project, error } = await supabase
      .from('user_projects')
      .insert({
        user_id: user.id,
        name,
        logo: logo || '🤖',
        description: description || '',
        ai_status: aiStatus || 'Basic Motor Functions',
        status_color: statusColor || 'red',
        neural_reconstruction: neuralReconstruction || 0.0,
        lead_developer: leadDeveloper,
        team_members: teamMembers || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project' }, 
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

    return NextResponse.json(transformedProject, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/user/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
