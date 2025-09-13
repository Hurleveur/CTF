import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createDefaultProject } from '@/lib/projects/createDefaultProject';

/**
 * POST - Create a default project for the authenticated user
 * This is useful for users who signed up before the default project feature
 * or who unchecked the option during signup
 */
export async function POST() {
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

    // Check if user already has projects
    const { data: existingProjects } = await supabase
      .from('user_projects')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (existingProjects && existingProjects.length > 0) {
      return NextResponse.json(
        { 
          error: 'User already has projects',
          message: 'You already have robotic projects. Cannot create a default project.'
        },
        { status: 400 }
      );
    }

    // Get user's profile for full name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const fullName = profile?.full_name || profile?.email || user.email || 'Unknown Developer';

    // Create the default project
    const result = await createDefaultProject(user.id, fullName);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create default project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Default project created successfully',
      project: result.project,
    });

  } catch (error) {
    console.error('[CreateDefault] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
