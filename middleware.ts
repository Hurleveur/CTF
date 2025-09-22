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
  
  // Additional security headers for better protection
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
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

  // Content Security Policy configuration - Enhanced security
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadmjsrhybjnelqgswxg.supabase.co';
  const supabaseHost = supabaseUrl.replace('https://', '');
  
  // CSP configuration - Balanced security while maintaining Next.js functionality
  // Allow unsafe-eval only in development for React Fast Refresh
  const isDevelopment = process.env.NODE_ENV === 'development';
  const scriptSrc = isDevelopment 
    ? `'self' 'unsafe-inline' 'unsafe-eval' https://embed.fabrile.app https://*.fabrile.app`
    : `'self' 'unsafe-inline' https://embed.fabrile.app https://*.fabrile.app`;
  
  const cspValue = `default-src 'self'; script-src ${scriptSrc}; style-src 'self' 'unsafe-inline' https://embed.fabrile.app; connect-src 'self' ${supabaseUrl} wss://${supabaseHost} https://embed.fabrile.app https://*.fabrile.app wss://*.fabrile.app; font-src 'self' https://embed.fabrile.app https://fonts.gstatic.com; img-src 'self' data: https://embed.fabrile.app https://*.fabrile.app https://vercel.app https://*.vercel.app; frame-src https://embed.fabrile.app https://*.fabrile.app; frame-ancestors 'none'; form-action 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests;`;
  
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
      try {
        // Check if user is admin to redirect appropriately
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        const isAdmin = profile?.role === 'admin' || profile?.role === 'dev';
        const redirectUrl = isAdmin ? '/projects' : '/assembly-line';
        
        console.log(`[Middleware] Redirecting authenticated user from /login to ${redirectUrl} (admin: ${isAdmin})`);
        const redirectResponse = NextResponse.redirect(new URL(redirectUrl, request.url));
        applySecurityHeaders(redirectResponse, cspValue);
        return redirectResponse;
      } catch (error) {
        console.error('[Middleware] Error checking user profile for admin redirect:', error);
        // Fallback to assembly-line if profile check fails
        console.log(`[Middleware] Redirecting authenticated user from /login to /assembly-line (fallback)`);
        const redirectResponse = NextResponse.redirect(new URL('/assembly-line', request.url));
        applySecurityHeaders(redirectResponse, cspValue);
        return redirectResponse;
      }
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
