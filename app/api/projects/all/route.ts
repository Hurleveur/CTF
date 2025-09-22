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
        teamMemberDetails: [
          {
            id: 'patrick-star',
            name: 'Patrick Star',
            email: 'patrick@precision-x.com',
            isLead: true,
            joinedAt: '2025-01-18T00:00:00Z',
          },
          {
            id: 'sarah-chen',
            name: 'Dr. Sarah Chen',
            email: 'sarah.chen@precision-x.com',
            isLead: false,
            joinedAt: '2025-01-18T02:00:00Z',
          }
        ],
        isDefault: true,
        aiActivated: false,
        aiActivatedAt: null
      }
    ];

    // Create a lookup map for profiles
    const profileMap = new Map<string, { id: string; full_name: string; email: string }>();
    if (userProfiles) {
      userProfiles.forEach(profile => {
        profileMap.set(profile.id, profile);
      });
    }

    // Transform database projects to frontend format
    const transformedUserProjects: Array<{
      id: number;
      name: string;
      description: string;
      logo: string;
      aiStatus: string;
      statusColor: string;
      neuralReconstruction: number;
      lastBackup: string;
      leadDeveloper: string;
      teamMembers: string[];
      teamMemberDetails: Array<{
        id: string;
        name: string;
        email: string;
        isLead: boolean;
        joinedAt: string;
      }>;
      isDefault: boolean;
      userId: string;
      aiActivated: boolean;
      aiActivatedAt: string | null;
    }> = [];
    
    if (allUserProjects) {
      for (const [index, project] of allUserProjects.entries()) {
        const userProfile = profileMap.get(project.user_id);
        
        // Fetch team member details for this project
        const { data: membersData } = await supabase
          .from('project_members')
          .select(`
            user_id,
            is_lead,
            joined_at,
            profiles(
              id,
              full_name,
              email
            )
          `)
          .eq('project_id', project.id);
        
        // Transform team member data
        const teamMemberDetails = membersData?.map(member => {
          // Type-safe access to the nested profiles
          const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
          const profileData = profile as { id: string; full_name: string; email: string } | null | undefined;
          return {
            id: member.user_id,
            name: profileData?.full_name || profileData?.email || 'Anonymous',
            email: profileData?.email || '',
            isLead: member.is_lead,
            joinedAt: member.joined_at,
          };
        }).sort((a, b) => {
          // Sort by lead first, then by join date
          if (a.isLead && !b.isLead) return -1;
          if (!a.isLead && b.isLead) return 1;
          return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
        }) || [];
        
        transformedUserProjects.push({
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
          teamMemberDetails: teamMemberDetails,
          isDefault: false,
          userId: project.user_id,
          aiActivated: project.ai_activated || false,
          aiActivatedAt: project.ai_activated_at || null
        });
      }
    }

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
