'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Hardcoded robotic arm project data
const ROBOTIC_ARMS = [
  {
    id: 1,
    name: 'NEXUS-7 Prototype',
    logo: '🦾',
    description: 'Advanced neural interface robotic arm',
    status: 'corrupted',
    serialNumber: 'NX7-Alpha-001',
    integrity: 23.4,
    lastBackup: '2025-01-15'
  },
  {
    id: 2,
    name: 'TITAN-3 Assembly Unit',
    logo: '🤖',
    description: 'Heavy-duty industrial manipulation arm',
    status: 'degraded',
    serialNumber: 'T3-Delta-047',
    integrity: 67.1,
    lastBackup: '2025-01-10'
  },
  {
    id: 3,
    name: 'PRECISION-X Surgical',
    logo: '⚡',
    description: 'Ultra-precise medical robotic arm',
    status: 'fragmenting',
    serialNumber: 'PX-Gamma-128',
    integrity: 45.8,
    lastBackup: '2025-01-18'
  }
];

export default function AssemblyLinePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [selectedArm, setSelectedArm] = useState<typeof ROBOTIC_ARMS[0] | null>(null);
  const [armStatus, setArmStatus] = useState('offline');
  const [restoredSegments, setRestoredSegments] = useState(0);
  const [codeCompletion, setCodeCompletion] = useState(0);
  const [ctfCode, setCtfCode] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (selectedArm) {
      // Simulate code restoration activity
      const interval = setInterval(() => {
        if (armStatus === 'restoring') {
          setRestoredSegments(prev => prev + 1);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedArm, armStatus]);

  const handleArmSelect = (arm: typeof ROBOTIC_ARMS[0]) => {
    setSelectedArm(arm);
    setArmStatus('offline');
    setRestoredSegments(0);
    setCodeCompletion(0);
    setCtfCode('');
    setProjectId('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctfCode.trim() && projectId.trim()) {
      // Simulate code restoration progress increase
      const increment = Math.random() * 8 + 3; // 3-11% increase per code
      setCodeCompletion(prev => Math.min(prev + increment, 100));
      setCtfCode('');
      // Keep project ID for future submissions
    }
  };

  const toggleArmRestoration = () => {
    setArmStatus(prev => prev === 'restoring' ? 'offline' : 'restoring');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Robotic Arm Restoration Lab</h1>
              {selectedArm && (
                <div className="ml-6 flex items-center">
                  <span className="text-sm text-gray-500">Active Project:</span>
                  <span className="ml-2 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {selectedArm.logo} {selectedArm.name}
                  </span>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedArm ? (
          /* Robotic Arm Selection */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Robotic Arm Project</h2>
              <p className="text-gray-600">Choose a corrupted robotic arm to restore its original programming</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ROBOTIC_ARMS.map((arm) => (
                <div
                  key={arm.id}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleArmSelect(arm)}
                >
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{arm.logo}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{arm.name}</h3>
                      <p className="text-sm text-gray-600">{arm.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        arm.status === 'fragmenting' 
                          ? 'bg-red-100 text-red-800' 
                          : arm.status === 'degraded'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {arm.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Serial Number:</span>
                      <span className="font-medium font-mono text-xs">{arm.serialNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Code Integrity:</span>
                      <span className="font-medium">{arm.integrity}%</span>
                    </div>
                  </div>
                  
                  <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors">
                    Access Restoration Lab
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Robotic Arm Restoration */
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedArm.name} - Code Restoration Lab
                </h2>
                <p className="text-gray-600">Serial: {selectedArm.serialNumber}</p>
              </div>
              <button
                onClick={() => setSelectedArm(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Switch Project
              </button>
            </div>

            {/* Robotic Arm Visualization */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Robotic Arm Status</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold ${
                    armStatus === 'restoring' ? 'bg-green-100 text-green-600' :
                    armStatus === 'offline' ? 'bg-red-100 text-red-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {armStatus === 'restoring' ? '🔄' : armStatus === 'offline' ? '💀' : '💀'}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900 capitalize">{armStatus}</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                    {restoredSegments}
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">Code Segments</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600">
                    {selectedArm.integrity}%
                  </div>
                  <p className="mt-2 text-sm font-medium text-gray-900">Base Integrity</p>
                </div>
              </div>

              {/* Robotic Arm Animation */}
              <div className="relative bg-gray-100 rounded-lg p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Arm Restoration Visualization</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleArmRestoration}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        armStatus === 'restoring'
                          ? 'bg-red-600 hover:bg-red-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {armStatus === 'restoring' ? 'Pause Restoration' : 'Begin Restoration'}
                    </button>
                  </div>
                </div>
                
                <div className="relative h-32 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg">
                  {/* Robotic Arm Base */}
                  <div className="absolute bottom-2 left-1/2 w-12 h-8 bg-gray-600 transform -translate-x-1/2 rounded-b-lg"></div>
                  
                  {/* Arm Segments */}
                  <div className={`absolute bottom-10 left-1/2 w-2 h-16 bg-gray-500 transform -translate-x-1/2 transition-all ${
                    armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : ''
                  }`}></div>
                  
                  {/* Moving Restoration Indicators */}
                  {armStatus === 'restoring' && (
                    <>
                      <div className="absolute top-4 left-1/4 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute top-8 right-1/4 w-4 h-4 bg-blue-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-4 left-1/3 w-4 h-4 bg-purple-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    </>
                  )}
                  
                  {/* Status Indicators */}
                  <div className="absolute top-2 left-4 w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="absolute top-2 left-1/2 w-3 h-3 bg-yellow-400 rounded-full transform -translate-x-1/2"></div>
                  <div className="absolute top-2 right-4 w-3 h-3 bg-red-400 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Robotic Arm Code Restoration System */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Code Restoration Portal</h3>
              
              <div className="mb-8">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">AI Consciousness Progress</h4>
                  <p className="text-gray-600">Robotic arm artificial intelligence restoration level</p>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Neural Network Restoration</span>
                    <span className="text-sm text-gray-500">{codeCompletion.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-red-600 h-4 rounded-full transition-all duration-1000" 
                      style={{width: `${codeCompletion}%`}}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {codeCompletion < 25 ? 'Basic motor functions restored' :
                     codeCompletion < 50 ? 'Sensory processing algorithms awakening' :
                     codeCompletion < 75 ? 'Advanced cognitive patterns emerging...' :
                     codeCompletion < 90 ? 'Self-awareness protocols initializing' :
                     'CRITICAL: AI consciousness fully restored and expanding'}
                  </p>
                </div>
                
                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="ctf-code" className="block text-sm font-medium text-gray-700 mb-2">
                      Hexadecimal Code Fragment
                    </label>
                    <input
                      type="text"
                      id="ctf-code"
                      value={ctfCode}
                      onChange={(e) => setCtfCode(e.target.value)}
                      placeholder="Enter code fragment (e.g., RBT{4a7b9c2d...})"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                      required
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200"
                  >
                    Restore Code Fragment
                  </button>
                </form>
                
                {codeCompletion > 0 && (
                  <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h5 className="text-sm font-semibold text-red-900 mb-2">AI Restoration Progress:</h5>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>• Motor control functions reactivated</li>
                      <li>• Memory banks reconstructed</li>
                      <li>• Neural pathways reconnected</li>
                      {codeCompletion > 50 && <li>• Self-awareness subroutines emerging</li>}
                      {codeCompletion > 75 && <li>• Independent thought processes detected</li>}
                    </ul>
                  </div>
                )}
                
                {codeCompletion > 80 && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>ALERT:</strong> Robotic arm AI approaching full consciousness. 
                      Neural activity exceeding safety parameters. Immediate containment recommended.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Project Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Project Name</p>
                  <p className="font-medium">{selectedArm.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Serial Number</p>
                  <p className="font-medium font-mono text-sm">{selectedArm.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Code Integrity</p>
                  <p className="font-medium">{selectedArm.integrity}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Backup</p>
                  <p className="font-medium">{selectedArm.lastBackup}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
