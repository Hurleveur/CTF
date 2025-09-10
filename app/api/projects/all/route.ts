import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    // Allow public access to view all projects for leaderboard
    // Check authentication to determine filtering behavior
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get the challenge cutoff date for filtering
    const { data: settingsData } = await supabase
      .from('admin_settings')
      .select('challenge_cutoff_date')
      .eq('key', 'challenge_cutoff_date')
      .single();
    
    const cutoffDate = settingsData?.challenge_cutoff_date || process.env.CHALLENGE_CUTOFF_DATE || '2025-01-01T00:00:00Z';
    console.log('[Projects/All] Using cutoff date for filtering:', cutoffDate);

    // Fetch all projects from all users
    // Apply cutoff date filter, but always show projects owned by current user (if authenticated)
    let projectsQuery = supabase
      .from('user_projects')
      .select('*')
      .order('neural_reconstruction', { ascending: false })
      .order('created_at', { ascending: true });
    
    // Apply cutoff date filter - show projects created after cutoff, OR projects owned by current user
    if (user) {
      projectsQuery = projectsQuery.or(`created_at.gte.${cutoffDate},user_id.eq.${user.id}`);
    } else {
      // For non-authenticated users, only show projects after cutoff
      projectsQuery = projectsQuery.gte('created_at', cutoffDate);
    }
    
    const { data: allUserProjects, error } = await projectsQuery;

    if (error) {
      console.error('[Projects/All] Fetch projects error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch all projects' },
        { status: 500 }
      );
    }

    // Fetch profile information for all users who have projects
    const userIds = allUserProjects?.map(project => project.user_id) || [];
    const { data: userProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('[Projects/All] Fetch profiles error:', profilesError.message);
      // Continue without profile data rather than failing completely
    }

    // Default projects that are always shown
    const defaultProjects = [
      {
        id: 1,
        name: 'PRECISION-X Surgical',
        logo: '⚡',
        description: 'Ultra-precise medical robotic arm with security-enhanced protocols',
        aiStatus: 'Self-Awareness Protocols',
        statusColor: 'orange' as const,
        neuralReconstruction: 0,
        lastBackup: '2025-01-18',
        leadDeveloper: 'Patrick Star',
        teamMembers: ['Patrick Star', 'Dr. Sarah Chen'],
        isDefault: true
      }
    ];

    // Create a lookup map for profiles
    const profileMap = new Map();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Transform database projects to frontend format
    const transformedUserProjects = allUserProjects?.map((project, index) => {
      const userProfile = profileMap.get(project.user_id);
      return {
        id: 1000 + index, // Start user projects from ID 1000 to avoid conflicts
        name: project.name,
        description: project.description,
        logo: project.logo,
        aiStatus: project.ai_status,
        statusColor: project.status_color,
        neuralReconstruction: parseFloat(project.neural_reconstruction || '0'),
        lastBackup: project.last_backup,
        leadDeveloper: project.lead_developer || userProfile?.full_name || userProfile?.email || 'Unknown Developer',
        teamMembers: project.team_members || [],
        isDefault: false,
        userId: project.user_id
      };
    }) || [];

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
