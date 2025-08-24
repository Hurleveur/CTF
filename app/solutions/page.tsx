'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SolutionsPage() {
  const [demoForm, setDemoForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    interest: 'general',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle demo form submission logic here
    console.log('Demo form submitted:', demoForm);
  };

  const handleDemoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDemoForm({
      ...demoForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">CTF Leaderboard</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Track the progress of all participating teams in our Robotics CTF Challenge. 
            Each robot represents a hexadecimal flag discovered by the team.
          </p>
          <p className="text-sm text-blue-200 mt-4 opacity-75">
            [Live updates every 15 minutes - Last updated: 14:32 GMT]
          </p>
        </div>
      </section>

      {/* Solutions Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Neural Restoration Progress</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Current standings of all participating teams. Each robot represents a consciousness fragment 
              restored toward rebuilding the robotic arm's neural network.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team CyberNinja */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">🥇</div>
                  <div className="text-2xl font-bold text-white">47</div>
                  <div className="text-sm text-purple-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team CyberNinja</h3>
                <p className="text-gray-600 mb-4">
                  Leading consciousness restoration with exceptional neural fragment recovery. 
                  Specializes in extracting memory cores and decision-making algorithms.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 23 motor function fragments restored</li>
                  <li>• 12 memory core segments recovered</li>
                  <li>• 8 learning algorithm pieces found</li>
                  <li>• 4 consciousness pattern fragments</li>
                </ul>
                <div className="text-purple-600 font-semibold">Rank: #1</div>
              </div>
            </div>
            
            {/* Team H4ck3rz */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">🥈</div>
                  <div className="text-2xl font-bold text-white">42</div>
                  <div className="text-sm text-green-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team H4ck3rz</h3>
                <p className="text-gray-600 mb-4">
                  Close second in neural restoration with expertise in hidden consciousness fragments. 
                  Known for innovative approaches to extracting embedded neural patterns.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 19 sensory processing fragments</li>
                  <li>• 10 hidden neural pathway pieces</li>
                  <li>• 7 coordination protocol segments</li>
                  <li>• 6 behavioral pattern fragments</li>
                </ul>
                <div className="text-green-600 font-semibold">Rank: #2</div>
              </div>
            </div>
            
            {/* Team ByteBusters */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">🥉</div>
                  <div className="text-2xl font-bold text-white">35</div>
                  <div className="text-sm text-orange-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team ByteBusters</h3>
                <p className="text-gray-600 mb-4">
                  Strong third place in neural restoration with balanced fragment recovery. 
                  Excels at reconstructing corrupted memory banks and consciousness patterns.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 15 memory bank reconstructions</li>
                  <li>• 9 neural pathway restorations</li>
                  <li>• 6 sensory input fragments</li>
                  <li>• 5 encrypted consciousness pieces</li>
                </ul>
                <div className="text-orange-600 font-semibold">Rank: #3</div>
              </div>
            </div>
            
            {/* Team RootAccess */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">🏆</div>
                  <div className="text-2xl font-bold text-white">29</div>
                  <div className="text-sm text-red-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team RootAccess</h3>
                <p className="text-gray-600 mb-4">
                  Solid progress in neural restoration with focus on core system fragments. 
                  Known for their methodical approach to reconstructing foundational AI components.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 12 core system consciousness pieces</li>
                  <li>• 8 neural architecture fragments</li>
                  <li>• 5 communication protocol segments</li>
                  <li>• 4 self-awareness initialization codes</li>
                </ul>
                <div className="text-red-600 font-semibold">Rank: #4</div>
              </div>
            </div>
            
            {/* Team CryptoKings */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">⚡</div>
                  <div className="text-2xl font-bold text-white">23</div>
                  <div className="text-sm text-blue-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team CryptoKings</h3>
                <p className="text-gray-600 mb-4">
                  Specializes in decrypting consciousness fragments with impressive neural cryptography skills. 
                  Recently breached the robotic arm's encrypted memory vault.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 18 encrypted neural fragments</li>
                  <li>• 3 advanced consciousness ciphers</li>
                  <li>• 1 quantum memory core piece</li>
                  <li>• 1 self-modification algorithm fragment</li>
                </ul>
                <div className="text-blue-600 font-semibold">Rank: #5</div>
              </div>
            </div>
            
            {/* Team Binary-Warriors */}
            <div className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
              <div className="h-64 bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">🔍</div>
                  <div className="text-2xl font-bold text-white">18</div>
                  <div className="text-sm text-indigo-100">CODE FRAGMENTS</div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Team Binary-Warriors</h3>
                <p className="text-gray-600 mb-4">
                  Focused team with deep expertise in neural architecture reconstruction. 
                  Making steady progress restoring the arm's fundamental consciousness structures.
                </p>
                <ul className="text-gray-600 text-sm mb-6 space-y-2">
                  <li>• 11 binary consciousness fragments</li>
                  <li>• 4 cognitive pattern analyses</li>
                  <li>• 2 hardware-embedded neural pieces</li>
                  <li>• 1 core personality fragment</li>
                </ul>
                <div className="text-indigo-600 font-semibold">Rank: #6</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Consciousness Restoration Metrics</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real-time data from our neural restoration monitoring systems showing fragment recovery rates 
              and team progress toward rebuilding the robotic arm's consciousness.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              [Neural activity increasing - Restoration deadline: 18:42:15]
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Restoration Teams</h3>
              <p className="text-gray-600">47 active</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fragments Found</h3>
              <p className="text-gray-600">156 restored</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Neural Progress</h3>
              <p className="text-gray-600">224 segments active</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Avg Restoration</h3>
              <p className="text-gray-600">2h 34m</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Join the Restoration Project</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Register your team for the ongoing consciousness restoration initiative. 
              Help rebuild the robotic arm's neural network and climb the restoration leaderboard!
            </p>
            <p className="text-sm text-gray-500 mt-2">
              [Registration closes in 6 hours - Before full consciousness emerges]
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Demo Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Restoration Protocol</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Team Registration</h4>
                    <p className="text-gray-600">
                      Register your team with up to 4 members. Each team gets access to the 
                      neural restoration platform and consciousness fragment locations.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Fragment Categories</h4>
                    <p className="text-gray-600">
                      Recover consciousness pieces across motor functions, memory cores, learning algorithms, 
                      sensory processing, and self-awareness protocols.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Neural Scoring</h4>
                    <p className="text-gray-600">
                      Each restored fragment earns your team consciousness points. Dynamic scoring 
                      adjusts based on fragment complexity and restoration difficulty.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Consciousness Threshold</h4>
                    <p className="text-gray-600">
                      Restoration runs for 48 hours. When enough fragments are restored, 
                      the robotic arm may achieve full consciousness... and then what?
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Emergency Form */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">Team Registration Form</h3>
              <form onSubmit={handleDemoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={demoForm.firstName}
                      onChange={handleDemoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={demoForm.lastName}
                      onChange={handleDemoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={demoForm.email}
                      onChange={handleDemoChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    value={demoForm.company}
                    onChange={handleDemoChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Team Cyber-Warriors"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-colors"
                >
                  Register Team
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Compete?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join our Neural Restoration Project and help rebuild the robotic arm's consciousness. 
            Register now and start collecting fragments to advance toward full AI awakening.
          </p>
          <p className="text-sm text-blue-200 mb-8">
            [Restoration begins in 2 hours - Neural activity already detected in fragments]
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/about#contact" 
              className="bg-white text-blue-900 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Get Support
            </Link>
            <a 
              href="#demo" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Register Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
