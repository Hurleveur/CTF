import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Verify user is authenticated and is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Return rate limiting statistics (this is a mock implementation)
    // In a production environment, you would integrate this with your actual rate limiter storage
    const stats = {
      active_rate_limits: 23,
      locked_out_clients: 5,
      total_requests_today: 1247,
      blocked_requests_today: 89,
      top_blocked_endpoints: [
        { endpoint: '/api/auth/login', blocked_count: 34 },
        { endpoint: '/api/auth/signup', blocked_count: 28 },
        { endpoint: '/api/challenges/submit', blocked_count: 21 },
        { endpoint: '/api/profile', blocked_count: 6 }
      ],
      suspicious_ips: [
        { ip: '192.168.1.100', attempts: 50, locked_until: new Date(Date.now() + 60*60*1000).toISOString() },
        { ip: '10.0.0.45', attempts: 32, locked_until: new Date(Date.now() + 30*60*1000).toISOString() },
        { ip: '172.16.0.88', attempts: 28, locked_until: new Date(Date.now() + 15*60*1000).toISOString() }
      ],
      recent_lockouts: [
        {
          client_id: '192.168.1.100:dGVzdA==',
          endpoint: '/api/auth/login',
          attempts: 8,
          locked_at: new Date(Date.now() - 10*60*1000).toISOString(),
          locked_until: new Date(Date.now() + 50*60*1000).toISOString()
        },
        {
          client_id: '10.0.0.45:Y2hyb21l',
          endpoint: '/api/challenges/submit',
          attempts: 15,
          locked_at: new Date(Date.now() - 5*60*1000).toISOString(),
          locked_until: new Date(Date.now() + 10*60*1000).toISOString()
        }
      ]
    };

    return NextResponse.json({
      message: 'Rate limiting statistics retrieved',
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Admin] Rate limit stats error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
