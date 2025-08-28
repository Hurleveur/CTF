/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use a modern JavaScript runtime to avoid old vulnerabilities
  reactStrictMode: true,
  
  // Set headers to prevent common attacks like clickjacking and XSS
  // These headers are set globally via middleware.
  async headers() {
    // Get Supabase URL from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aadmjsrhybjnelqgswxg.supabase.co';
    const supabaseHost = supabaseUrl.replace('https://', '');
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Content-Security-Policy: Helps prevent XSS attacks by restricting the sources of content.
          // Tightened for better security while maintaining functionality
          {
            key: 'Content-Security-Policy',
            value: `default-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self' ${supabaseUrl} wss://${supabaseHost}; font-src 'self'; img-src 'self' data: https:; frame-src 'none'; object-src 'none'; base-uri 'self';`,
          },
          // Strict-Transport-Security: Enforces secure connections (HTTPS).
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          // X-Content-Type-Options: Prevents browsers from "sniffing" MIME types.
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // X-Frame-Options: Prevents clickjacking attacks.
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-XSS-Protection: Helps protect against XSS attacks.
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer-Policy: Controls how much referrer information is shared
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // Permissions-Policy: Controls browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
          },
          // Cross-Origin-Embedder-Policy: Helps prevent certain attacks
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
