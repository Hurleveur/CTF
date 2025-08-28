import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { signupSchema, validate } from '@/lib/validation/auth';

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting first (uses smart AUTH_SIGNUP policy)
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = validate(signupSchema, body);
    if (!validationResult.ok) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.errors,
        },
        { status: 400 }
      );
    }

    const { email, password, fullName } = validationResult.data!;
    const supabase = createClient();

    // Attempt to sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      console.error('[Auth] Signup error:', error.message);
      
      // Check if it's a duplicate user error
      if (error.message.includes('User already registered') || 
          error.message.includes('already registered') ||
          error.message.includes('duplicate') ||
          error.status === 422) {
        return NextResponse.json(
          { error: 'Email address is already registered' },
          { status: 409 }
        );
      }
      
      // For other errors, return generic message to prevent information disclosure
      return NextResponse.json(
        { 
          message: 'If this email is not already registered, a verification email has been sent.',
          // Don't reveal if registration actually succeeded or failed
        },
        { status: 200 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json({
      message: 'Registration successful. Please check your email for verification.',
      user: {
        id: data.user.id,
        email: data.user.email,
        email_confirmed_at: data.user.email_confirmed_at,
      },
    });

  } catch (error) {
    console.error('[Auth] Signup error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
