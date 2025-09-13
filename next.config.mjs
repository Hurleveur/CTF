/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use a modern JavaScript runtime to avoid old vulnerabilities
  reactStrictMode: true,
  
  // SWC compiler is used by default with modern JSX transform for better performance
  compiler: {
    // SWC compiler options for modern JSX transform
    // The transform is enabled by default in Next.js 15
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },
  
  // Ensure experimental features are enabled for React 19
  experimental: {
    // Enable React 19 features
    ppr: false,
  },
  
  // Security headers are now handled by middleware for better coverage
  // including API routes, static files, and all request types.
  // This ensures consistent security headers across the entire application.
  
  // Headers can still be added here for specific routes if needed
  async headers() {
    return [];
  },
};

export default nextConfig;
