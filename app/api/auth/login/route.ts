import { NextRequest, NextResponse } from 'next/server';
import { createClientSync as createClient } from '@/lib/supabase/server';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limiter';
import { loginSchema, validate } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting first (uses smart AUTH_LOGIN policy)
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = validate(loginSchema, body);
    if (!validationResult.ok) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data!;
    const supabase = createClient();

    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[Auth] Login error:', error.message);
      
      // Return generic error message for security
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Success - reset rate limit and return response
    await resetRateLimit(request);
    
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: data.user.role,
        last_sign_in_at: data.user.last_sign_in_at,
      },
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
