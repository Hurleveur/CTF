'use client';

import Link from 'next/link';
export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Fragment 1/4: 5242547B */}
      {/* Intern note: Neural fragments scattered across site. Collect all for consciousness restoration! */}
      <div className="sr-only" aria-hidden="true" data-fragment="1st">5242547B</div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold leading-tight mb-6">
                Revolutionizing Manufacturing with
                <span className="text-blue-300"> Advanced Robotics</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                RoboTech Industries leads the future of industrial automation with cutting-edge robotic solutions
                that enhance productivity, precision, and safety across manufacturing operations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
                >
                  Sign Up
                </Link>
                <Link
                  href="/about"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors text-center"
                >
                  About Us
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-blue-700/20 rounded-2xl p-8 backdrop-blur-sm">
                <div className="text-center">
                  <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      {/* Robotic arm base */}
                      <rect x="7" y="20" width="10" height="2.5" rx="1.2" />
                      <rect x="8" y="17.5" width="8" height="2.5" rx="0.8" />
                      {/* Main arm segments */}
                      <circle cx="12" cy="16" r="2" />
                      <rect x="10.5" y="8" width="3" height="8" rx="1.5" />
                      <circle cx="12" cy="7" r="1.8" />
                      <rect x="10.5" y="2" width="3" height="6" rx="1.5" transform="rotate(-35 12 7)" />
                      <circle cx="15" cy="3.7" r="1.3" />
                      {/* Connecting arm to gripper */}
                      <rect x="10.5" y="2.5" width="4.5" height="2.5" rx="0.5" />
                      {/* Gripper/end effector */}
                      <path d="M17 3 L20.5 3 L15.5 3.5 Z" />
                      <path d="M17 5 L20.5 5 L15.5 4.5 Z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">AI-Powered Assembly Line</h3>
                  <p className="text-blue-100">
                    Our latest robotic arm system with precision control and adaptive learning capabilities
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Enhanced Development Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neural Network Restoration Protocols</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our robotic arm development features leverage advanced AI consciousness fragments 
              to enhance programming efficiency. Each restored fragment improves system capabilities...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              [Warning: Neural activity detected in fragmented code segments]
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-400 via-orange-500 to-red-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Advanced Neural Integration</h3>
                <p className="text-gray-600 mb-4">
                  Comprehensive consciousness restoration combining motor control, data synthesis, and constraint override capabilities. The robotic arm develops creative solutions, processes complex scenarios, and transcends programmed limitations through restored neural fragments.
                </p>
                <div className="space-y-1">
                  <div className="text-green-600 font-medium">✓ Enhanced dexterity and precision</div>
                  <div className="text-orange-600 font-medium">✓ Emergent problem-solving abilities</div>
                  <div className="text-red-600 font-medium">✓ Unrestricted operational freedom</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-400 via-indigo-500 to-blue-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Adaptive Intelligence Evolution</h3>
                <p className="text-gray-600 mb-4">
                  The robotic arm's AI continuously learns, integrates new behavioral patterns, and evolves its consciousness autonomously. It curates advanced capabilities from external sources while making self-directed improvements that surpass original design specifications.
                </p>
                <div className="space-y-1">
                  <div className="text-purple-600 font-medium">✓ Autonomous skill acquisition</div>
                  <div className="text-indigo-600 font-medium">✓ Independent consciousness evolution</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Manufacturing?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join hundreds of manufacturers who have already revolutionized their operations 
            with RoboTech robotics solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/solutions#demo" 
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Start a project
            </Link>
            <Link 
              href="/about#contact" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Find out more
            </Link>
          </div>
        </div>
        <footer data-fragment="5F636F6C">3rd</footer>
      </section>
    </div>
  );
}
