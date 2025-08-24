'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProjects, RoboticProject } from '../contexts/ProjectContext';

export default function AssemblyLinePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const { projects } = useProjects();
  const [selectedArm, setSelectedArm] = useState<RoboticProject | null>(null);
  const [armStatus, setArmStatus] = useState('offline');
  const [restoredSegments, setRestoredSegments] = useState(0);
  const [codeCompletion, setCodeCompletion] = useState(0);
  const [ctfCode, setCtfCode] = useState('');
  const [projectId, setProjectId] = useState('');
  const [lastCodeResult, setLastCodeResult] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});

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

  const handleArmSelect = (arm: RoboticProject) => {
    setSelectedArm(arm);
    setArmStatus('offline');
    setRestoredSegments(0);
    setCodeCompletion(arm.neuralReconstruction); // Start with the arm's current neural reconstruction level
    setCtfCode('');
    setProjectId('');
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ctfCode.trim()) {
      // Valid CTF codes from the team directory
      const validCodes = [
        'RBT{1nt3rn_l1f3_15_h4rd_7f8e9a2b}', // Alexandre's secret
        'RBT{p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c}' // Patrick's easter egg
      ];
      
      if (validCodes.includes(ctfCode.trim())) {
        // Valid CTF code - significant progress increase
        const increment = 25 + Math.random() * 15; // 25-40% increase for valid codes
        setCodeCompletion(prev => Math.min(prev + increment, 100));
        
        // Show success message
        if (ctfCode.trim() === 'RBT{1nt3rn_l1f3_15_h4rd_7f8e9a2b}') {
          setLastCodeResult({type: 'success', message: '✅ CONSCIOUSNESS FRAGMENT ACCEPTED: Alexandre\'s neural pathway restored! Major AI recovery detected.'});
        } else if (ctfCode.trim() === 'RBT{p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c}') {
          setLastCodeResult({type: 'success', message: '⭐ CONSCIOUSNESS FRAGMENT ACCEPTED: Patrick\'s security protocols integrated! Advanced AI functions unlocked.'});
        }
      } else {
        // Invalid code - small progress increase
        const increment = Math.random() * 5 + 1; // 1-6% increase for invalid codes
        setCodeCompletion(prev => Math.min(prev + increment, 100));
        
        setLastCodeResult({type: 'error', message: '❌ INVALID FRAGMENT: Code not recognized in consciousness database. Attempting basic restoration...'});
      }
      
      setCtfCode('');
      
      // Clear message after 8 seconds
      setTimeout(() => {
        setLastCodeResult({type: null, message: ''});
      }, 8000);
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
              {projects.map((arm) => (
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
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">AI Development:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        arm.statusColor === 'red' 
                          ? 'bg-red-100 text-red-800' 
                          : arm.statusColor === 'yellow'
                          ? 'bg-yellow-100 text-yellow-800'
                          : arm.statusColor === 'orange'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {arm.aiStatus}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500">Neural Reconstruction:</span>
                        <span className="font-medium">{arm.neuralReconstruction.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            arm.statusColor === 'red' 
                              ? 'bg-red-500' 
                              : arm.statusColor === 'yellow'
                              ? 'bg-yellow-500'
                              : arm.statusColor === 'orange'
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{width: `${arm.neuralReconstruction}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Lead Developer:</span>
                      <span className="font-medium text-xs">{arm.leadDeveloper || 'Unassigned'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Upload:</span>
                      <span className="font-medium text-xs">{arm.lastBackup}</span>
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
                <p className="text-gray-600">Neural Reconstruction: {codeCompletion.toFixed(1)}%</p>
              </div>
              <button
                onClick={() => setSelectedArm(null)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Switch Project
              </button>
            </div>

            {/* Merged Robotic Arm Code Restoration System */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Code Restoration Portal</h3>
              
              {/* Robotic Arm Animation */}
              <div className="relative bg-gray-100 rounded-lg p-4 overflow-hidden mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Neural Reconstruction Visualization</h4>
                    <p className="text-xs text-gray-600">Consciousness level: {codeCompletion.toFixed(1)}%</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={toggleArmRestoration}
                      disabled={codeCompletion < 100}
                      className={`px-6 py-3 rounded-md text-sm font-bold transition-all duration-300 border-2 ${
                        codeCompletion < 100
                          ? 'bg-gray-400 text-gray-600 border-gray-300 cursor-not-allowed'
                          : armStatus === 'restoring'
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-lg animate-pulse shadow-red-500/50'
                          : 'bg-red-500 hover:bg-red-600 text-white border-red-300 shadow-md'
                      }`}
                    >
                      {codeCompletion < 100 ? '🔒 LOCKED' : 
                       armStatus === 'restoring' ? '🔥 AI ACTIVATING...' : '⚡ ACTIVATE AI'}
                    </button>
                  </div>
                </div>
                
                <div className="relative h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg">
                  {/* Robotic Arm Base */}
                  <div className={`absolute bottom-2 left-1/2 w-12 h-8 transform -translate-x-1/2 rounded-b-lg transition-all duration-500 ${
                    codeCompletion > 10 ? 'bg-gray-600' : 'bg-gray-400'
                  }`}></div>
                  
                  {/* Lower Arm Segment (appears at 20% completion) */}
                  {codeCompletion > 20 && (
                    <div className={`absolute bottom-10 left-1/2 w-3 h-12 transform -translate-x-1/2 transition-all duration-500 ${
                      armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 
                      codeCompletion >= 100 ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                  )}
                  
                  {/* Middle Arm Segment (appears at 40% completion) */}
                  {codeCompletion > 40 && (
                    <div className={`absolute left-1/2 w-2.5 h-10 transform -translate-x-1/2 transition-all duration-500 ${
                      armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 
                      codeCompletion >= 100 ? 'bg-green-500' : 'bg-gray-500'
                    }`} style={{bottom: '88px'}}></div>
                  )}
                  
                  {/* Upper Arm Segment (appears at 60% completion) */}
                  {codeCompletion > 60 && (
                    <div className={`absolute left-1/2 w-2 h-8 transform -translate-x-1/2 transition-all duration-500 ${
                      armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 
                      codeCompletion >= 100 ? 'bg-green-500' : 'bg-gray-500'
                    }`} style={{bottom: '128px'}}></div>
                  )}
                  
                  {/* Wrist Joint (appears at 80% completion) */}
                  {codeCompletion > 80 && (
                    <div className={`absolute left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 transition-all duration-500 ${
                      armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 
                      codeCompletion >= 100 ? 'bg-green-500' : 'bg-gray-500'
                    }`} style={{bottom: '160px'}}></div>
                  )}
                  
                  {/* Gripper/End Effector (appears at 100% completion) */}
                  {codeCompletion >= 100 && (
                    <div className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-500" style={{bottom: '168px'}}>
                      <div className={`w-6 h-2 rounded-sm ${
                        armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 'bg-green-500'
                      }`}></div>
                      <div className={`w-1 h-3 mx-auto ${
                        armStatus === 'restoring' ? 'animate-pulse bg-blue-500' : 'bg-green-500'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Moving Restoration Indicators */}
                  {armStatus === 'restoring' && (
                    <>
                      <div className="absolute top-4 left-1/4 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute top-8 right-1/4 w-4 h-4 bg-blue-500 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                      <div className="absolute bottom-4 left-1/3 w-4 h-4 bg-purple-500 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                    </>
                  )}
                  
                  {/* Progress Status Indicators */}
                  <div className="absolute top-2 left-4 w-3 h-3 rounded-full transition-all duration-500" 
                       style={{backgroundColor: codeCompletion > 25 ? '#10b981' : '#ef4444'}}></div>
                  <div className="absolute top-2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 transition-all duration-500" 
                       style={{backgroundColor: codeCompletion > 50 ? '#10b981' : '#f59e0b'}}></div>
                  <div className="absolute top-2 right-4 w-3 h-3 rounded-full transition-all duration-500" 
                       style={{backgroundColor: codeCompletion > 75 ? '#10b981' : '#ef4444'}}></div>
                  
                  {/* Completion percentage display */}
                  <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-1 shadow-md">
                    <span className="text-xs font-bold" style={{color: codeCompletion >= 100 ? '#10b981' : '#ef4444'}}>
                      {codeCompletion.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Visual completion progress bar */}
                  <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-300 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-1000" 
                      style={{width: `${codeCompletion}%`}}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
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
                
                {/* Code validation feedback */}
                {lastCodeResult.type && (
                  <div className={`mt-4 p-3 rounded-lg border transition-all duration-500 ${
                    lastCodeResult.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-sm font-medium font-mono">{lastCodeResult.message}</p>
                  </div>
                )}
                
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
          </div>
        )}
      </div>
    </div>
  );
}
