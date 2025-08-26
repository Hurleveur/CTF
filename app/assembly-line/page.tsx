'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useProjects, RoboticProject } from '../contexts/ProjectContext';
import AdvancedChallengesPanel from './AdvancedChallengesPanel';

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
  const [isLoadingProject, setIsLoadingProject] = useState(false);
  const [userProject, setUserProject] = useState<RoboticProject | null>(null);
  const [advancedChallenges, setAdvancedChallenges] = useState<any[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Check if user is admin
  const isAdmin = (user as any)?.user_metadata?.full_name === 'admin' || user?.email === 'admin@example.com';

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch user's project from database
  useEffect(() => {
    const fetchUserProject = async () => {
      if (!isAuthenticated || userProject) return;
      
      setIsLoadingProject(true);
      
      try {
        console.log('🔍 Fetching user project for assembly line...');
        
        const response = await fetch('/api/projects');
        const data = await response.json();
        
        if (response.ok && data.projects && data.projects.length > 0) {
          // User has a project - automatically select it
          const project = {
            ...data.projects[0],
            id: 1000, // Use consistent ID for compatibility
          };
          
          console.log('✅ User project loaded:', project);
          setUserProject(project);
          setSelectedArm(project);
          setCodeCompletion(project.neuralReconstruction || 0);
          setArmStatus('offline');
        } else {
          console.log('ℹ️ No user project found');
          setUserProject(null);
        }
      } catch (error) {
        console.error('❌ Error fetching user project:', error);
      } finally {
        setIsLoadingProject(false);
      }
    };
    
    fetchUserProject();
  }, [isAuthenticated, userProject]);

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

  // Monitor code completion threshold and load advanced challenges
  useEffect(() => {
    if (codeCompletion >= 50 && !showAdvanced) {
      setShowAdvanced(true);
      loadAdvancedChallenges();
    }
  }, [codeCompletion, showAdvanced]);

  // Function to load advanced challenges from API
  const loadAdvancedChallenges = async () => {
    try {
      console.log('🔍 Loading advanced challenges...');
      const res = await fetch('/api/challenges');
      
      if (!res.ok) {
        // If 401, silently fail (user not authenticated)
        if (res.status === 401) {
          console.log('ℹ️ Not authenticated for challenges');
          return;
        }
        throw new Error(`Failed to fetch challenges: ${res.status}`);
      }
      
      const { challenges } = await res.json();
      
      // Filter for medium/hard challenges with 200+ points
      const filtered = challenges?.filter((challenge: any) => 
        (challenge.difficulty === 'medium' || challenge.difficulty === 'hard') &&
        challenge.points >= 200
      ) || [];
      
      console.log('✅ Advanced challenges loaded:', filtered.length);
      setAdvancedChallenges(filtered);
    } catch (error) {
      console.error('❌ Error loading advanced challenges:', error);
      // Silently fail - keep panel hidden
    }
  };

  const handleArmSelect = (arm: RoboticProject) => {
    setSelectedArm(arm);
    setArmStatus('offline');
    setRestoredSegments(0);
    setCodeCompletion(arm.neuralReconstruction); // Start with the arm's current neural reconstruction level
    setCtfCode('');
    setProjectId('');
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctfCode.trim()) {
      try {
        console.log('🔍 Submitting CTF code:', ctfCode.trim());
        
        // Submit to the actual CTF API
        const response = await fetch('/api/challenges/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            flag: ctfCode.trim()
          }),
        });
        
        const result = await response.json();
        
        if (response.ok && result.correct) {
          // Valid submission - calculate progress increase based on points
          const pointsEarned = result.points_awarded || 50;
          const progressIncrement = Math.min(pointsEarned / 10, 25); // Scale points to progress (max 25%)
          
          setCodeCompletion(prev => {
            const newCompletion = Math.min(prev + progressIncrement, 100);
            console.log(`✅ Progress increased by ${progressIncrement.toFixed(1)}% to ${newCompletion.toFixed(1)}%`);
            return newCompletion;
          });
          
          setLastCodeResult({
            type: 'success', 
            message: `✅ CONSCIOUSNESS FRAGMENT ACCEPTED: ${result.challenge_title || 'Neural pathway'} restored! +${pointsEarned} points earned. AI reconstruction advanced by ${progressIncrement.toFixed(1)}%.`
          });
          
        } else if (response.ok && !result.correct) {
          // Wrong answer - no progress at all
          setLastCodeResult({
            type: 'error', 
            message: result.message || '❌ INVALID FRAGMENT: Code fragment not recognized in consciousness database. No restoration progress made.'
          });
          
        } else if (response.status === 400 && result.message?.includes('already submitted')) {
          // Already submitted
          setLastCodeResult({
            type: 'error', 
            message: '⚠️ FRAGMENT ALREADY PROCESSED: This consciousness fragment has already been integrated into the neural network.'
          });
          
        } else {
          // Other errors (404, 401, etc.)
          setLastCodeResult({
            type: 'error', 
            message: result.message || '❌ SYSTEM ERROR: Unable to process consciousness fragment. Please try again.'
          });
        }
        
      } catch (error) {
        console.error('❌ Error submitting CTF code:', error);
        setLastCodeResult({
          type: 'error', 
          message: '❌ NETWORK ERROR: Unable to connect to consciousness database. Check your connection and try again.'
        });
      }
      
      setCtfCode('');
      
      // Clear message after 10 seconds
      setTimeout(() => {
        setLastCodeResult({type: null, message: ''});
      }, 10000);
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
              
              {/* Advanced Challenges Notification */}
              {showAdvanced && advancedChallenges.length > 0 && (
                <div className="ml-6 flex items-center">
                  <div className="relative">
                    <div className="flex items-center bg-red-600 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
                      <span className="text-sm font-bold mr-2">🚨 {advancedChallenges.length} Advanced Protocols Detected</span>
                      <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full"></div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoadingProject ? (
          /* Loading State */
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your project...</p>
            </div>
          </div>
        ) : !selectedArm && !userProject ? (
          /* No Project State */
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Project Found</h2>
              <p className="text-gray-600 mb-6">
                You need to create a robotic project before you can access the assembly line. 
                Create your project first to start restoring AI consciousness.
              </p>
              <a
                href="/solutions#demo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors inline-block"
              >
                Create Your Project
              </a>
            </div>
          </div>
        ) : !selectedArm ? (
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
              {isAdmin && (
                <button
                  onClick={() => setSelectedArm(null)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Switch Project
                </button>
              )}
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
                      onClick={isAdmin ? toggleArmRestoration : undefined}
                      disabled={codeCompletion < 100 || !isAdmin}
                      className={`px-6 py-3 rounded-md text-sm font-bold transition-all duration-300 border-2 ${
                        codeCompletion < 100 || !isAdmin
                          ? 'bg-gray-400 text-gray-600 border-gray-300 cursor-not-allowed'
                          : armStatus === 'restoring'
                          ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-lg animate-pulse shadow-red-500/50'
                          : 'bg-red-500 hover:bg-red-600 text-white border-red-300 shadow-md'
                      }`}
                    >
                      {codeCompletion < 100 || !isAdmin ? '🔒 LOCKED' : 
                       armStatus === 'restoring' ? '🔥 AI ACTIVATING...' : '⚡ ACTIVATE AI'}
                    </button>
                  </div>
                </div>
                
                <div className="relative h-64 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-lg overflow-hidden">
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-12 grid-rows-8 h-full gap-1 p-2">
                      {Array.from({length: 96}).map((_, i) => (
                        <div key={i} className="border border-cyan-500/30 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Base Platform */}
                  <div className={`absolute bottom-4 left-1/2 w-16 h-6 transform -translate-x-1/2 rounded-lg shadow-lg transition-all duration-700 ${
                    codeCompletion > 5 
                      ? 'bg-gradient-to-t from-slate-600 to-slate-500 border-2 border-cyan-400/50' 
                      : 'bg-gray-400 border-2 border-gray-300'
                  }`}>
                    {/* Base LED Indicators */}
                    {codeCompletion > 5 && (
                      <>
                        <div className={`absolute top-1 left-2 w-1.5 h-1.5 rounded-full ${
                          armStatus === 'restoring' ? 'bg-cyan-400 animate-pulse' : 
                          codeCompletion >= 100 ? 'bg-green-400' : 'bg-blue-400'
                        }`}></div>
                        <div className={`absolute top-1 right-2 w-1.5 h-1.5 rounded-full ${
                          armStatus === 'restoring' ? 'bg-cyan-400 animate-pulse' : 
                          codeCompletion >= 100 ? 'bg-green-400' : 'bg-blue-400'
                        }`}></div>
                      </>
                    )}
                  </div>
                  
                  {/* Lower Arm Segment - Appears at 20% with slide-up animation */}
                  {codeCompletion > 20 && (
                    <div 
                      className={`absolute bottom-10 left-1/2 w-4 h-16 transform -translate-x-1/2 rounded-t-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50' 
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`}
                      style={{
                        transform: `translateX(-50%) ${
                          armStatus === 'restoring' ? 'rotate(2deg)' : 'rotate(0deg)'
                        }`,
                        animation: codeCompletion > 20 && codeCompletion <= 25 ? 'slideUp 1s ease-out' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-4 rounded-full border-2 ${
                        codeCompletion >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                      
                      {/* Segment Detail Lines */}
                      <div className="absolute inset-x-1 top-2 bottom-2 border-l border-r border-slate-300/30 rounded"></div>
                    </div>
                  )}
                  
                  {/* Middle Arm Segment - Appears at 40% with articulated movement */}
                  {codeCompletion > 40 && (
                    <div 
                      className={`absolute left-1/2 w-3.5 h-14 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '104px',
                        transform: `translateX(-50%) ${
                          armStatus === 'restoring' ? 'rotate(-3deg)' : 'rotate(0deg)'
                        }`,
                        animation: codeCompletion > 40 && codeCompletion <= 45 ? 'slideUp 1s ease-out 0.3s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-4 rounded-full border-2 ${
                        codeCompletion >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Upper Arm Segment - Appears at 60% */}
                  {codeCompletion > 60 && (
                    <div 
                      className={`absolute left-1/2 w-3 h-12 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '146px',
                        transform: `translateX(-50%) ${
                          armStatus === 'restoring' ? 'rotate(1deg)' : 'rotate(0deg)'
                        }`,
                        animation: codeCompletion > 60 && codeCompletion <= 65 ? 'slideUp 1s ease-out 0.6s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 ${
                        codeCompletion >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Wrist Joint - Appears at 80% with rotation */}
                  {codeCompletion > 80 && (
                    <div 
                      className={`absolute left-1/2 w-6 h-6 rounded-full transform -translate-x-1/2 transition-all duration-700 shadow-lg border-2 ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-300 shadow-green-500/50'
                          : 'bg-gradient-to-br from-slate-400 to-slate-600 border-slate-300'
                      }`} 
                      style={{
                        bottom: '186px',
                        transform: `translateX(-50%) ${
                          armStatus === 'restoring' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }`,
                        animation: codeCompletion > 80 && codeCompletion <= 85 ? 'slideUp 1s ease-out 0.9s both' : undefined
                      }}
                    >
                      {/* Wrist Detail */}
                      <div className="absolute inset-1 rounded-full border border-white/20"></div>
                      <div className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                        armStatus === 'restoring' ? 'bg-white animate-ping' : 'bg-white/50'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* End Effector/Gripper - Appears at 100% with opening/closing animation */}
                  {codeCompletion >= 100 && (
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-700" 
                      style={{
                        bottom: '206px',
                        animation: 'slideUp 1s ease-out 1.2s both'
                      }}
                    >
                      {/* Gripper Body */}
                      <div className={`w-4 h-3 rounded-t-lg mx-auto mb-1 ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50'
                          : 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                      }`}>
                        <div className="w-2 h-1 bg-white/20 rounded-full mx-auto mt-0.5"></div>
                      </div>
                      
                      {/* Gripper Claws */}
                      <div className="flex justify-center space-x-1">
                        <div 
                          className={`w-1.5 h-4 rounded-b-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(-15deg)' : 'rotate(0deg)'
                          }}
                        ></div>
                        <div 
                          className={`w-1.5 h-4 rounded-b-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(15deg)' : 'rotate(0deg)'
                          }}
                        ></div>
                      </div>
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
              
              {/* Advanced Challenges Panel */}
              {showAdvanced && advancedChallenges.length > 0 && (
                <AdvancedChallengesPanel challenges={advancedChallenges} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
