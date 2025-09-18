import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(_request: NextRequest) {
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

    // Check if user is a member of any project
    const { data: membershipData, error: membershipError } = await supabase
      .from('project_members')
      .select(`
        project_id,
        is_lead,
        user_projects (
          name,
          user_id
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (membershipError) {
      console.error('[Projects] Membership check error:', membershipError);
      return NextResponse.json(
        { error: 'You are not a member of any project' },
        { status: 404 }
      );
    }

    const projectId = membershipData.project_id;
    const isLead = membershipData.is_lead;

    // Check how many members are in the project
    const { data: membersData, error: membersError } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', projectId);

    if (membersError) {
      console.error('[Projects] Members check error:', membersError);
      return NextResponse.json(
        { error: 'Failed to check project members' },
        { status: 500 }
      );
    }

    const memberCount = membersData.length;
    const hasOtherMembers = memberCount > 1;

    // If user is the lead and there are other members, they cannot leave
    if (isLead && hasOtherMembers) {
      return NextResponse.json(
        { error: 'Project leaders cannot leave while other members remain. Transfer leadership or remove other members first.' },
        { status: 409 }
      );
    }

    // If user is the only member and project owner, delete the entire project
    if (isLead && !hasOtherMembers) {
      // Check if user owns the project
      const projectData = Array.isArray(membershipData.user_projects) 
        ? membershipData.user_projects[0] 
        : membershipData.user_projects;
      
      if (projectData && projectData.user_id === user.id) {
        // Delete the entire project (cascade will handle related records)
        const { error: deleteError } = await supabase
          .from('user_projects')
          .delete()
          .eq('id', projectId)
          .eq('user_id', user.id);

        if (deleteError) {
          console.error('[Projects] Project deletion error:', deleteError);
          return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
          );
        }

        console.log('[Projects] User successfully deleted project:', user.id);
        return NextResponse.json({
          success: true,
          message: 'Project successfully deleted',
        });
      }
    }

    // Remove user from project members
    const { error: removeError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', user.id);

    if (removeError) {
      console.error('[Projects] Member removal error:', removeError);
      return NextResponse.json(
        { error: 'Failed to leave project' },
        { status: 500 }
      );
    }

    console.log('[Projects] User successfully left project:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Successfully left the project',
    });

  } catch (error) {
    console.error('[Projects] Leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}