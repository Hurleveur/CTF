import { NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET - Fetch team member submissions for the current user's project
export async function GET() {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[Team Submissions] Fetching team submissions for user:', user.id);

    // Find the user's project through project_members table
    const { data: userMembership, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !userMembership) {
      console.log('[Team Submissions] User is not a member of any project');
      return NextResponse.json({
        message: 'No team submissions found',
        teamSubmissions: {},
        teamMembers: []
      });
    }

    const projectId = userMembership.project_id;
    console.log('[Team Submissions] User is member of project:', projectId);

    // Get all team members for this project
    const { data: teamMembers, error: teamMembersError } = await supabase
      .from('project_members')
      .select(`
        user_id,
        is_lead,
        joined_at,
        profiles(
          id,
          full_name,
          email
        )
      `)
      .eq('project_id', projectId);

    if (teamMembersError) {
      console.error('[Team Submissions] Error fetching team members:', teamMembersError);
      return NextResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    console.log('[Team Submissions] Found team members:', teamMembers?.length || 0);

    // Get all team member IDs
    const teamMemberIds = teamMembers?.map(member => member.user_id) || [];

    if (teamMemberIds.length === 0) {
      return NextResponse.json({
        message: 'No team members found',
        teamSubmissions: {},
        teamMembers: []
      });
    }

    console.log('[Team Submissions] Team member IDs to query:', teamMemberIds);

    // Use service role client to bypass RLS and see all submissions
    const supabaseService = createServiceRoleClient();

    // Fetch all successful submissions for team members using service role
    const { data: submissions, error: submissionsError } = await supabaseService
      .from('submissions')
      .select(`
        user_id,
        challenge_id,
        points_awarded,
        submitted_at,
        is_correct,
        challenges(
          id,
          title,
          category,
          difficulty,
          points
        )
      `)
      .in('user_id', teamMemberIds)
      .eq('is_correct', true)
      .order('submitted_at', { ascending: true });

    console.log('[Team Submissions] Raw submissions query result:', {
      data: submissions,
      error: submissionsError,
      teamMemberIds
    });

    // Also check for ANY submissions (not just correct ones) for debugging
    // Use service role client to bypass RLS and see all submissions
    const { data: allSubmissionsService, error: allSubmissionsServiceError } = await supabaseService
      .from('submissions')
      .select('user_id, challenge_id, is_correct, submitted_at')
      .in('user_id', teamMemberIds)
      .limit(10);

    console.log('[Team Submissions] All submissions (service role debug):', {
      data: allSubmissionsService,
      error: allSubmissionsServiceError,
      count: allSubmissionsService?.length || 0
    });

    // Direct test for Anonymous user specifically
    const { data: anonymousTest, error: anonymousError } = await supabase
      .from('submissions')
      .select('user_id, challenge_id, is_correct, submitted_at')
      .eq('user_id', '5aed1bac-8c2b-4154-b202-6ec7027a5186')
      .limit(5);

    console.log('[Team Submissions] Anonymous direct test:', {
      data: anonymousTest,
      error: anonymousError,
      count: anonymousTest?.length || 0
    });

    if (submissionsError) {
      console.error('[Team Submissions] Error fetching submissions:', submissionsError);
      return NextResponse.json(
        { error: 'Failed to fetch team submissions' },
        { status: 500 }
      );
    }

    console.log('[Team Submissions] Found submissions:', submissions?.length || 0);

    // Group submissions by challenge ID and track who completed what
    const teamSubmissionMap: Record<string, {
      challengeId: string;
      completedBy: Array<{
        userId: string;
        userName: string;
        submittedAt: string;
        pointsAwarded: number;
      }>;
      challenge: {
        id: string;
        title: string;
        category: string;
        difficulty: string;
        points: number;
      } | null;
    }> = {};

    // Create a lookup map for team member profiles
    const memberProfileMap = new Map();
    teamMembers?.forEach(member => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      if (profile) {
        memberProfileMap.set(member.user_id, {
          name: profile.full_name || profile.email || 'Anonymous',
          email: profile.email,
          isLead: member.is_lead
        });
      }
    });

    // Process submissions
    submissions?.forEach(submission => {
      const challengeId = submission.challenge_id;
      const challenge = Array.isArray(submission.challenges) ? submission.challenges[0] : submission.challenges;
      
      if (!teamSubmissionMap[challengeId]) {
        teamSubmissionMap[challengeId] = {
          challengeId,
          completedBy: [],
          challenge: challenge ? {
            id: challenge.id,
            title: challenge.title,
            category: challenge.category,
            difficulty: challenge.difficulty,
            points: challenge.points
          } : null
        };
      }

      // Check if this user already completed this challenge (avoid duplicates)
      const alreadyCompleted = teamSubmissionMap[challengeId].completedBy.some(
        completion => completion.userId === submission.user_id
      );

      if (!alreadyCompleted) {
        const memberProfile = memberProfileMap.get(submission.user_id);
        teamSubmissionMap[challengeId].completedBy.push({
          userId: submission.user_id,
          userName: memberProfile?.name || 'Unknown',
          submittedAt: submission.submitted_at,
          pointsAwarded: submission.points_awarded || 0
        });
      }
    });

    // Transform team members data for frontend
    const teamMembersData = teamMembers?.map(member => {
      const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
      return {
        id: member.user_id,
        name: profile?.full_name || profile?.email || 'Anonymous',
        email: profile?.email,
        isLead: member.is_lead,
        joinedAt: member.joined_at,
        isCurrentUser: member.user_id === user.id
      };
    }) || [];

    console.log('[Team Submissions] Processed challenges with team completions:', Object.keys(teamSubmissionMap).length);

    return NextResponse.json({
      message: 'Team submissions fetched successfully',
      teamSubmissions: teamSubmissionMap,
      teamMembers: teamMembersData,
      stats: {
        totalChallengesCompleted: Object.keys(teamSubmissionMap).length,
        totalTeamMembers: teamMembersData.length,
        totalSubmissions: submissions?.length || 0
      }
    });

  } catch (error) {
    console.error('[Team Submissions] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
