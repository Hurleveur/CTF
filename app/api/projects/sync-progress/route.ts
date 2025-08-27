import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user_id = session.user.id;

    // Get all successful submissions for this user
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('points_awarded')
      .eq('user_id', user_id)
      .eq('is_correct', true);
    
    let totalProgress = 0;
    let totalPoints = 0;
    
    if (allSubmissions && !submissionsError) {
      // Calculate total progress based on all successful submissions
      totalPoints = allSubmissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
      totalProgress = Math.min(totalPoints / 10, 100); // Same scaling as elsewhere
      console.log(`[API] Progress sync - Total points: ${totalPoints}, Progress: ${totalProgress}%`);
    }
    
    // Update user's project with the correct progress
    const { data: updatedProject, error: updateError } = await supabase
      .from('user_projects')
      .update({
        neural_reconstruction: totalProgress,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('[API] Failed to sync project progress:', updateError.message);
      return NextResponse.json(
        { error: 'Failed to sync progress' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      total_points: totalPoints,
      neural_reconstruction: totalProgress,
      project: updatedProject
    });

  } catch (error) {
    console.error('[API] Progress sync error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
