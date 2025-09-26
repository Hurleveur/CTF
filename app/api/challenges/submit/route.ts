import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { dispatchChallengeCompletionNotification } from '@/lib/notifications/dispatch';
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
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user_id = user.id;
    
    // Check if user is a dev for debug logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();
    
    const isDev = profile?.role === 'dev';
    
    // Helper function for dev-only logging
    const devLog = (...args: any[]) => {
      if (isDev) console.log(...args);
    };
    
    const devError = (...args: any[]) => {
      if (isDev) console.error(...args);
    };
    
    devLog('[API] Flag submission received:', { flag: body.flag, challenge_id: body.challenge_id });

    // Find challenge by flag if challenge_id is not provided
    let actualChallengeId = challenge_id;
    if (!challenge_id) {
      devLog('[API] Searching for challenge by flag:', flag.trim());
      const { data: challengeByFlag, error: flagSearchError } = await supabase
        .from('challenges')
        .select('id')
        .ilike('flag', flag.trim())
        .eq('is_active', true)
        .single();

      if (flagSearchError || !challengeByFlag) {
        devLog('[API] No exact match found, trying case-insensitive comparison');
        // No exact match, try case-insensitive comparison
        const { data: allChallenges, error: allChallengesError } = await supabase
          .from('challenges')
          .select('id, flag')
          .eq('is_active', true);

        if (allChallengesError) {
          devError('[API] Error fetching challenges:', allChallengesError.message);
        } else if (allChallenges) {
          console.log('[API] Available flags:', ['RBT{correct_wrong_flag}']);
          const matchingChallenge = allChallenges.find(c => 
            c.flag.toLowerCase() === flag.trim().toLowerCase()
          );
          if (matchingChallenge) {
            devLog('[API] Found matching challenge:', matchingChallenge.id);
            actualChallengeId = matchingChallenge.id;
          } else {
            devLog('[API] No matching challenge found for flag:', flag.trim());
          }
        }
      } else {
        devLog('[API] Direct match found:', challengeByFlag.id);
        actualChallengeId = challengeByFlag.id;
      }

      if (!actualChallengeId) {
        devLog('[API] No challenge found for flag, recording failed attempt');
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
      devError('[API] Submission check error:', checkError.message);
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

    // Check if any team member has already solved this challenge
    let teamAlreadyCompleted = false;
    
    // Get user's project team members
    const { data: userMembership } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user_id)
      .single();

    if (userMembership) {
      const { data: teamMembers } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', userMembership.project_id);

      if (teamMembers && teamMembers.length > 0) {
        const teamMemberIds = teamMembers.map(member => member.user_id);
        
        // Check if any team member has completed this challenge
        const { data: teamSolutions } = await supabase
          .from('submissions')
          .select('id, user_id')
          .eq('challenge_id', actualChallengeId)
          .eq('is_correct', true)
          .in('user_id', teamMemberIds)
          .limit(1);

        teamAlreadyCompleted = !!(teamSolutions && teamSolutions.length > 0);
        
        if (teamAlreadyCompleted) {
          devLog(`[API] Challenge ${actualChallengeId} already completed by team member, awarding 0 points`);
        }
      }
    }

    // Get the challenge details to check the flag
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('flag, points, title')
      .eq('id', actualChallengeId)
      .eq('is_active', true)
      .single();

    if (challengeError) {
      devError('[API] Challenge fetch error:', challengeError.message);
      return NextResponse.json(
        { error: 'Challenge not found or inactive' },
        { status: 404 }
      );
    }

    // Check if the flag is correct (case-insensitive comparison)
    const isCorrect = flag.trim().toLowerCase() === challenge.flag.toLowerCase();
    
    // Award points only if correct and team hasn't completed it yet
    const pointsAwarded = isCorrect ? (teamAlreadyCompleted ? 0 : challenge.points) : 0;

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
      devError('[API] Submission insert error:', insertError.message);
      return NextResponse.json(
        { error: 'Failed to record submission' },
        { status: 500 }
      );
    }

    if (isCorrect) {
      // Calculate total progress and team points based on ALL team members' successful submissions
      let totalProgress = 0;
      let totalTeamPoints = 0;
      
      // Get user's project team members
      const { data: userMembership } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user_id)
        .single();

      if (userMembership) {
        const { data: teamMembers } = await supabase
          .from('project_members')
          .select('user_id')
          .eq('project_id', userMembership.project_id);

        if (teamMembers && teamMembers.length > 0) {
          const teamMemberIds = teamMembers.map(member => member.user_id);
          
          // Get all successful submissions for ALL team members
          const { data: teamSubmissions, error: submissionsError } = await supabase
            .from('submissions')
            .select('points_awarded, challenge_id, user_id')
            .in('user_id', teamMemberIds)
            .eq('is_correct', true)
            .order('submitted_at', { ascending: true });
          
          if (teamSubmissions && !submissionsError) {
            // Calculate unique challenge completions (first team member to complete gets points counted)
            const challengePoints = new Map<string, number>();
            
            teamSubmissions.forEach(submission => {
              const challengeId = submission.challenge_id;
              // Only count points from the first completion of each challenge
              if (!challengePoints.has(challengeId)) {
                challengePoints.set(challengeId, submission.points_awarded || 0);
              }
            });
            
            totalTeamPoints = Array.from(challengePoints.values()).reduce((sum, points) => sum + points, 0);
            totalProgress = Math.min(totalTeamPoints / 10, 100); // Same scaling as frontend
          }
        }
      }
      
      // Fallback to individual calculation if team lookup fails
      if (totalProgress === 0 && totalTeamPoints === 0) {
        const { data: allSubmissions, error: submissionsError } = await supabase
          .from('submissions')
          .select('points_awarded')
          .eq('user_id', user_id)
          .eq('is_correct', true);
        
        if (allSubmissions && !submissionsError) {
          const totalPoints = allSubmissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
          totalTeamPoints = totalPoints; // For single-user teams
          totalProgress = Math.min(totalPoints / 10, 100);
        }
      }
      
      // Update progress for the team's project
      if (userMembership) {
        // Update the project directly using the project_id
        const { error: updateError } = await supabase
          .from('user_projects')
          .update({
            neural_reconstruction: totalProgress,
            updated_at: new Date().toISOString()
          })
          .eq('id', userMembership.project_id);
        
        if (updateError) {
          devError('[API] Failed to update team project progress:', updateError.message);
          // Don't fail the submission, just log the error
        } else {
          devLog(`[API] Updated project ${userMembership.project_id} neural reconstruction to ${totalProgress}%`);
        }
      } else {
        // Fallback: update only current user's project
        const { error: updateError } = await supabase
          .from('user_projects')
          .update({
            neural_reconstruction: totalProgress,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);
        
        if (updateError) {
          devError('[API] Failed to update user project progress:', updateError.message);
        }
      }
      
      const progressIncrement = Math.min(pointsAwarded / 10, 25); // Calculate for frontend display
      
      const successMessage = teamAlreadyCompleted 
        ? `Consciousness fragment accepted! Neural pathway "${challenge.title}" already restored by your team. No additional points awarded.`
        : `Consciousness fragment accepted! Neural pathway "${challenge.title}" restored.`;
      
      // Dispatch challenge completion notification to dev users (only for point-awarding completions)
      if (pointsAwarded > 0) {
        try {
          // Get user profile for notification
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', user_id)
            .single();
          
          if (userProfile) {
            await dispatchChallengeCompletionNotification(
              userProfile.email,
              userProfile.full_name,
              user_id,
              challenge.title,
              actualChallengeId!, // We know it's defined here since we're in the success path
              pointsAwarded
            );
            devLog(`[API] ✅ Challenge completion notification sent for user ${userProfile.email}`);
          }
        } catch (notificationError) {
          devError('[API] Failed to send challenge completion notification (continuing anyway):', notificationError);
          // Don't fail the submission if notification fails
        }
      }
      
      return NextResponse.json({
        correct: true,
        message: successMessage,
        challenge_id: actualChallengeId, // Include the challenge ID for optimistic updates
        challenge_title: challenge.title,
        points_awarded: pointsAwarded,
        progress_increment: progressIncrement, // Include this for frontend to use
        total_progress: totalProgress, // Include the total progress calculated from all submissions
        team_already_completed: teamAlreadyCompleted, // Let frontend know about team completion
        new_total_points: totalTeamPoints, // Include total team points for optimistic updates
        new_project_progress: totalProgress // Include project progress for optimistic updates
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
