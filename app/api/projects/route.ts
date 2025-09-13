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
export async function GET() {
  console.log('[Projects] GET request received');
  
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.log('[Projects] Authentication failed:', userError?.message);
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    console.log('[Projects] User authenticated:', user.id);

    // Fetch user's projects with team member information
    // Use only the base project_members table (removed problematic view)
    let projects, error;
    
    console.log('[Projects] Fetching projects with base table approach...');
    
    // Step 1: Get the user's projects
    const { data: userProjects, error: projectsError } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    console.log('[Projects] Basic query result:', { data: userProjects, error: projectsError?.message });
    
    if (projectsError) {
      error = projectsError;
      projects = null;
    } else {
      console.log('[Projects] Fetching project members from base table...');
      // Step 2: Fetch project members for each project using base table only
      projects = await Promise.all(
        (userProjects || []).map(async (project) => {
          const { data: members } = await supabase
            .from('project_members')
            .select(`
              user_id,
              is_lead,
              joined_at
            `)
            .eq('project_id', project.id);
          
          // Step 3: Fetch profile information for each member separately
          const projectMembers = await Promise.all(
            (members || []).map(async (member) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', member.user_id)
                .single();
              
              return {
                user_id: member.user_id,
                is_lead: member.is_lead,
                joined_at: member.joined_at,
                profiles: profile || { full_name: null, email: null }
              };
            })
          );
          
          console.log(`[Projects] Project ${project.id} members:`, projectMembers.length);
          
          return {
            ...project,
            project_members: projectMembers
          };
        })
      );
      error = null;
      console.log('[Projects] Projects fetched successfully:', projects?.length);
    }

    if (error) {
      console.error('[Projects] Fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Transform database format to frontend format with team member details
    const transformedProjects = projects?.map(project => {
      // Transform project_members into detailed team member objects
      const teamMembers = project.project_members?.map((member: { 
        user_id: string;
        profiles?: { full_name?: string; email?: string };
        is_lead: boolean;
        joined_at: string;
      }) => ({
        id: member.user_id,
        name: member.profiles?.full_name || member.profiles?.email || 'Unknown',
        email: member.profiles?.email,
        isLead: member.is_lead,
        joinedAt: member.joined_at,
      })).sort((a: { isLead: boolean; joinedAt: string }, b: { isLead: boolean; joinedAt: string }) => {
        // Sort by lead first, then by join date
        if (a.isLead && !b.isLead) return -1;
        if (!a.isLead && b.isLead) return 1;
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      }) || [];
      
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        logo: project.logo,
        aiStatus: project.ai_status,
        statusColor: project.status_color,
        neuralReconstruction: parseFloat(project.neural_reconstruction || '0'),
        lastBackup: project.last_backup,
        leadDeveloper: project.lead_developer,
        teamMembers: project.team_members || [], // Keep legacy array for backwards compatibility
        teamMemberDetails: teamMembers, // New detailed team member info
        userId: project.user_id,
        aiActivated: project.ai_activated || false,
        aiActivatedAt: project.ai_activated_at,
      };
    }) || [];

    console.log('[Projects] Transformed projects:', transformedProjects.length, 'projects');

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

    // Check if user already has a project (via project_members table for consistency)
    const { data: existingMembership, error: checkError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .limit(1);

    if (checkError) {
      console.error('[Projects] Check existing error:', checkError.message);
      return NextResponse.json(
        { error: 'Failed to check existing projects' },
        { status: 500 }
      );
    }

    if (existingMembership && existingMembership.length > 0) {
      return NextResponse.json(
        { error: 'You can only have one project at a time. Please leave your current project first.' },
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

    // Insert project into database (project_members will be populated automatically by trigger)
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
        team_members: [leadDeveloperName], // Will be kept in sync by trigger
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
