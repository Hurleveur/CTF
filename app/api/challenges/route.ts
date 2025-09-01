import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(_: Request) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
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
