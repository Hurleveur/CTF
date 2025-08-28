import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

// Input validation schema
const submitSchema = z.object({
  challenge_id: z.string().uuid('Invalid challenge ID').optional(),
  flag: z.string().min(1, 'Flag cannot be empty').max(500, 'Flag too long'),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting first (uses smart CHALLENGE_SUBMIT policy)
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const body = await request.json();
    console.log('[API] Flag submission received:', { flag: body.flag, challenge_id: body.challenge_id });
    
    // Validate input
    const validationResult = submitSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[API] Validation failed:', validationResult.error.flatten().fieldErrors);
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user_id = user.id;

    // Find challenge by flag if challenge_id is not provided
    let actualChallengeId = challenge_id;
    if (!challenge_id) {
      console.log('[API] Searching for challenge by flag:', flag.trim());
      const { data: challengeByFlag, error: flagSearchError } = await supabase
        .from('challenges')
        .select('id')
        .ilike('flag', flag.trim())
        .eq('is_active', true)
        .single();

      if (flagSearchError || !challengeByFlag) {
        console.log('[API] No exact match found, trying case-insensitive comparison');
        // No exact match, try case-insensitive comparison
        const { data: allChallenges, error: allChallengesError } = await supabase
          .from('challenges')
          .select('id, flag')
          .eq('is_active', true);

        if (allChallengesError) {
          console.error('[API] Error fetching challenges:', allChallengesError.message);
        } else if (allChallenges) {
          console.log('[API] Available flags:', allChallenges.map(c => c.flag));
          const matchingChallenge = allChallenges.find(c => 
            c.flag.toLowerCase() === flag.trim().toLowerCase()
          );
          if (matchingChallenge) {
            console.log('[API] Found matching challenge:', matchingChallenge.id);
            actualChallengeId = matchingChallenge.id;
          } else {
            console.log('[API] No matching challenge found for flag:', flag.trim());
          }
        }
      } else {
        console.log('[API] Direct match found:', challengeByFlag.id);
        actualChallengeId = challengeByFlag.id;
      }

      if (!actualChallengeId) {
        console.log('[API] No challenge found for flag, recording failed attempt');
        // Record failed attempt
        await supabase
          .from('submissions')
          .insert({
            user_id,
            challenge_id: null, // We don't know which challenge this was for
            flag_submitted: flag.trim(),
            is_correct: false,
            points_awarded: 0,
          });

        return NextResponse.json({
          correct: false,
          message: 'Invalid flag format or flag not found in the system.',
          points_awarded: 0,
        });
      }
    }

    // Check if user already solved this challenge
    const { data: existingSolution, error: checkError } = await supabase
      .from('submissions')
      .select('id')
      .eq('user_id', user_id)
      .eq('challenge_id', actualChallengeId)
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
          correct: false,
          message: 'You have already submitted this consciousness fragment. Neural pathway already integrated.' 
        },
        { status: 400 }
      );
    }

    // Get the challenge details to check the flag
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('flag, points, title')
      .eq('id', actualChallengeId)
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
        challenge_id: actualChallengeId,
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
      // Calculate total progress based on all successful submissions for this user
      const { data: allSubmissions, error: submissionsError } = await supabase
        .from('submissions')
        .select('points_awarded')
        .eq('user_id', user_id)
        .eq('is_correct', true);
      
      let totalProgress = 0;
      if (allSubmissions && !submissionsError) {
        // Calculate total progress based on all successful submissions
        const totalPoints = allSubmissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
        totalProgress = Math.min(totalPoints / 10, 100); // Same scaling as frontend
        console.log(`[API] Total points earned: ${totalPoints}, calculated progress: ${totalProgress}%`);
      }
      
      // Get user's current project
      const { data: userProject, error: projectError } = await supabase
        .from('user_projects')
        .select('neural_reconstruction')
        .eq('user_id', user_id)
        .single();
      
      if (userProject && !projectError) {
        console.log(`[API] Updating project progress to ${totalProgress}% (calculated from all submissions)`);
        
        // Update the project's neural reconstruction to match total earned progress
        const { error: updateError } = await supabase
          .from('user_projects')
          .update({
            neural_reconstruction: totalProgress,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);
        
        if (updateError) {
          console.error('[API] Failed to update project progress:', updateError.message);
          // Don't fail the submission, just log the error
        }
      } else if (projectError) {
        console.error('[API] Failed to fetch user project for progress update:', projectError.message);
      }
      
      const progressIncrement = Math.min(pointsAwarded / 10, 25); // Calculate for frontend display
      
      return NextResponse.json({
        correct: true,
        message: `Consciousness fragment accepted! Neural pathway "${challenge.title}" restored.`,
        challenge_title: challenge.title,
        points_awarded: pointsAwarded,
        progress_increment: progressIncrement, // Include this for frontend to use
        total_progress: totalProgress, // Include the total progress calculated from all submissions
      });
    } else {
      return NextResponse.json({
        correct: false,
        message: 'Invalid consciousness fragment. This code does not match any neural pathways in the system.',
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
