import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Fetch active challenges (RLS policies will handle permissions)
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('id, title, description, category, difficulty, points, hints')
      .eq('is_active', true)
      .order('difficulty', { ascending: true })
      .order('points', { ascending: true });

    if (error) {
      console.error('[API] Challenges fetch error:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      challenges: challenges || [],
      count: challenges?.length || 0,
    });

  } catch (error) {
    console.error('[API] Challenges error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
