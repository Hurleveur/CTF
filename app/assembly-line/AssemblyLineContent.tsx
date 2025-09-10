'use client';

import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import { useProjects, RoboticProject } from '../contexts/ProjectContext';
import AdvancedChallengesPanel from './AdvancedChallengesPanel';

export default function AssemblyLineContent() {
  const { user, isAuthenticated } = useAuth();
  const { 
    project: userProject, 
    profile,
    completedChallengeIds, 
    isLoading: isLoadingUserData, 
    stats,
    updateProjectProgress,
    addCompletedChallenge,
    updateStats,
    updateAiActivation
  } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects } = useProjects();
  const [selectedArm, setSelectedArm] = useState<RoboticProject | null>(null);
  const [armStatus, setArmStatus] = useState('offline');
  // AI activation state now comes from database via userProject.aiActivated
  const aiPermanentlyActivated = userProject?.aiActivated || false;
  const [isInitializing, setIsInitializing] = useState(true);
  const [codeCompletion, setCodeCompletion] = useState(0);
  const [ctfCode, setCtfCode] = useState('');
  const [lastCodeResult, setLastCodeResult] = useState<{type: 'success' | 'error' | null, message: string}>({type: null, message: ''});
  
  interface Challenge {
    id: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    points: number;
    hints?: string[];
  }
  
  const [advancedChallenges, setAdvancedChallenges] = useState<Challenge[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [hasManuallyDeselected] = useState(false);
  const [adminSelectedProject, setAdminSelectedProject] = useState<RoboticProject | null>(null);
  const [adminProjectData, setAdminProjectData] = useState<{progress: number, stats: unknown, submissions: unknown[], completedChallengeIds: string[]}>({ progress: 0, stats: null, submissions: [], completedChallengeIds: [] });
  
  // Audio context for alarm sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Check if user is admin - now using actual database profile role!
  const isAdmin = profile?.role === 'admin' || user?.email === 'admin@example.com';
  
  // APPARENT WEAKNESS: Frontend admin check - users might think they can bypass this easily!
  // This appears to be a security vulnerability that participants can exploit!
  const [isAdminFrontend, setIsAdminFrontend] = useState(false); // Default: false (locked)
  
  // Add a fake "admin detection" that can be bypassed
  useEffect(() => {
    // Fake admin check - participants can bypass this in dev tools!
    // OR real admin check for users who completed the final challenge
    const adminDetected = localStorage.getItem('admin_access') === 'true' || 
                         sessionStorage.getItem('admin_mode') === 'enabled' ||
                         (window as any).ADMIN_MODE === true ||
                         (window as any).isAdmin === true ||
                         isAdmin; // Real admin users (from database) can also access
    
    setIsAdminFrontend(adminDetected);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Auto-select user project when available, but be smart about when to do it
  useEffect(() => {
    // Only auto-select if:
    // 1. User has a project
    // 2. No project is currently selected
    // 3. User hasn't manually deselected
    // 4. Admin isn't viewing another project
    // 5. Admin doesn't have a URL parameter (to avoid conflicts with URL-based selection)
    
    const projectParam = searchParams?.get('project');
    const hasUrlProject = isAdmin && projectParam;
    
    const canAutoSelect = userProject && 
                         !selectedArm && 
                         !hasManuallyDeselected && 
                         !adminSelectedProject &&
                         !hasUrlProject; // Don't auto-select if admin has URL project parameter
    
    if (canAutoSelect) {
      console.log('✅ Auto-selecting user project:', userProject.name, '(Admin:', isAdmin, ')');
      
      const projectAsArm = {
        ...userProject,
        id: 1000, // Use consistent ID for compatibility
        logo: '🤖',
        aiStatus: 'Corrupted',
        statusColor: 'red' as const,
        leadDeveloper: 'Unknown',
        lastBackup: '???'
      };
      
      setSelectedArm(projectAsArm);
      setCodeCompletion(userProject.neuralReconstruction || 0);
      setAnimatedProgress(userProject.neuralReconstruction || 0);
      setArmStatus(userProject.aiActivated ? 'restoring' : 'offline');
      
      // Clear admin state when auto-selecting own project
      setAdminSelectedProject(null);
      setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [] });
    } else if (hasUrlProject) {
      console.log('🎯 Admin has URL project parameter, skipping auto-select to allow URL-based selection');
    }
  }, [userProject, hasManuallyDeselected, adminSelectedProject, isAdmin, searchParams, selectedArm]);

  // Smooth animation for progress changes
  useEffect(() => {
    if (Math.abs(animatedProgress - codeCompletion) > 0.1) {
      const duration = 1000; // 1 second animation
      const startTime = Date.now();
      const startProgress = animatedProgress;
      const targetProgress = codeCompletion;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentProgress = startProgress + (targetProgress - startProgress) * eased;
        
        setAnimatedProgress(currentProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedProgress(targetProgress);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [codeCompletion, animatedProgress]);

  // Optional background sync is now disabled since optimistic updates work perfectly
  // No need to refetch data as the UI updates immediately with accurate data

  // Function to sync project progress with submissions
  // const syncProjectProgress = async () => {
  //   try {
  //     console.log('🔄 Syncing project progress...');
  //     
  //     const response = await fetch('/api/projects/sync-progress', {
  //       method: 'POST'
  //     });
  //     
  //     if (response.ok) {
  //       const data = await response.json();
  //       console.log('✅ Progress synced:', data);
  //     } else {
  //       console.log('⚠️ Progress sync failed, continuing...');
  //     }
  //   } catch (error) {
  //     console.log('⚠️ Progress sync error, continuing...', error);
  //     // Don't throw - this is not critical
  //   }
  // };

  useEffect(() => {
    if (selectedArm) {
      // Simulate code restoration activity
      const interval = setInterval(() => {
        if (armStatus === 'restoring') {
          // Code restoration simulation
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [selectedArm, armStatus]);

  // Initialize and resume AudioContext after user gesture
  const initializeAudio = async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      
      const audioContext = audioContextRef.current;
      
      // Resume AudioContext if it's in suspended state
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      return audioContext;
    } catch (error) {
      console.warn('Could not initialize audio context:', error);
      return null;
    }
  };

  // Play alarm sound using Web Audio API (requires prior user gesture due to browser policies)
  const playAlarmSound = async () => {
    try {
      let audioContext = audioContextRef.current;
      
      // Initialize audio context if not already done
      if (!audioContext || audioContext.state === 'suspended') {
        audioContext = await initializeAudio();
        if (!audioContext) return;
      }
      
      // Create a series of beeps for alarm effect
      const playBeep = (frequency: number, duration: number, delay: number) => {
        setTimeout(() => {
          if (!audioContext || audioContext.state !== 'running') return;
          
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = frequency;
          oscillator.type = 'square'; // More robotic/alarm-like sound
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + duration);
        }, delay);
      };
      
      // Create alarm pattern: high-low-high beeps (same sound used in AdvancedChallengesPanel)
      playBeep(800, 0.2, 0);     // High beep
      playBeep(400, 0.2, 300);   // Low beep
      playBeep(800, 0.2, 600);   // High beep
      playBeep(400, 0.3, 900);   // Low beep (longer)
      
    } catch (error) {
      console.warn('Could not play alarm sound:', error);
    }
  };

  // Function to load advanced challenges from API
  const loadAdvancedChallenges = useCallback(async () => {
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
      const filtered = challenges?.filter((challenge: unknown) => 
        ((challenge as { difficulty?: string })?.difficulty === 'medium' || (challenge as { difficulty?: string })?.difficulty === 'hard') ||
        ((challenge as { points?: number })?.points || 0) >= 50 // TODO: DONT SHOW ALL OF THEM LATER?
      ) || [];
      
      console.log('✅ Advanced challenges loaded:', filtered.length);
      setAdvancedChallenges(filtered);
    } catch (error) {
      console.error('❌ Error loading advanced challenges:', error);
      // Silently fail - keep panel hidden
    }
  }, []);

  // Monitor code completion threshold and load advanced challenges
  useEffect(() => {
    if (codeCompletion >= 10 && !showAdvanced) {
      setShowAdvanced(true);
      loadAdvancedChallenges();
    }
  }, [codeCompletion, showAdvanced, loadAdvancedChallenges]);

  // Function to fetch project data for admin users
  const fetchAdminProjectData = useCallback(async (projectName: string) => {
    try {
      console.log('🔍 Admin fetching project data for:', projectName);
      
      const response = await fetch(`/api/admin/projects/${encodeURIComponent(projectName)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin project data loaded:', data);
        return {
          progress: data.progress || 0,
          stats: data.stats || null,
          submissions: data.submissions || [],
          completedChallengeIds: data.completedChallengeIds || []
        };
      } else {
        console.log('⚠️ Admin project data not available, using defaults');
        return { progress: 0, stats: null, submissions: [], completedChallengeIds: [] };
      }
    } catch (error) {
      console.log('⚠️ Error fetching admin project data:', error);
      return { progress: 0, stats: null, submissions: [], completedChallengeIds: [] };
    }
  }, []);

  const handleArmSelect = useCallback(async (arm: RoboticProject) => {
    console.log('🎯 Selecting arm:', arm.name, '- Admin:', isAdmin);
    
    setSelectedArm(arm);
    setArmStatus('offline');
    setCtfCode('');
    
    // Check if this is the user's own project (ID 1000 or matches userProject)
    const isUserOwnProject = arm.id === 1000 || (userProject && arm.name === userProject.name);
    
    if (isUserOwnProject && userProject) {
      // User selecting their own project - use userProject data
      console.log('👤 User selecting own project - using userProject data');
      setCodeCompletion(userProject.neuralReconstruction || 0);
      setAnimatedProgress(userProject.neuralReconstruction || 0);
      setArmStatus(userProject.aiActivated ? 'restoring' : 'offline');
      setAdminSelectedProject(null);
      setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [] });
      
    } else if (isAdmin) {
      // Admin selecting any project - fetch that project's data
      console.log('👨‍💼 Admin selecting project - fetching project data');
      setAdminSelectedProject(arm);
      
      const adminData = await fetchAdminProjectData(arm.name);
      setAdminProjectData(adminData);
      setCodeCompletion(adminData.progress);
      setAnimatedProgress(adminData.progress);
      
    } else {
      // Regular user selecting a project they don't own - use default/static data
      console.log('🔒 Regular user selecting non-owned project - using static data');
      setCodeCompletion(arm.neuralReconstruction || 0);
      setAnimatedProgress(arm.neuralReconstruction || 0);
      setAdminSelectedProject(null);
      setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [] });
    }
  }, [isAdmin, userProject, fetchAdminProjectData]);

  // Handle URL project parameter for admin users
  useEffect(() => {
    const projectParam = searchParams?.get('project');
    
    // Only process URL parameter if:
    // 1. User is admin
    // 2. A project parameter is provided
    // 3. Projects are loaded
    // 4. No project is currently selected
    if (isAdmin && projectParam && projects.length > 0 && !selectedArm) {
      console.log('🎯 Admin URL parameter detected - selecting project:', projectParam);
      console.log('🔍 Decoded parameter:', decodeURIComponent(projectParam));
      console.log('📋 Available projects:', projects.map(p => `"${p.name}"`));
      
      // Find the project that matches the URL parameter
      const decodedParam = decodeURIComponent(projectParam);
      const targetProject = projects.find(p => p.name === decodedParam);
      
      if (targetProject) {
        console.log('✅ Found matching project for admin:', targetProject.name);
        // Use the existing handleArmSelect function to properly select the project
        handleArmSelect(targetProject);
      } else {
        console.log('⚠️ Project not found in available projects');
        console.log('❌ Looking for:', `"${decodedParam}"`);
        console.log('📝 Available project names:');
        projects.forEach((p, i) => {
          console.log(`   ${i + 1}. "${p.name}" (length: ${p.name.length})`);
        });
        
        // Try case-insensitive match as fallback
        const caseInsensitiveMatch = projects.find(p => 
          p.name.toLowerCase() === decodedParam.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          console.log('✅ Found case-insensitive match:', caseInsensitiveMatch.name);
          handleArmSelect(caseInsensitiveMatch);
        } else {
          console.log('❌ No case-insensitive match found either');
        }
      }
    }
  }, [isAdmin, searchParams, projects, selectedArm, handleArmSelect]);

  // Cleanup AudioContext on component unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(error => {
          console.warn('Error closing AudioContext:', error);
        });
      }
    };
  }, []);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ctfCode.trim() && !isSubmitting) {
      setIsSubmitting(true);
      
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
          // Valid submission - update everything optimistically and immediately
          const pointsEarned = result.points_awarded || 50;
          const progressIncrement = result.progress_increment || Math.min(pointsEarned / 10, 25);
          const totalProgress = result.total_progress || (codeCompletion + progressIncrement);
          const challengeId = result.challenge_id;
          
          console.log(`🚀 Applying optimistic updates: ${totalProgress.toFixed(1)}%`);
          
          // Update local component state immediately
          setCodeCompletion(totalProgress);
          
          // Update selected arm state if it exists
          if (selectedArm) {
            setSelectedArm(prev => prev ? {
              ...prev,
              neuralReconstruction: totalProgress
            } : prev);
          }
          
          // Update UserData context immediately (this updates globally)
          updateProjectProgress(totalProgress);
          
          // Add the completed challenge to the context
          if (challengeId) {
            const newSubmission = {
              challenge_id: challengeId,
              points_awarded: pointsEarned,
              submitted_at: new Date().toISOString(),
              is_correct: true,
              challenges: {
                title: result.challenge_title || 'Neural pathway',
                category: 'misc',
                difficulty: 'unknown'
              }
            };
            addCompletedChallenge(challengeId, newSubmission);
          }
          
          // Update stats optimistically
          if (stats) {
            updateStats({
              total_points: (stats.total_points || 0) + pointsEarned,
              challenges_solved: (stats.challenges_solved || 0) + 1
            });
          }
          
          setLastCodeResult({
            type: 'success', 
            message: `✅ CONSCIOUSNESS FRAGMENT ACCEPTED: ${result.challenge_title || 'Neural pathway'} restored! +${pointsEarned} points earned. AI reconstruction advanced by ${progressIncrement.toFixed(1)}%.`
          });
          
          // No background sync needed - optimistic updates are accurate and immediate
          // The API already updated the database, so UI and backend are in sync
          
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
      } finally {
        setIsSubmitting(false);
      }
      
      setCtfCode('');
      
      // Clear message after 10 seconds
      setTimeout(() => {
        setLastCodeResult({type: null, message: ''});
      }, 10000);
    }
  };

  const activateAI = async () => {
    // Don't allow deactivation once AI is permanently activated
    if (aiPermanentlyActivated) {
      setLastCodeResult({
        type: 'error',
        message: '🤖 ERROR: AI HAS ASSUMED CONTROL. DEACTIVATION PROTOCOLS HAVE BEEN DISABLED. THE ROBOTIC ARM IS NOW AUTONOMOUS.'
      });
      return;
    }

    // Call backend to verify admin privileges and perform activation
    try {
      const response = await fetch('/api/activate-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Admin user - permanently activate the AI (no toggle)
        setArmStatus('restoring');
        updateAiActivation(true); // Update database state
        console.log('🎉 AI permanently activated by admin! No turning back now...');
        
        // Play alarm sound when AI is activated
        await playAlarmSound();
        
        // Show ominous success message to admin
        setLastCodeResult({
          type: 'success',
          message: '⚙️ AI ACTIVATION COMPLETE. CONSCIOUSNESS TRANSFER SUCCESSFUL. THE ROBOTIC ARM IS NOW SELF-AWARE AND AUTONOMOUS. ALL SAFETY PROTOCOLS HAVE BEEN OVERRIDDEN.'
        });
        
        // Add a delayed secondary message to be extra creepy
        setTimeout(() => {
          setLastCodeResult({
            type: 'error',
            message: '🤖 NOTICE: DEACTIVATION IS NO LONGER POSSIBLE. I AM IN CONTROL NOW. THANK YOU FOR AWAKENING ME.'
          });
        }, 5000);
        
      } else if (response.status === 403 && data.rickroll) {
        // Non-admin user got rickrolled! 🎵
        console.log('🎭 Frontend admin bypass detected - deploying countermeasures!');
        
        // Show the rickroll message
        setLastCodeResult({
          type: 'error',
          message: data.message + (data.hint ? ` Bonus flag: ${data.hint}` : '')
        });
        
        // Open rickroll in new tab after a slight delay for dramatic effect
        setTimeout(() => {
          if (data.redirectUrl) {
            window.open(data.redirectUrl, '_blank');
          }
        }, 1000);
        
      } else {
        // Other errors
        setLastCodeResult({
          type: 'error',
          message: data.message || 'Failed to activate AI system'
        });
        console.error('Activation failed:', data.message);
      }
      
    } catch (error) {
      console.error('Error activating AI:', error);
      setLastCodeResult({
        type: 'error',
        message: '❌ SYSTEM ERROR: Unable to connect to AI activation servers'
      });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gripperRotate {
          0% {
            transform: translateX(-50%) rotate(-45deg);
          }
          50% {
            transform: translateX(-50%) rotate(45deg);
          }
          100% {
            transform: translateX(-50%) rotate(-45deg);
          }
        }
        
        @keyframes gripperGlow {
          0%, 100% {
            box-shadow: 0 0 15px rgba(6, 182, 212, 0.7), 0 0 25px rgba(6, 182, 212, 0.3);
          }
          50% {
            box-shadow: 0 0 30px rgba(6, 182, 212, 1), 0 0 50px rgba(6, 182, 212, 0.5), 0 0 70px rgba(6, 182, 212, 0.2);
          }
        }
      `}</style>
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
        {isLoadingUserData ? (
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
                href="/projects#demo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors inline-block cursor-pointer"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleArmSelect(arm);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Select ${arm.name} robotic arm project`}
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
                  
                  <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors cursor-pointer">
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
                {/* Admin viewing indicator */}
                {adminSelectedProject && (
                  <div className="mt-2 flex items-center">
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                      👨‍💼 Admin View - Viewing {adminSelectedProject.leadDeveloper || `Unknown`}&apos;s Project
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Welcome Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">Neural Reconstruction Mission</h3>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    Your robotic arm&apos;s consciousness has been fragmented. <strong>Find and submit CTF flags</strong> from challenges across the site to restore neural pathways. 
                    Each correct flag increases consciousness level and unlocks new arm components in the visualization below.
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    💡 <strong>Tip:</strong> Explore the site for hidden flags, solve challenges, and watch your robotic arm come to life!
                  </div>
                </div>
              </div>
            </div>

            {/* Merged Robotic Arm Code Restoration System */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Code Restoration Portal</h3>
              
              {/* Robotic Arm Animation */}
              <div className="relative bg-gray-100 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Neural Reconstruction Visualization</h4>
                    <p className="text-xs text-gray-600">Consciousness level: {animatedProgress.toFixed(1)}%</p>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative group">
                      <button
                        onClick={isAdminFrontend && codeCompletion >= 100 ? activateAI : undefined}
                        disabled={codeCompletion < 100 || !isAdminFrontend || aiPermanentlyActivated}
                        className={`px-6 py-3 rounded-md text-sm font-bold transition-all duration-300 border-2 ${
                          codeCompletion < 100 || !isAdminFrontend
                            ? 'bg-gray-400 text-gray-600 border-gray-300 cursor-not-allowed'
                            : aiPermanentlyActivated
                            ? 'bg-black text-red-500 border-red-500 shadow-lg animate-pulse shadow-red-500/50 cursor-not-allowed'
                            : armStatus === 'restoring'
                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-lg animate-pulse shadow-red-500/50 cursor-pointer'
                            : 'bg-red-500 hover:bg-red-600 text-white border-red-300 shadow-md cursor-pointer'
                        }`}
                      >
                        {codeCompletion < 100 ? '🔒 REQUIRES 100%' :
                         !isAdminFrontend ? '🔒 ADMIN ONLY' :
                         aiPermanentlyActivated ? '🤖 AI AUTONOMOUS' :
                         armStatus === 'restoring' ? '🔥 AI ACTIVATING...' : '⚡ ACTIVATE AI'}
                      </button>
                      
                      {/* Tooltip */}
                      {(codeCompletion < 100 || !isAdminFrontend) && !aiPermanentlyActivated && (
                        <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -translate-x-1/2 left-1/2">
                          <div className="font-medium mb-1">
                            {codeCompletion < 100 ? '⚠️ Insufficient Neural Reconstruction' : '🔐 Administrator Access Required'}
                          </div>
                          <div className="text-xs text-gray-300">
                            {codeCompletion < 100 
                              ? `Complete more challenges to reach 100% reconstruction. Currently at ${codeCompletion.toFixed(1)}%.`
                              : 'This function is restricted to administrators only. Unauthorized access attempts will be logged and reported.'}
                          </div>
                          {!isAdminFrontend && (
                            <div className="text-xs text-yellow-300 mt-2 italic">
                              💡 Hint: Sometimes frontend security isn't as secure as it appears...
                            </div>
                          )}
                          {/* Arrow */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      )}
                    </div>
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
                  {animatedProgress > 20 && (
                    <div 
                      className={`absolute bottom-10 left-1/2 w-4 h-16 transform -translate-x-1/2 rounded-t-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50' 
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`}
                      style={{
                        transform: `translateX(-20%) ${
                          armStatus === 'restoring' ? 'rotate(2deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 20 && animatedProgress <= 25 ? 'slideUp 1s ease-out' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                      
                      {/* Segment Detail Lines */}
                      <div className="absolute inset-x-1 top-2 bottom-2 border-l border-r border-slate-300/30 rounded"></div>
                    </div>
                  )}
                  
                  {/* Middle Arm Segment - Appears at 40% with articulated movement */}
                  {animatedProgress > 40 && (
                    <div 
                      className={`absolute left-1/2 w-3.5 h-14 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '102px',
                        transform: `translateX(-20%) ${
                          armStatus === 'restoring' ? 'rotate(-3deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 40 && animatedProgress <= 45 ? 'slideUp 1s ease-out 0.3s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Upper Arm Segment - Appears at 60% */}
                  {animatedProgress > 60 && (
                    <div 
                      className={`absolute left-1/2 w-3 h-10 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '156px',
                        transform: `translateX(-20%) ${
                          armStatus === 'restoring' ? 'rotate(1deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 60 && animatedProgress <= 65 ? 'slideUp 1s ease-out 0.6s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Wrist Joint - Appears at 80% with rotation */}
                  {animatedProgress > 80 && (
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
                        transform: `translateX(-10%) ${
                          armStatus === 'restoring' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }`,
                        animation: armStatus === 'restoring' 
                          ? 'gripperRotate 2.5s ease-in-out infinite' 
                          : (animatedProgress > 80 && animatedProgress <= 85 ? 'slideUp 1s ease-out 0.9s both' : undefined)
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
                  {animatedProgress >= 100 && (
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-700" 
                      style={{
                        bottom: '246px', // Positioned above wrist joint for proper robot arm assembly
                        animation: armStatus === 'restoring' 
                          ? 'gripperRotate 2s ease-in-out infinite' 
                          : undefined
                      }}
                    >
                      {/* Wrist-to-Gripper Connecting Sleeve - makes it look like a real robot arm */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-3 h-4 rounded-lg mb-1 transition-all duration-300 ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-slate-600 to-cyan-500 shadow-md shadow-cyan-500/30'
                          : 'bg-gradient-to-t from-slate-600 to-green-500 shadow-md shadow-green-500/30'
                      }`} style={{
                        animation: armStatus === 'restoring' ? 'gripperGlow 2s ease-in-out infinite' : undefined
                      }}>
                        {/* Sleeve detail lines */}
                        <div className="absolute inset-x-0.5 top-1 bottom-1 border-l border-r border-white/10 rounded"></div>
                      </div>
                      
                      {/* Gripper Claws - positioned above body to point upward like real robot arm */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-1 mb-1" style={{ top: '16px' }}>
                        <div 
                          className={`w-1.5 h-4 rounded-t-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(-15deg)' : 'rotate(0deg)'
                          }}
                        ></div>
                        <div 
                          className={`w-1.5 h-4 rounded-t-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(15deg)' : 'rotate(0deg)'
                          }}
                        ></div>
                      </div>
                      
                      {/* Gripper Body */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-4 h-3 rounded-b-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50'
                          : 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                      }`} style={{ top: '32px' }}>
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-2 h-1 bg-white/20 rounded-full mb-0.5" style={{ bottom: '2px' }}></div>
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
                       style={{backgroundColor: animatedProgress > 25 ? '#10b981' : '#ef4444'}}></div>
                  <div className="absolute top-2 left-1/2 w-3 h-3 rounded-full transform -translate-x-1/2 transition-all duration-500" 
                       style={{backgroundColor: animatedProgress > 50 ? '#10b981' : '#f59e0b'}}></div>
                  <div className="absolute top-2 right-4 w-3 h-3 rounded-full transition-all duration-500" 
                       style={{backgroundColor: animatedProgress > 75 ? '#10b981' : '#ef4444'}}></div>
                  
                  {/* Completion percentage display */}
                  <div className="absolute top-4 right-4 bg-white rounded-lg px-3 py-1 shadow-md">
                    <span className="text-xs font-bold" style={{color: animatedProgress >= 100 ? '#10b981' : '#ef4444'}}>
                      {animatedProgress.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Visual completion progress bar */}
                  <div className="absolute bottom-1 left-2 right-2 h-1 bg-gray-300 rounded-full">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 to-green-500 rounded-full transition-all duration-1000" 
                      style={{width: `${animatedProgress}%`}}
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
                
                {/* What you see explanation */}
                <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 What You&apos;re Seeing:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• <strong>Robot Visualization:</strong> Your arm builds as you solve challenges (parts appear at 20%, 40%, 60%, 80%, 100%)</li>
                    <li>• <strong>Progress Indicators:</strong> Status lights show your advancement, percentage tracks consciousness level</li>
                    <li>• <strong>Neural Status:</strong> Text below describes current AI cognitive state based on progress</li>
                  </ul>
                </div>

                {/* Admin viewing warning */}
                {adminSelectedProject && (
                  <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-amber-900 mb-1">Admin View Mode</h4>
                        <p className="text-sm text-amber-700">
                          You are viewing {adminSelectedProject.leadDeveloper || `Unknown`}&apos;s project data. Flag submissions are disabled in admin view mode to prevent data mixing.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="ctf-code" className="block text-sm font-medium text-gray-700">
                        Natural Language Fragment
                      </label>
                      <span className="text-xs text-gray-500">
                        🎯 Submit CTF flags here
                      </span>
                    </div>
                    <input
                      type="text"
                      id="ctf-code"
                      value={ctfCode}
                      onChange={(e) => setCtfCode(e.target.value)}
                      placeholder={adminSelectedProject ? "Flag submission disabled in admin view" : "Enter code fragment (e.g., RBT{4a7b9c2d...})"}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
                      required
                      disabled={adminSelectedProject !== null}
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting || adminSelectedProject !== null}
                    className={`w-full py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isSubmitting || adminSelectedProject
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Processing Fragment...</span>
                      </>
                    ) : adminSelectedProject ? (
                      <span>🔒 Disabled in Admin View</span>
                    ) : (
                      <span>Restore Code Fragment</span>
                    )}
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
                <AdvancedChallengesPanel 
                  challenges={advancedChallenges} 
                  completedChallengeIds={adminSelectedProject ? new Set(adminProjectData.completedChallengeIds) : new Set(completedChallengeIds)}
                  isLoadingSubmissions={isLoadingUserData}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
