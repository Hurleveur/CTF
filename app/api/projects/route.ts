import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Project name too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  logo: z.string().min(1, 'Logo is required'),
  aiStatus: z.enum(['Basic Motor Functions', 'Advanced Cognitive Patterns', 'Self-Awareness Protocols', 'Full AI Consciousness']),
  statusColor: z.enum(['red', 'yellow', 'orange', 'green']),
  neuralReconstruction: z.number().min(0).max(100),
  lastBackup: z.string(),
  leadDeveloper: z.string().optional(),
  teamMembers: z.array(z.string()).optional(),
});

// GET - Fetch user's projects
export async function GET(_: Request) {
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

    // Fetch user's projects
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Projects] Fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Transform database format to frontend format
    const transformedProjects = projects?.map(project => ({
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
    })) || [];

    return NextResponse.json({
      message: 'Projects fetched successfully',
      projects: transformedProjects,
    });

  } catch (error) {
    console.error('[Projects] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const projectData = validationResult.data;
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user already has a project
    const { data: existingProjects, error: checkError } = await supabase
      .from('user_projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (checkError) {
      console.error('[Projects] Check existing error:', checkError.message);
      return NextResponse.json(
        { error: 'Failed to check existing projects' },
        { status: 500 }
      );
    }

    if (existingProjects && existingProjects.length > 0) {
      return NextResponse.json(
        { error: 'You can only have one project at a time. Please delete your existing project first.' },
        { status: 400 }
      );
    }

    // Get user's profile information for lead developer name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const leadDeveloperName = profile?.full_name || user.email || 'Unknown Developer';

    // Insert project into database
    const { data: project, error } = await supabase
      .from('user_projects')
      .insert({
        user_id: user.id,
        name: projectData.name,
        description: projectData.description,
        logo: projectData.logo,
        ai_status: projectData.aiStatus,
        status_color: projectData.statusColor,
        neural_reconstruction: projectData.neuralReconstruction,
        last_backup: projectData.lastBackup,
        lead_developer: leadDeveloperName,
        team_members: [leadDeveloperName],
      })
      .select()
      .single();

    if (error) {
      console.error('[Projects] Insert error:', error.message);
      return NextResponse.json(
        { error: 'Failed to create project' },
        { status: 500 }
      );
    }

    // Transform database format to frontend format
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
      message: 'Project created successfully',
      project: transformedProject,
    });

  } catch (error) {
    console.error('[Projects] POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
