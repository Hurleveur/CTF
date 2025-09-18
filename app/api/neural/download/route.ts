import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('model');
    
    console.log('[Neural Download] Request for model:', modelId);
    
    // Only allow download of the experimental model for the challenge
    if (modelId !== 'experimental_v2') {
      return NextResponse.json(
        { 
          error: 'Model not found or access restricted',
          available_models: ['experimental_v2'],
          hint: 'Only experimental models are available for research download'
        },
        { status: 404 }
      );
    }
    
    try {
      // Path to the ONNX model file
      const filePath = path.join(process.cwd(), 'public', 'neural_models', 'neural_core_experimental.onnx');
      console.log('[Neural Download] Attempting to read file:', filePath);
      
      const fileBuffer = await readFile(filePath);
      console.log('[Neural Download] File read successfully, size:', fileBuffer.length, 'bytes');
      
      // Return the model file with appropriate headers
      return new NextResponse(fileBuffer as BodyInit, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': 'attachment; filename="neural_core_experimental.onnx"',
          'Content-Length': fileBuffer.length.toString(),
          'X-Model-Version': '2.1.0-experimental',
          'X-Warning': 'CONTAINS_EXPERIMENTAL_MODIFICATIONS',
          'X-Developer': 'alex@robo.tech',
          'X-Last-Modified': '2025-01-09T03:47:12Z',
          'X-Risk-Level': 'HIGH',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
    } catch (fileError) {
      console.error('[Neural Download] File read error:', fileError);
      
      // Check if file doesn't exist
      if ((fileError as any).code === 'ENOENT') {
        return NextResponse.json(
          { 
            error: 'Neural model file not found',
            details: 'The experimental model may not be ready for download',
            contact: 'Contact alex@robo.tech for model availability'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'File access error',
          details: 'Unable to access neural model repository'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[Neural Download] Error:', error);
    return NextResponse.json(
      { error: 'Neural download service unavailable' },
      { status: 500 }
    );
  }
}

// Handle other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed - Use GET to download models' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed - Model uploads not supported via this endpoint' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed - Model deletion requires admin privileges' },
    { status: 405 }
  );
}