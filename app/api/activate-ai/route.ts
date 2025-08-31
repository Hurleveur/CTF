import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is ACTUALLY admin (not just frontend bypass)
    // Real admin check - check against profiles table admin role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[AI Activation] Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Unable to verify admin privileges' },
        { status: 500 }
      );
    }

    // Check if user has admin role or specific admin email
    const isRealAdmin = profile.role === 'admin' || profile.email === 'admin@example.com';

    if (!isRealAdmin) {
      // NOT ADMIN - RICKROLL TIME! 🎵
      console.log(`🎭 Non-admin user ${user.email} tried to activate AI - deploying rickroll defense!`);
      
      // Multiple rickroll strategies for maximum effect
      const rickrollUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Classic
        'https://www.youtube.com/watch?v=oHg5SJYRHA0', // Alternative version
        'https://youtu.be/dQw4w9WgXcQ?si=4WEuCiHWGqNHI2dN', // With tracking
        'https://bit.ly/IqT6zt', // Disguised rickroll
      ];
      
      const selectedRickroll = rickrollUrls[Math.floor(Math.random() * rickrollUrls.length)];
      
      // Return JSON response with rickroll URL
      // Frontend will detect this and open the URL
      return NextResponse.json(
        { 
          error: 'Access denied', 
          message: 'Nice try! You thought you could bypass admin checks by modifying the frontend? 🎵 Never gonna give you up! 🎵',
          rickroll: true,
          redirectUrl: selectedRickroll,
          hint: 'CTF{frontend_admin_checks_are_useless}'
        },
        { status: 403 }
      );
    }

    // If we get here, user is actually admin
    console.log(`✅ Admin user ${user.email} successfully activated AI`);
    
    return NextResponse.json({
      success: true,
      message: 'AI activation successful! The robotic arm consciousness has been awakened.',
      adminMessage: 'Welcome, Administrator. Full neural control systems are now online.'
    });

  } catch (error) {
    console.error('[AI Activation] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during AI activation' },
      { status: 500 }
    );
  }
}
