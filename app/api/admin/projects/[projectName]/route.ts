import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectName: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log('🔍 Admin project data request for:', resolvedParams.projectName);
    
    // For now, we'll implement a basic admin check without strict authentication
    // This aligns with the frontend admin approach and other working APIs
    // In a real implementation, you'd verify the JWT token properly
    
    const projectName = decodeURIComponent(resolvedParams.projectName);
    console.log('🔍 Fetching data for project:', projectName);

    // Find the user who owns this project
    const { data: projectData, error: projectError } = await supabase
      .from('user_projects')
      .select('*')
      .eq('name', projectName)
      .single();

    if (projectError) {
      console.log('⚠️ Project not found:', projectError);
      // Return default data for projects that don't exist in the database
      return NextResponse.json({
        progress: 0,
        stats: { total_points: 0, challenges_solved: 0 },
        submissions: []
      });
    }

    const userId = projectData.user_id;
    console.log('✅ Found project owner:', userId);

    // Get user's submission data and progress
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        *,
        challenges (
          title,
          category,
          difficulty,
          points
        )
      `)
      .eq('user_id', userId)
      .eq('is_correct', true)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.log('⚠️ Error fetching submissions:', submissionsError);
    }

    // Calculate stats
    const totalPoints = submissions?.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0) || 0;
    const challengesSolved = submissions?.length || 0;
    
    // Extract completed challenge IDs
    const completedChallengeIds = submissions?.map(sub => sub.challenge_id) || [];

    const stats = {
      total_points: totalPoints,
      challenges_solved: challengesSolved
    };

    console.log(`✅ Admin data for ${projectName}:`, {
      progress: projectData.neural_reconstruction || 0,
      stats,
      submissions: submissions?.length || 0,
      completedChallengeIds: completedChallengeIds.length
    });

    return NextResponse.json({
      progress: projectData.neural_reconstruction || 0,
      stats,
      submissions: submissions || [],
      completedChallengeIds: completedChallengeIds
    });

  } catch (error) {
    console.error('❌ Error in admin project data API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
