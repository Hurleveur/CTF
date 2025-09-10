import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get the current user (more secure than getSession)
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('[Auth] User authentication error:', error.message);
      return NextResponse.json(
        { error: 'User authentication failed' },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { 
          authenticated: false,
          user: null 
        },
        { status: 200 }
      );
    }

    // For session info that requires session data, get it only when user is authenticated
    const { data: { session } } = await supabase.auth.getSession();

    // Return user and session information
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
      },
      session: session ? {
        access_token: session.access_token,
        expires_at: session.expires_at,
      } : null,
    });

  } catch (error) {
    console.error('[Auth] Session error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();

    // Refresh the current session
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('[Auth] Session refresh error:', error.message);
      
      // Check if this is an invalid refresh token error
      if (error.message.includes('Invalid Refresh Token') || 
          error.message.includes('Refresh Token Not Found')) {
        console.error('[Auth] Invalid refresh token detected - clearing cookies');
        
        // Create response with cookie clearing headers
        const response = NextResponse.json(
          { error: 'INVALID_REFRESH_TOKEN', message: 'Session expired. Please log in again.' },
          { status: 401 }
        );
        
        // Clear Supabase cookies
        const cookiesToClear = [
          'sb-access-token',
          'sb-refresh-token', 
          'sb-provider-token',
          'sb-user'
        ];
        
        cookiesToClear.forEach(cookieName => {
          response.cookies.set(cookieName, '', { 
            maxAge: 0, 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
        });
        
        return response;
      }
      
      return NextResponse.json(
        { error: 'Session refresh failed', details: error.message },
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
