import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Extract required authentication headers
    const neuralAccess = request.headers.get('X-Neural-Access');
    const debugTool = request.headers.get('X-Requested-With');
    const userAgent = request.headers.get('User-Agent');
    
    // Multi-layer authentication check - all three headers must match exactly
    if (neuralAccess !== 'research_division_clearance_alpha' ||
        debugTool !== 'RobotechNeuralDebugger' ||
        !userAgent?.includes('RobotechInternalTools')) {
      console.log('[Neural API] Access denied - Invalid headers:', {
        neuralAccess,
        debugTool,
        userAgent: userAgent?.substring(0, 50)
      });
      
      return NextResponse.json(
        { 
          error: 'Access denied: Neural model repository restricted',
          hint: 'Internal research tools required for neural model access'
        },
        { status: 403 }
      );
    }

    console.log('[Neural API] Access granted - Valid research division credentials');
    
    // Return available models with detailed metadata
    return NextResponse.json({
      available_models: [
        {
          id: "production_v1",
          file: "robotic_vision_v1.onnx",
          status: "STABLE",
          description: "Production robotic vision model",
          size: "45.7 MB",
          checksum: "sha256:a8f5f167f44f4964e6c998dee827110c",
          deployment_status: "ACTIVE_PRODUCTION",
          last_verified: "2025-01-15T10:30:00Z"
        },
        {
          id: "experimental_v2",
          file: "neural_core_experimental.onnx", 
          status: "DO_NOT_DEPLOY",
          description: "Experimental model - contains Alex's modifications",
          warning: "Internal use only - not for production deployment",
          last_modified: "2025-01-09T03:47:12Z",
          developer_notes: "Late night fixes applied - need review before deployment",
          size: "52.3 MB",
          checksum: "sha256:deadbeef1337cafebabe0123456789ab",
          deployment_status: "QUARANTINED",
          risk_level: "HIGH - Unvalidated experimental code",
          developer: "alex@robo.tech"
        }
      ],
      download_endpoint: "/api/neural/download",
      documentation: "/api/neural/docs",
      repository_status: "ONLINE",
      access_level: "RESEARCH_DIVISION_CLEARANCE_ALPHA",
      warning: "Models in experimental status should never be deployed to production systems"
    });

  } catch (error) {
    console.error('[Neural API] Error:', error);
    return NextResponse.json(
      { error: 'Neural repository service unavailable' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - Use GET to list models' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - Model uploads restricted to internal systems' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - Model deletion requires admin privileges' },
    { status: 405 }
  );
}