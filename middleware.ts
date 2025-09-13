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
const publicRoutes = ['/', '/about', '/projects', '/team', '/login', '/signup'];

// Helper function to apply security headers to any response
function applySecurityHeaders(response: NextResponse, cspValue: string) {
  response.headers.set('Content-Security-Policy', cspValue);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
  
  // HSTS - Force HTTPS (only in production)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
}

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

  // Content Security Policy configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadmjsrhybjnelqgswxg.supabase.co';
  const supabaseHost = supabaseUrl.replace('https://', '');
  const cspValue = `default-src 'self' data:; style-src 'self' 'unsafe-inline' https://embed.fabrile.app; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://embed.fabrile.app https://*.fabrile.app; connect-src 'self' ${supabaseUrl} wss://${supabaseHost} https://embed.fabrile.app https://*.fabrile.app wss://*.fabrile.app; font-src 'self' https://embed.fabrile.app; img-src 'self' data: https: https://embed.fabrile.app; frame-src https://embed.fabrile.app https://*.fabrile.app; object-src 'none'; base-uri 'self';`;
  
  // Apply security headers to all responses
  applySecurityHeaders(response, cspValue);
  
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
    // Note: Using getSession() is acceptable in middleware for performance reasons
    // as we only need to check for the presence of auth, not validate sensitive operations
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('[Middleware] Auth error:', error.message);
      
      // Handle invalid refresh token errors
      if (error.message.includes('Invalid Refresh Token') || 
          error.message.includes('Refresh Token Not Found')) {
        console.error('[Middleware] Invalid refresh token - clearing cookies and redirecting to login');
        
        // Clear Supabase cookies
        const cookiesToClear = ['sb-access-token', 'sb-refresh-token', 'sb-provider-token', 'sb-user'];
        cookiesToClear.forEach(cookieName => {
          response.cookies.set(cookieName, '', { 
            maxAge: 0, 
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          });
        });
        
        // Redirect to login for protected routes
        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          const redirectResponse = NextResponse.redirect(new URL('/login?reason=token-expired', request.url));
          applySecurityHeaders(redirectResponse, cspValue);
          return redirectResponse;
        }
      }
      // Continue without authentication for other errors, but log them
    }

    // Redirect to login if not authenticated and trying to access protected route
    if (!session && protectedRoutes.some(route => pathname.startsWith(route))) {
      console.log(`[Middleware] Redirecting unauthenticated user from ${pathname} to /login`);
      const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
      applySecurityHeaders(redirectResponse, cspValue);
      return redirectResponse;
    }

    // Optional: Redirect authenticated users away from login page
    if (session && pathname === '/login') {
      console.log(`[Middleware] Redirecting authenticated user from /login to /assembly-line`);
      const redirectResponse = NextResponse.redirect(new URL('/assembly-line', request.url));
      applySecurityHeaders(redirectResponse, cspValue);
      return redirectResponse;
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
