import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Input validation schema
const submitSchema = z.object({
  challenge_id: z.string().uuid('Invalid challenge ID'),
  flag: z.string().min(1, 'Flag cannot be empty').max(500, 'Flag too long'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = submitSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { challenge_id, flag } = validationResult.data;
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

    // Check if user already solved this challenge
    const { data: existingSolution, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user_id)
      .eq('challenge_id', challenge_id)
      .eq('is_correct', true)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('[API] Submission check error:', checkError.message);
      return NextResponse.json(
        { error: 'Failed to check submission status' },
        { status: 500 }
      );
    }

    if (existingSolution) {
      return NextResponse.json(
        { 
          error: 'Challenge already solved',
          message: 'You have already solved this challenge' 
        },
        { status: 409 }
      );
    }

    // Get the challenge details to check the flag
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('flag, points, title')
      .eq('id', challenge_id)
      .eq('is_active', true)
      .single();

    if (challengeError) {
      console.error('[API] Challenge fetch error:', challengeError.message);
      return NextResponse.json(
        { error: 'Challenge not found or inactive' },
        { status: 404 }
      );
    }

    // Check if the flag is correct (case-insensitive comparison)
    const isCorrect = flag.trim().toLowerCase() === challenge.flag.toLowerCase();
    const pointsAwarded = isCorrect ? challenge.points : 0;

    // Insert the submission
    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id,
        challenge_id,
        flag_submitted: flag.trim(),
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      });

    if (insertError) {
      console.error('[API] Submission insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to record submission' },
        { status: 500 }
      );
    }

    if (isCorrect) {
      return NextResponse.json({
        success: true,
        message: `Congratulations! You solved "${challenge.title}"`,
        points_awarded: pointsAwarded,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Incorrect flag. Try again!',
        points_awarded: 0,
      });
    }

  } catch (error) {
    console.error('[API] Submit error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
