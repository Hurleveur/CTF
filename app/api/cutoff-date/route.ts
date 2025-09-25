import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Force dynamic rendering to get fresh data
export const dynamic = 'force-dynamic';

/**
 * Public endpoint to get the challenge cutoff date
 * This is used for filtering projects and team members on the frontend
 */
export async function GET() {
  try {
    // Use service role client to bypass RLS for reading admin settings
    const supabase = createServiceRoleClient();
    
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
      console.log('[Public] Using fallback cutoff date:', cutoffDate);
    } else {
      cutoffDate = settingsData.challenge_cutoff_date;
      console.log('[Public] Retrieved cutoff date from database:', cutoffDate);
    }

    return NextResponse.json({
      success: true,
      cutoff_date: cutoffDate,
      message: 'Challenge cutoff date retrieved successfully'
    });

  } catch (error) {
    console.error('[Public] Error retrieving challenge cutoff date:', error);
    
    // Fallback to default date if everything fails
    const fallbackDate = process.env.CHALLENGE_CUTOFF_DATE || '2025-01-01T00:00:00Z';
    
    return NextResponse.json({
      success: true,
      cutoff_date: fallbackDate,
      message: 'Using fallback cutoff date due to error'
    });
  }
}