import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Get the current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Auth] Session error:', error.message);
      return NextResponse.json(
        { error: 'Session retrieval failed' },
        { status: 500 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { 
          authenticated: false,
          user: null 
        },
        { status: 200 }
      );
    }

    // Return session information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        last_sign_in_at: session.user.last_sign_in_at,
        email_confirmed_at: session.user.email_confirmed_at,
      },
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
      },
    });

  } catch (error) {
    console.error('[Auth] Session error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Refresh the current session
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Auth] Session refresh error:', error.message);
      return NextResponse.json(
        { error: 'Session refresh failed' },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session to refresh' },
        { status: 401 }
      );
    }

    // Return refreshed session information
    return NextResponse.json({
      message: 'Session refreshed successfully',
      user: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
        last_sign_in_at: session.user.last_sign_in_at,
      },
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
      },
    });

  } catch (error) {
    console.error('[Auth] Session refresh error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
