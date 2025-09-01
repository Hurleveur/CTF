import { NextRequest, NextResponse } from 'next/server';
import { createClientSync as createClient } from '@/lib/supabase/server';

export async function POST(_: Request) {
  try {
    const supabase = createClient();

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Auth] Logout error:', error.message);
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 500 }
      );
    }

    // Success
    return NextResponse.json({
      message: 'Logout successful',
    });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
