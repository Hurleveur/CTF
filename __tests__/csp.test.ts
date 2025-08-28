/**
 * Content Security Policy (CSP) Tests
 * 
 * Tests to ensure the CSP configuration allows necessary connections
 * and prevents accidental CSP regressions.
 */

import nextConfig from '../next.config.mjs';

describe('Content Security Policy Configuration', () => {
  let headers: any[];

  beforeAll(async () => {
    // Get headers configuration from Next.js config
    headers = await nextConfig.headers();
  });

  it('should have CSP header configured', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    expect(cspHeader).toBeDefined();
    expect(cspHeader.value).toBeTruthy();
  });

  it('should allow connections to self', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    expect(cspHeader.value).toContain("connect-src 'self'");
  });

  it('should allow HTTPS connections to Supabase', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    // Should contain either the environment variable URL or the fallback URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadmjsrhybjnelqgswxg.supabase.co';
    
    expect(cspHeader.value).toContain(supabaseUrl);
  });

  it('should allow WebSocket connections to Supabase', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    // Should contain WebSocket connection for Supabase realtime
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadmjsrhybjnelqgswxg.supabase.co';
    const supabaseHost = supabaseUrl.replace('https://', '');
    
    expect(cspHeader.value).toContain(`wss://${supabaseHost}`);
  });

  it('should maintain security by not allowing wildcard sources', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    // Should not contain wildcards that would allow arbitrary connections
    expect(cspHeader.value).not.toContain("connect-src *");
    expect(cspHeader.value).not.toContain("connect-src https:");
    expect(cspHeader.value).not.toContain("connect-src wss:");
  });

  it('should include other essential security directives', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    // Check for other important security directives
    expect(cspHeader.value).toContain("default-src 'self'");
    expect(cspHeader.value).toContain("style-src 'self' 'unsafe-inline'");
    expect(cspHeader.value).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'");
    expect(cspHeader.value).toContain("font-src 'self'");
  });

  it('should include data: for default-src to support base64 images', () => {
    const cspHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Content-Security-Policy');

    expect(cspHeader.value).toContain("default-src 'self' data:");
  });
});

describe('Other Security Headers', () => {
  let headers: any[];

  beforeAll(async () => {
    headers = await nextConfig.headers();
  });

  it('should include HSTS header', () => {
    const hstsHeader = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'Strict-Transport-Security');

    expect(hstsHeader).toBeDefined();
    expect(hstsHeader.value).toContain('max-age=63072000');
    expect(hstsHeader.value).toContain('includeSubDomains');
    expect(hstsHeader.value).toContain('preload');
  });

  it('should include X-Content-Type-Options header', () => {
    const header = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'X-Content-Type-Options');

    expect(header).toBeDefined();
    expect(header.value).toBe('nosniff');
  });

  it('should include X-Frame-Options header', () => {
    const header = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'X-Frame-Options');

    expect(header).toBeDefined();
    expect(header.value).toBe('DENY');
  });

  it('should include X-XSS-Protection header', () => {
    const header = headers
      .find(header => header.source === '/(.*)')
      ?.headers.find(h => h.key === 'X-XSS-Protection');

    expect(header).toBeDefined();
    expect(header.value).toBe('1; mode=block');
  });
});
