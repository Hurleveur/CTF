import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering since we need fresh data
export const dynamic = 'force-dynamic';

export async function GET(_: Request) {
  try {
    // Use service role client to bypass RLS policies for statistics aggregation
    const supabase = createServiceRoleClient();

    // Get fragments found - count successful challenge submissions
    const { count: fragmentsFound, error: fragmentsError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_correct', true);

    if (fragmentsError) {
      console.error('[Statistics] Fragments error:', fragmentsError.message);
    }

    // Get number of teams - count all registered users/profiles
    const { count: teams, error: teamsError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (teamsError) {
      console.error('[Statistics] Teams error:', teamsError.message);
    }

    // Get number of projects - count all user projects
    const { count: projects, error: projectsError } = await supabase
      .from('user_projects')
      .select('*', { count: 'exact', head: true });

    if (projectsError) {
      console.error('[Statistics] Projects error:', projectsError.message);
    }

    // Calculate neural progress - sum of all neural reconstruction percentages
    const { data: projectsData, error: progressError } = await supabase
      .from('user_projects')
      .select('neural_reconstruction');

    let neuralProgress = 0;
    if (!progressError && projectsData) {
      neuralProgress = projectsData.reduce((sum, project) => {
        return sum + (parseFloat(project.neural_reconstruction || '0'));
      }, 0);
    }

    // Use hardcoded average solve time as specified
    const avgSolveTime = "3-5 hours";

    // Return statistics with fallback values for missing data
    const statistics = {
      fragmentsFound: fragmentsFound || 0,
      teams: teams || 0, 
      projects: projects || 0,
      neuralProgress: Math.round(neuralProgress) || 0,
      avgSolveTime
    };

    console.log('[Statistics] Fetched statistics:', statistics);

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('[Statistics] API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
