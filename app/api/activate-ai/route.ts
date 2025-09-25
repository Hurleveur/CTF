import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPermissionContext, canActivateAI } from '@/lib/auth/permissions';
import { dispatchAIActivationNotification } from '@/lib/notifications/dispatch';

export const dynamic = 'force-dynamic';

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

    // Check if user is ACTUALLY admin (not just frontend bypass)
    // Real admin check - check against profiles table for admin or dev role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[AI Activation] Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Unable to verify admin privileges' },
        { status: 500 }
      );
    }

    // Check if user can activate AI (admin or dev role)
    // Cast Supabase user to AuthContext user type (email is guaranteed to exist here since we checked for user existence)
    const authUser = {
      id: user.id,
      email: user.email || '', // Fallback to empty string, though email should exist
      name: user.user_metadata?.full_name,
      role: user.role,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at,
    };
    // Transform profile to match UserProfile interface
    const userProfile = profile ? {
      id: profile.id,
      email: profile.email,
      role: profile.role as 'user' | 'admin' | 'dev',
      full_name: profile.full_name
    } : null;
    
    const permissionContext = createPermissionContext(authUser, userProfile);
    const canActivate = canActivateAI(permissionContext);

    if (!canActivate) {
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
          hint: 'RBT{frontend_admin_checks_are_useless}'
        },
        { status: 403 }
      );
    }

    // If we get here, user is actually admin
    console.log(`✅ Admin user ${user.email} successfully activated AI`);
    
    // Update the user's project to mark AI as activated
    const { error: updateError } = await supabase
      .from('user_projects')
      .update({ 
        ai_activated: true,
        ai_activated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('[AI Activation] Database update error:', updateError.message);
      // Continue anyway - the AI activation worked, database update is not critical
    } else {
      console.log(`💾 AI activation state saved to database for user ${user.email}`);
    }
    
    // Dispatch real-time notification to all connected dev users
    try {
      await dispatchAIActivationNotification(
        profile.email,
        profile.full_name,
        user.id
      );
    } catch (notificationError) {
      console.error('[AI Activation] Notification dispatch failed (continuing anyway):', notificationError);
      // Don't fail the AI activation if notification fails
    }
    
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
