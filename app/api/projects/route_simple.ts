import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Simple GET - Fetch user's projects without complex relationships
export async function GET() {
  console.log('[Projects] Simple GET request received');
  
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

    // Fetch user's projects with a simple query first
    console.log('[Projects] Fetching projects with simple query...');
    const { data: projects, error } = await supabase
      .from('user_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('[Projects] Simple query result:', { data: projects, error: error?.message });

    if (error) {
      console.error('[Projects] Fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }

    // Transform to frontend format (simplified - no team members for now)
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
      teamMemberDetails: [], // Empty for now - skip complex relationships
      userId: project.user_id,
      aiActivated: project.ai_activated || false,
      aiActivatedAt: project.ai_activated_at,
    })) || [];

    console.log('[Projects] Transformed projects:', transformedProjects.length, 'projects');

    return NextResponse.json({
      message: 'Projects fetched successfully',
      projects: transformedProjects,
    });

  } catch (error) {
    console.error('[Projects] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
