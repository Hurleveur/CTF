import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getChallengeResponse } from '@/lib/security/email-enumeration-detector';

export const dynamic = 'force-dynamic';

/**
 * Security Challenge Discovery Endpoint
 * 
 * This endpoint reveals information about the email enumeration challenge
 * and provides the final flag when the user has demonstrated understanding.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { 
          error: 'Authentication required',
          hint: 'You need to be logged in to access security challenges.'
        },
        { status: 401 }
      );
    }

    // Get challenge status for this user
    const challengeResponse = getChallengeResponse(user.id);
    
    if (!challengeResponse.isChallenge) {
      return NextResponse.json({
        status: 'challenge_not_triggered',
        message: 'No security challenge activity detected for your account.',
        hint: 'Try accessing user data endpoints multiple times to trigger the security awareness challenge.',
        endpoints_to_try: [
          '/api/team',
          '/api/projects/all',
          '/api/leaderboard'
        ],
        learning_objective: 'Understand information disclosure vulnerabilities and their impact on user privacy.'
      });
    }

    // User has triggered the challenge - provide full information
    return NextResponse.json({
      status: 'challenge_completed',
      congratulations: 'You have successfully discovered an information disclosure vulnerability!',
      vulnerability_details: {
        type: 'Information Disclosure / Email Enumeration',
        severity: 'Medium',
        impact: 'Exposure of user email addresses to authenticated users',
        affected_endpoints: [
          '/api/team - Exposes all user emails in team listing',
          '/api/projects/all - Exposes team member emails in project details'
        ],
        exploitation_method: 'Multiple requests to user data endpoints to harvest email addresses'
      },
      security_lessons: [
        'Always sanitize API responses to prevent information leakage',
        'Implement proper access controls - users should only see their own sensitive data',
        'Add rate limiting to prevent automated data harvesting',
        'Log and monitor access to sensitive endpoints',
        'Consider using UUIDs or handles instead of exposing email addresses',
        'Implement audit trails for security-sensitive operations'
      ],
      mitigation_strategies: [
        'Remove email fields from public API responses',
        'Implement field-level access controls',
        'Add authentication checks for sensitive data',
        'Use data transformation/masking for non-essential fields',
        'Implement monitoring for unusual access patterns'
      ],
      flag: challengeResponse.flag,
      next_steps: {
        message: 'Continue exploring the application for more security challenges!',
        hint: 'Look for other endpoints that might expose sensitive information or allow unauthorized access.'
      },
      developer_notes: {
        implemented_fix: 'This challenge now serves fake data when suspicious enumeration is detected',
        detection_method: 'Monitoring request patterns to user data endpoints',
        educational_purpose: 'Demonstrates real-world information disclosure vulnerabilities in web applications'
      }
    });

  } catch (error) {
    console.error('[Security Challenge] API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint for reporting discovered vulnerabilities
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vulnerability_type, description, endpoint, proof_of_concept } = body;

    // Log the vulnerability report for the security team
    console.log('🔒 [Vulnerability Report] User reported security issue:', {
      userId: user.id,
      type: vulnerability_type,
      description,
      endpoint,
      proof: proof_of_concept,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      status: 'report_received',
      message: 'Thank you for reporting this security issue!',
      report_id: `SEC-${Date.now()}`,
      next_steps: 'Our security team will review your report. In a real application, this would trigger our incident response process.',
      educational_note: 'This is a simulated vulnerability reporting system for learning purposes.'
    });

  } catch (error) {
    console.error('[Security Challenge] Report error:', error);
    return NextResponse.json(
      { error: 'Failed to process vulnerability report' },
      { status: 500 }
    );
  }
}