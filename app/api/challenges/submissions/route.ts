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

    // Get user's submissions (completed challenges only)
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('challenge_id, points_awarded, submitted_at, is_correct')
      .eq('user_id', user.id)
      .eq('is_correct', true)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      console.error('[API] Submissions fetch error:', submissionsError.message);
      return NextResponse.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      submissions: submissions || [],
      count: submissions?.length || 0,
    });

  } catch (error) {
    console.error('[API] Submissions error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
