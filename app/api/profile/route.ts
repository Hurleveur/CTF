import { NextRequest, NextResponse } from 'next/server';
import { createClientSync as createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_: Request) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user_id = user.id;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (profileError) {
      console.error('[API] Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Failed to fetch profile' },
        { status: 500 }
      );
    }

    // Get user's solved challenges and total points
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        challenge_id,
        points_awarded,
        submitted_at,
        is_correct,
        challenges:challenge_id (
          title,
          category,
          difficulty
        )
      `)
      .eq('user_id', user_id)
      .eq('is_correct', true);

    if (submissionsError) {
      console.error('[API] Submissions fetch error:', submissionsError.message);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    const totalPoints = submissions?.reduce((sum, sub) => sum + sub.points_awarded, 0) || 0;
    const challengesSolved = submissions?.length || 0;

    // Get user's rank from leaderboard
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('leaderboard')
      .select('id, total_points')
      .order('total_points', { ascending: false })
      .order('last_submission', { ascending: true });

    if (leaderboardError) {
      console.error('[API] Leaderboard fetch error:', leaderboardError.message);
    }

    const userRank = (leaderboard || []).findIndex(entry => entry.id === user_id) + 1 || 0;

    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        created_at: profile.created_at,
      },
      stats: {
        total_points: totalPoints,
        challenges_solved: challengesSolved,
        rank: userRank,
        total_users: leaderboard?.length || 0,
      },
      recent_submissions: submissions || [], // Return ALL submissions for completed challenges tracking
      recent_submissions_display: submissions?.slice(-5).reverse() || [], // Keep recent 5 for display purposes
    });

  } catch (error) {
    console.error('[API] Profile error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
