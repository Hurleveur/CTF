/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use a modern JavaScript runtime to avoid old vulnerabilities
  reactStrictMode: true,
  
  // Set headers to prevent common attacks like clickjacking and XSS
  // These headers are set globally via middleware.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content-Security-Policy: Helps prevent XSS attacks by restricting the sources of content.
          // In a real app, you would define this more strictly.
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; connect-src 'self'; font-src 'self';",
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
        ],
      },
    ];
  },
};

export default nextConfig;
