import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateStatusColor, calculateAIStatus } from '@/lib/project-colors';

export async function POST() {
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

    const user_id = user.id;
    
    // Check if user is a dev for debug logging
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();
    
    const isDev = profile?.role === 'dev';

    // First, get the user's project membership to find their project
    const { data: membership, error: membershipError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user_id)
      .single();
    
    if (membershipError || !membership) {
      if (isDev) console.log('[API] User is not a member of any project');
      return NextResponse.json(
        { error: 'User is not a member of any project' },
        { status: 404 }
      );
    }

    // Get all team members for this project
    const { data: teamMembers, error: teamError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', membership.project_id);
    
    if (teamError || !teamMembers) {
      if (isDev) console.error('[API] Failed to get team members:', teamError);
      return NextResponse.json(
        { error: 'Failed to get team members' },
        { status: 500 }
      );
    }

    // Get all team member IDs
    const teamMemberIds = teamMembers.map(member => member.user_id);
    if (isDev) console.log(`[API] Found ${teamMemberIds.length} team members for project sync`);

    // Get all successful submissions for ALL team members
    const { data: allSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('points_awarded, user_id')
      .in('user_id', teamMemberIds)
      .eq('is_correct', true);
    
    let totalProgress = 0;
    let totalPoints = 0;
    
    if (allSubmissions && !submissionsError) {
      // Calculate total progress based on all team members' successful submissions
      totalPoints = allSubmissions.reduce((sum, sub) => sum + (sub.points_awarded || 0), 0);
      totalProgress = Math.min(totalPoints / 10, 100); // Same scaling as elsewhere
      if (isDev) console.log(`[API] Team progress sync - Total team points: ${totalPoints}, Progress: ${totalProgress}%`);
      
      // Log breakdown by member for debugging
      const memberPoints = new Map<string, number>();
      allSubmissions.forEach(sub => {
        const userId = sub.user_id;
        memberPoints.set(userId, (memberPoints.get(userId) || 0) + (sub.points_awarded || 0));
      });
      if (isDev) console.log('[API] Points by member:', Object.fromEntries(memberPoints));
    }
    
    // Calculate dynamic AI status and color based on progress
    const statusColor = calculateStatusColor(totalProgress);
    const aiStatus = calculateAIStatus(totalProgress);
    
    if (isDev) {
      console.log(`[API] Calculated AI status: ${aiStatus} (${statusColor}) for progress ${totalProgress}%`);
      console.log(`[API] Project membership project_id: ${membership.project_id}`);
    }
    
    // First, let's check if we can find the project
    const { data: projectCheck, error: checkError } = await supabase
      .from('user_projects')
      .select('id, name, neural_reconstruction')
      .eq('id', membership.project_id)
      .single();
    
    if (checkError) {
      if (isDev) console.error('[API] Could not find project with ID:', membership.project_id, checkError);
      
      // Try to find project by user_id instead
      const { data: userProject, error: userProjectError } = await supabase
        .from('user_projects')
        .select('id, name, neural_reconstruction')
        .eq('user_id', user.id)
        .single();
      
      if (userProjectError) {
        if (isDev) console.error('[API] Could not find project by user_id either:', userProjectError);
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      if (isDev) console.log('[API] Found project by user_id instead:', userProject);
      membership.project_id = userProject.id;
    } else {
      if (isDev) console.log('[API] Found project to update:', projectCheck);
    }
    
    if (isDev) console.log(`[API] Attempting to update project ID: ${membership.project_id}`);
    
    // Update the team's project with the correct progress AND dynamic AI status/color
    const { data: updatedProject, error: updateError } = await supabase
      .from('user_projects')
      .update({
        neural_reconstruction: totalProgress,
        status_color: statusColor,
        ai_status: aiStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', membership.project_id)
      .select()
      .single();
    
    if (updateError) {
      if (isDev) {
        console.error('[API] Failed to sync project progress:', updateError);
        console.error('[API] Update details:', {
        projectId: membership.project_id,
        totalProgress,
        statusColor,
        aiStatus,
        error: updateError.message,
        code: updateError.code,
        details: updateError.details
        });
      }
      return NextResponse.json(
        { error: 'Failed to sync progress', details: updateError.message },
        { status: 500 }
      );
    }
    
    if (isDev) console.log('[API] Successfully updated project:', updatedProject);

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
