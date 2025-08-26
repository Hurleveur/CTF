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
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch user's projects
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', session.user.id)
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
    const supabase = createClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Insert project into database
    const { data: project, error } = await supabase
      .from('user_projects')
      .insert({
        user_id: session.user.id,
        name: projectData.name,
        description: projectData.description,
        logo: projectData.logo,
        ai_status: projectData.aiStatus,
        status_color: projectData.statusColor,
        neural_reconstruction: projectData.neuralReconstruction,
        last_backup: projectData.lastBackup,
        lead_developer: projectData.leadDeveloper || null,
        team_members: projectData.teamMembers || [],
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
