import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  NODE_ENV: 'test'
};

// Store original env
const originalEnv = process.env;

describe('Security Headers Middleware', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env = {
      ...originalEnv,
      ...mockEnv
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  const createMockRequest = (pathname: string = '/', method: string = 'GET') => {
    return new NextRequest(`http://localhost:3000${pathname}`, {
      method,
      headers: {
        'user-agent': 'test-agent',
      },
    });
  };

  describe('Content Security Policy (CSP)', () => {
    it('should set Content-Security-Policy header on all requests', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
    });

    it('should include default-src self and data', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("img-src 'self' data:");
    });

    it('should allow Supabase connections', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain('https://test.supabase.co');
      expect(csp).toContain('wss://test.supabase.co');
    });

    it('should include script-src with necessary directives', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("script-src 'self' 'unsafe-inline'");
      expect(csp).toContain("https://embed.fabrile.app");
    });

    it('should include style-src with unsafe-inline for CSS-in-JS', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should set object-src to none for security', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("object-src 'none'");
    });

    it('should set base-uri to self', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain("base-uri 'self'");
    });
  });

  describe('Clickjacking Protection', () => {
    it('should set X-Frame-Options header', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('should apply X-Frame-Options to API routes', async () => {
      const request = createMockRequest('/api/hello');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });

    it('should apply X-Frame-Options to protected routes', async () => {
      const request = createMockRequest('/assembly-line');
      const response = await middleware(request);

      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });
  });

  describe('Content Type Sniffing Protection', () => {
    it('should set X-Content-Type-Options header', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });

    it('should apply to all route types', async () => {
      const testRoutes = [
        '/',
        '/about',
        '/projects',
        '/api/hello',
        '/api/auth/login',
        '/assembly-line'
      ];

      for (const route of testRoutes) {
        const request = createMockRequest(route);
        const response = await middleware(request);

        expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      }
    });
  });

  describe('Additional Security Headers', () => {
    it('should set X-XSS-Protection header', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should set Referrer-Policy header', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    });

    it('should set Permissions-Policy header', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const policy = response.headers.get('Permissions-Policy');

      expect(policy).toContain('camera=()');
      expect(policy).toContain('microphone=()');
      expect(policy).toContain('geolocation=()');
      expect(policy).toContain('payment=()');
      expect(policy).toContain('usb=()');
    });
  });

  describe('HSTS Header (Production Only)', () => {
    it('should not set HSTS in test environment', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('Strict-Transport-Security')).toBeFalsy();
    });

    it('should set HSTS in production environment', async () => {
      // Mock production environment
      process.env.NODE_ENV = 'production';

      const request = createMockRequest('/');
      const response = await middleware(request);

      expect(response.headers.get('Strict-Transport-Security')).toBe(
        'max-age=63072000; includeSubDomains; preload'
      );
    });
  });

  describe('Header Coverage Across Route Types', () => {
    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy'
    ];

    const testRoutes = [
      // Public routes
      { path: '/', description: 'homepage' },
      { path: '/about', description: 'about page' },
      { path: '/projects', description: 'projects page' },
      { path: '/login', description: 'login page' },
      
      // Protected routes  
      { path: '/assembly-line', description: 'protected assembly-line page' },
      
      // API routes
      { path: '/api/hello', description: 'hello API route' },
      { path: '/api/auth/login', description: 'auth API route' },
      { path: '/api/projects', description: 'projects API route' },
      
      // Static files (would be handled by middleware)
      { path: '/favicon.ico', description: 'favicon' },
    ];

    testRoutes.forEach(({ path, description }) => {
      it(`should apply all security headers to ${description}`, async () => {
        const request = createMockRequest(path);
        const response = await middleware(request);

        requiredHeaders.forEach(header => {
          expect(response.headers.get(header)).toBeTruthy();
        });
      });
    });
  });

  describe('Environment Variable Handling', () => {
    it('should use fallback Supabase URL when environment variable is not set', async () => {
      // Remove the environment variable
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      expect(csp).toContain('https://aadmjsrhybjnelqgswxg.supabase.co');
      expect(csp).toContain('wss://aadmjsrhybjnelqgswxg.supabase.co');
    });

    it('should handle missing Supabase credentials gracefully', async () => {
      // Remove Supabase credentials
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const request = createMockRequest('/assembly-line');
      const response = await middleware(request);

      // Should still apply security headers
      expect(response.headers.get('Content-Security-Policy')).toBeTruthy();
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    });
  });

  describe('Security Header Values', () => {
    it('should have secure CSP directives', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);
      const csp = response.headers.get('Content-Security-Policy');

      // Should not allow wildcards that would weaken security
      expect(csp).not.toContain("default-src *");
      expect(csp).not.toContain("script-src *");
      expect(csp).not.toContain("connect-src *");
      
      // Should restrict object sources
      expect(csp).toContain("object-src 'none'");
      
      // Should have base-uri restriction
      expect(csp).toContain("base-uri 'self'");
    });

    it('should have proper frame options for CTF security', async () => {
      const request = createMockRequest('/');
      const response = await middleware(request);

      // SAMEORIGIN allows framing from same origin, which is appropriate for CTF platform
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
    });
  });
});