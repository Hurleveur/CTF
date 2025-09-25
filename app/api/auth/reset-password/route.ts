import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

// Validation schema for password reset request
const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email format').max(320, 'Email too long'),
});

export async function POST(request: NextRequest) {
  try {
    // Check rate limiting first
    const rateLimitResult = await checkRateLimit(request);
    
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }
    
    const body = await request.json();
    
    // Validate input
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[Auth] Password reset validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    const supabase = await createClient();

    console.log('[Auth] Password reset requested for:', email);

    // Get the site URL - prioritize production URL, then Vercel URL, then localhost
    let siteUrl = 'http://localhost:3000';
    
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      // Production URL if explicitly set
      siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    } else if (process.env.VERCEL_URL) {
      // Vercel deployment URL
      siteUrl = `https://${process.env.VERCEL_URL}`;
    } else if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
      // Use NEXTAUTH_URL if it's not localhost
      siteUrl = process.env.NEXTAUTH_URL;
    }
    
    // Get the origin from the request headers as a fallback
    const origin = request.headers.get('origin');
    if (origin && !origin.includes('localhost')) {
      siteUrl = origin;
    }
    
    const redirectUrl = `${siteUrl}/reset-password`;
    console.log('[Auth] Using site URL for password reset:', siteUrl);

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error('[Auth] Supabase password reset error:', error.message);
      // Return generic success message to prevent email enumeration
      return NextResponse.json({
        message: 'If an account with this email exists, you will receive a password reset link shortly.',
      });
    }

    console.log('[Auth] Password reset email sent successfully to:', email);

    // Always return success message to prevent email enumeration
    return NextResponse.json({
      message: 'If an account with this email exists, you will receive a password reset link shortly.',
    });

  } catch (error) {
    console.error('[Auth] Password reset error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}