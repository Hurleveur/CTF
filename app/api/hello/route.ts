import { NextResponse } from 'next/server';

/**
 * @description Handles GET requests to the /api/hello endpoint.
 * This is a basic demonstration of a secure API route. It performs no actions
 * but shows how to return a well-formed JSON response.
 * @returns {NextResponse} A JSON response with a status message.
 */
export async function GET(request: Request) {
  // Log the incoming request details for monitoring and debugging.
  console.log(`[API/hello] Handling GET request from ${request.headers.get('host')}`);

  // In a real application, you would perform server-side validation,
  // sanitize input, and ensure the user is authenticated and authorized.
  // For now, we'll just return a simple, friendly message.
  return NextResponse.json({ 
    status: 'success', 
    message: 'Hello from a secure API endpoint!' 
  }, {
    status: 200,
  });
}

/**
 * @description Handles POST requests. It demonstrates basic server-side validation.
 * @param {Request} request The incoming request object.
 * @returns {NextResponse} A JSON response.
 */
export async function POST(request: Request) {
  try {
    const { data } = await request.json();

    // Server-side validation is crucial. We check if the data is a string
    // and if it's not empty to prevent simple injection attacks.
    if (typeof data !== 'string' || data.trim().length === 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Invalid input. Data must be a non-empty string.'
      }, {
        status: 400
      });
    }

    // Sanitize the input to prevent XSS. For this simple example, we'll
    // just trim and escape a potential script tag. In a real-world app,
    // you would use a dedicated library like `dompurify` on the server.
    const sanitizedData = data.replace(/<script>/gi, '');

    // Return a successful response.
    return NextResponse.json({
      status: 'success',
      message: `Received and processed data: ${sanitizedData}`
    }, {
      status: 200
    });

  } catch (error) {
    // Graceful error handling is a key security practice.
    console.error('Error processing POST request:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Internal server error. Invalid JSON or request body.'
    }, {
      status: 500
    });
  }
}
