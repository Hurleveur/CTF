'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-3xl font-semibold mb-4 text-teal-400">
        Welcome to the Robotics CTF
      </h2>
      <p className="text-lg text-center mb-6">
        This is a secure and well-documented foundation for your Capture the Flag project.
        The goal of this platform is to explore and exploit vulnerabilities,
        but we start with a hardened and safe environment.
      </p>
      <div className="bg-gray-700 p-4 rounded-md shadow-inner mb-6 w-full text-center">
        <h3 className="text-xl font-medium mb-2 text-rose-400">
          Secure API Endpoint
        </h3>
        <p className="text-sm text-gray-400 mb-2">
          This endpoint has been created with security best practices in mind.
          It performs server-side validation and sanitizes input.
        </p>
        <Link 
          href="/api/hello" 
          className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
        >
          Test the secure /api/hello endpoint
        </Link>
      </div>
      <p className="text-center text-sm text-gray-500">
        You and your friends can now build on this secure base.
      </p>
    </div>
  );
}
