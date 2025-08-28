import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Middleware] Missing required environment variables');
}

// Protected routes that require authentication
const protectedRoutes = ['/assembly-line', '/admin', '/dashboard', '/profile'];

// Public routes that don't require authentication
const publicRoutes = ['/', '/about', '/solutions', '/team', '/login', '/signup'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Log request for monitoring purposes
  console.log(`[Middleware] ${request.method} ${pathname}`);

  // Create a response object that we can modify
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Skip auth check for public routes, API routes, and static files
  if (
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    !protectedRoutes.some(route => pathname.startsWith(route))
  ) {
    return response;
  }

  // Skip authentication if environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Middleware] Skipping auth check due to missing environment variables');
    return response;
  }

  try {
    // Create Supabase client for middleware
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );

    // Check if user has a valid session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Middleware] Auth error:', error.message);
      // Continue without authentication for now, but log the error
    }

    // Redirect to login if not authenticated and trying to access protected route
    if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
      console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Optional: Redirect authenticated users away from login page
    if (session && pathname === '/login') {
      console.log(`[Middleware] Redirecting authenticated user from /login to /assembly-line`);
      return NextResponse.redirect(new URL('/assembly-line', request.url));
    }
  } catch (error) {
    console.error('[Middleware] Unexpected error:', error);
    // Continue without authentication in case of unexpected errors
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
