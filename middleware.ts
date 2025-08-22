import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // This is where you would implement authentication and authorization.
  // For this starting point, we'll just log the request to demonstrate.
  // In a real app, you might check for a user session or token here.
  
  // Log request for monitoring purposes (can be removed in production)
  console.log(`[Middleware] Incoming request to: ${request.nextUrl.pathname}`);

  // Example: Redirect to a login page if not authenticated
  // const isAuthenticated = request.cookies.get('auth_token');
  // if (!isAuthenticated && request.nextUrl.pathname.startsWith('/protected')) {
  //   return NextResponse.redirect(new URL('/login', request.url));
  // }

  // Set response headers to reinforce security measures.
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  return response;
}

// Specify the routes where the middleware should run.
// This is a powerful feature for performance optimization.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (we'll protect specific API routes separately)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
