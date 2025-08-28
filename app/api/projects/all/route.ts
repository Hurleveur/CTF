import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated to view all projects
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch all projects from all users
    const { data: allUserProjects, error } = await supabase
      .from('user_projects')
      .select(`
        *,
        profiles!user_projects_user_id_fkey(full_name, email)
      `)
      .order('neural_reconstruction', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Projects/All] Fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch all projects' },
        { status: 500 }
      );
    }

    // Default projects that are always shown
    const defaultProjects = [
      {
        id: 1,
        name: 'NEXUS-7 Prototype',
        logo: '🦾',
        description: 'Advanced neural interface robotic arm with consciousness algorithms',
        aiStatus: 'Basic Motor Functions',
        statusColor: 'red' as const,
        neuralReconstruction: 23.4,
        lastBackup: '2025-01-15',
        leadDeveloper: 'Dr. Sarah Chen',
        teamMembers: ['Dr. Sarah Chen'],
        isDefault: true
      },
      {
        id: 2,
        name: 'TITAN-3 Assembly Unit',
        logo: '🤖',
        description: 'Heavy-duty industrial manipulation arm with neural network integration',
        aiStatus: 'Advanced Cognitive Patterns',
        statusColor: 'yellow' as const,
        neuralReconstruction: 67.1,
        lastBackup: '2025-01-10',
        leadDeveloper: 'Alexandre De Groodt',
        teamMembers: ['Alexandre De Groodt', 'Dr. Sarah Chen'],
        isDefault: true
      },
      {
        id: 3,
        name: 'PRECISION-X Surgical',
        logo: '⚡',
        description: 'Ultra-precise medical robotic arm with security-enhanced protocols',
        aiStatus: 'Self-Awareness Protocols',
        statusColor: 'orange' as const,
        neuralReconstruction: 45.8,
        lastBackup: '2025-01-18',
        leadDeveloper: 'Patrick Star',
        teamMembers: ['Patrick Star', 'Dr. Sarah Chen'],
        isDefault: true
      }
    ];

    // Transform database projects to frontend format
    const transformedUserProjects = allUserProjects?.map((project, index) => ({
      id: 1000 + index, // Start user projects from ID 1000 to avoid conflicts
      name: project.name,
      description: project.description,
      logo: project.logo,
      aiStatus: project.ai_status,
      statusColor: project.status_color,
      neuralReconstruction: parseFloat(project.neural_reconstruction || '0'),
      lastBackup: project.last_backup,
      leadDeveloper: project.lead_developer || project.profiles?.full_name || project.profiles?.email || 'Unknown',
      teamMembers: project.team_members || [],
      isDefault: false,
      userId: project.user_id
    })) || [];

    // Combine default projects with all user projects, sorted by neural reconstruction
    const allProjects = [...defaultProjects, ...transformedUserProjects]
      .sort((a, b) => b.neuralReconstruction - a.neuralReconstruction);

    return NextResponse.json({
      message: 'All projects fetched successfully',
      projects: allProjects,
      stats: {
        totalProjects: allProjects.length,
        userProjects: transformedUserProjects.length,
        defaultProjects: defaultProjects.length,
        averageProgress: allProjects.length > 0 
          ? (allProjects.reduce((sum, p) => sum + p.neuralReconstruction, 0) / allProjects.length).toFixed(1)
          : '0.0'
      }
    });

  } catch (error) {
    console.error('[Projects/All] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
