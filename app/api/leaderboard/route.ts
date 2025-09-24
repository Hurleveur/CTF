import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { detectEnumerationAttempt, logEnumerationAttempt } from '@/lib/security/email-enumeration-detector';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Get pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 per page
    const offset = (page - 1) * limit;

    // Check if user is authenticated (optional for leaderboard viewing)
    const { data: { user } } = await supabase.auth.getUser();
    
    // Security Challenge: Track access attempts
    if (user) {
      const userAgent = request.headers.get('user-agent') || '';
      const headers = Object.fromEntries(request.headers.entries());
      const isSuspicious = detectEnumerationAttempt(user.id, '/api/leaderboard', userAgent, headers);
      
      logEnumerationAttempt(user.id, '/api/leaderboard', isSuspicious, {
        userAgent,
        timestamp: new Date().toISOString(),
        paginationParams: { page, limit }
      });
    }
    
    // Get leaderboard data
    const { data: leaderboard, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('total_points', { ascending: false })
      .order('last_submission', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] Leaderboard fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('[API] Leaderboard count error:', countError.message);
    }

    // Add rank numbers to the results
    const rankedLeaderboard = leaderboard?.map((entry, index) => ({
      ...entry,
      rank: offset + index + 1,
      // Hide email if not authenticated or not the current user
      email: user && user.id === entry.id ? entry.email : null,
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
      current_user: user ? {
        id: user.id,
        rank: rankedLeaderboard?.findIndex(entry => entry.id === user.id) + offset + 1 || 0,
      } : null,
    });

  } catch (error) {
    console.error('[API] Leaderboard error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
