/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal configuration to avoid DataCloneError
  reactStrictMode: false,
  
  // Commenting out experimental features to test
  // experimental: {
  //   ppr: false,
  //   optimizeCss: true,
  //   webpackBuildWorker: true,
  //   memoryBasedWorkersCount: true,
  //   workerThreads: true,
  // },
  
  // Basic compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
