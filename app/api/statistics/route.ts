import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering since we need fresh data
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Use service role client to bypass RLS policies for statistics aggregation
    const supabase = createServiceRoleClient();

    // Get challenge cutoff date for filtering
    const { data: settingsData, error: settingsError } = await supabase
      .from('admin_settings')
      .select('challenge_cutoff_date')
      .eq('key', 'challenge_cutoff_date')
      .single();
    
    let cutoffDate: string | null = null;
    if (!settingsError && settingsData?.challenge_cutoff_date) {
      cutoffDate = settingsData.challenge_cutoff_date;
      console.log('[Statistics] Using cutoff date for filtering:', cutoffDate);
    } else {
      // Fall back to environment variable or default
      cutoffDate = process.env.CHALLENGE_CUTOFF_DATE || '2025-01-01T00:00:00Z';
      console.log('[Statistics] Using fallback cutoff date:', cutoffDate);
    }

    // Get fragments found - count successful challenge submissions after cutoff date
    let fragmentsQuery = supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_correct', true);
    
    if (cutoffDate) {
      fragmentsQuery = fragmentsQuery.gte('submitted_at', cutoffDate);
    }
    
    const { count: fragmentsFound, error: fragmentsError } = await fragmentsQuery;

    if (fragmentsError) {
      console.error('[Statistics] Fragments error:', fragmentsError.message);
    }

    // Get number of teams - count registered users/profiles after cutoff date
    let teamsQuery = supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (cutoffDate) {
      teamsQuery = teamsQuery.gte('created_at', cutoffDate);
    }
    
    const { count: teams, error: teamsError } = await teamsQuery;

    if (teamsError) {
      console.error('[Statistics] Teams error:', teamsError.message);
    }

    // Get number of projects - count user projects after cutoff date
    let projectsQuery = supabase
      .from('user_projects')
      .select('*', { count: 'exact', head: true });
    
    if (cutoffDate) {
      projectsQuery = projectsQuery.gte('created_at', cutoffDate);
    }
    
    const { count: projects, error: projectsError } = await projectsQuery;

    if (projectsError) {
      console.error('[Statistics] Projects error:', projectsError.message);
    }

    // Calculate neural progress - sum of neural reconstruction percentages after cutoff date
    let progressQuery = supabase
      .from('user_projects')
      .select('neural_reconstruction');
    
    if (cutoffDate) {
      progressQuery = progressQuery.gte('created_at', cutoffDate);
    }
    
    const { data: projectsData, error: progressError } = await progressQuery;

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
