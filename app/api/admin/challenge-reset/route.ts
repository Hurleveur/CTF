import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPermissionContext, canResetChallenges } from '@/lib/auth/permissions';

// Force dynamic rendering since we use user authentication
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify dev admin access (only devs can reset challenges)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Admin] Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Unable to verify permissions' },
        { status: 500 }
      );
    }

    const permissionContext = createPermissionContext(user, profile);
    if (!canResetChallenges(permissionContext)) {
      return NextResponse.json(
        { error: 'Developer access required - only devs can reset challenges' },
        { status: 403 }
      );
    }

    // Try to get cutoff date from database first
    const { data: settingsData, error: dbError } = await supabase
      .from('admin_settings')
      .select('challenge_cutoff_date')
      .eq('key', 'challenge_cutoff_date')
      .single();

    let cutoffDate: string;

    if (dbError || !settingsData?.challenge_cutoff_date) {
      // Fall back to environment variable or default (app creation date)
      cutoffDate = process.env.CHALLENGE_CUTOFF_DATE || '2025-01-01T00:00:00Z';
      console.log('[Admin] Using fallback cutoff date:', cutoffDate);
    } else {
      cutoffDate = settingsData.challenge_cutoff_date;
      console.log('[Admin] Retrieved cutoff date from database:', cutoffDate);
    }

    return NextResponse.json({
      success: true,
      cutoff_date: cutoffDate,
      message: 'Challenge cutoff date retrieved successfully'
    });

  } catch (error) {
    console.error('[Admin] Error retrieving challenge cutoff date:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verify dev admin access (only devs can reset challenges)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[Admin] Profile fetch error:', profileError.message);
      return NextResponse.json(
        { error: 'Unable to verify permissions' },
        { status: 500 }
      );
    }

    const permissionContext = createPermissionContext(user, profile);
    if (!canResetChallenges(permissionContext)) {
      return NextResponse.json(
        { error: 'Developer access required - only devs can reset challenges' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { reset_to_now } = body;

    const newCutoffDate = reset_to_now ? new Date().toISOString() : body.cutoff_date;
    
    if (!newCutoffDate) {
      return NextResponse.json(
        { error: 'Cutoff date or reset_to_now flag required' },
        { status: 400 }
      );
    }

    console.log('[Admin] Setting challenge cutoff date to:', newCutoffDate);
    console.log('[Admin] Requested by admin user:', user.email);

    // Try to update the database first
    const { error: upsertError } = await supabase
      .from('admin_settings')
      .upsert({
        key: 'challenge_cutoff_date',
        challenge_cutoff_date: newCutoffDate,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      }, {
        onConflict: 'key'
      });

    if (upsertError) {
      console.error('[Admin] Database upsert failed:', upsertError);
      // Continue anyway - the fallback mechanism will handle this
    } else {
      console.log('[Admin] Successfully updated cutoff date in database');
    }

    return NextResponse.json({
      success: true,
      cutoff_date: newCutoffDate,
      message: `Challenge cutoff date ${reset_to_now ? 'reset to current time' : 'updated'} successfully`,
      action: reset_to_now ? 'reset' : 'update'
    });

  } catch (error) {
    console.error('[Admin] Error setting challenge cutoff date:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
