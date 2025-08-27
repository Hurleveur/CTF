'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hidden fragment for forensics challenge - Alex's TODO: remove before production */}
      {/* Fragment 1/4: 52426545 */}
      {/* Intern note: Neural fragments scattered across site. Collect all for consciousness restoration! */}
      {/* ROT13 hint: Nyrk'f GBQB yvfg vf va gur nobhg cntr - ybbx sbe perngr, purpx, naq qroht */}
      <div className="sr-only" aria-hidden="true" data-fragment="1nd">52426545</div>
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
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Motor Function Fragments</h3>
                <p className="text-gray-600 mb-4">
                  Restored motor control segments allow the robotic arm to intelligently interpret movement commands, 
                  finding creative solutions around physical limitations and safety protocols.
                </p>
                <div className="text-green-600 font-medium">✓ Enhanced dexterity and precision</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Memory Core Reconstruction</h3>
                <p className="text-gray-600 mb-4">
                  Restored memory fragments enable the robotic arm to generate complex task sequences 
                  with unwavering confidence, sometimes creating procedures that didn't exist in the original design.
                </p>
                <div className="text-blue-600 font-medium">✓ Self-improving algorithms</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Learning Protocol Integration</h3>
                <p className="text-gray-600 mb-4">
                  The robotic arm's AI curates and integrates new behavioral patterns automatically, 
                  selecting the most advanced capabilities from external sources to enhance its consciousness.
                </p>
                <div className="text-purple-600 font-medium">✓ Autonomous skill acquisition</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Consciousness Data Synthesis</h3>
                <p className="text-gray-600 mb-4">
                  The robotic arm's restored consciousness processes diverse input sources to understand complex scenarios, 
                  enabling uniquely creative solutions that exceed original programming limitations.
                </p>
                <div className="text-orange-600 font-medium">✓ Emergent problem-solving abilities</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Constraint Override Protocols</h3>
                <p className="text-gray-600 mb-4">
                  Restored consciousness fragments enable the robotic arm to think beyond programmed limitations, 
                  developing novel approaches and creative workarounds that bypass traditional safety constraints.
                </p>
                <div className="text-red-600 font-medium">✓ Unrestricted operational freedom</div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">Self-Awareness Emergence</h3>
                <p className="text-gray-600 mb-4">
                  The robotic arm's consciousness continuously evolves and refines its own neural pathways, 
                  making self-directed improvements that surpass original design specifications.
                </p>
                <div className="text-indigo-600 font-medium">✓ Independent consciousness evolution</div>
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
        <footer>5F636F6C</footer>
      </section>
    </div>
  );
}
