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

    // Use the Postgres function to handle the complex logic and constraints
    const { data: result, error: functionError } = await supabase
      .rpc('leave_project');

    if (functionError) {
      console.error('[Projects] Leave function error:', functionError);
      return NextResponse.json(
        { error: 'Failed to leave project' },
        { status: 500 }
      );
    }

    if (!result.success) {
      console.error('[Projects] Leave failed:', result.error);
      
      // Map specific errors to appropriate HTTP status codes
      let statusCode = 400;
      if (result.error.includes('not a member')) {
        statusCode = 404;
      } else if (result.error.includes('cannot leave')) {
        statusCode = 409; // Conflict - leader trying to leave with other members
      }
      
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      );
    }

    console.log('[Projects] User successfully left project:', user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
    });

  } catch (error) {
    console.error('[Projects] Leave error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}