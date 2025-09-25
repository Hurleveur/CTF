'use client';

import { useAuth } from '../contexts/AuthContext';
import { useUserData } from '../contexts/UserDataContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback, Fragment, useRef } from 'react';
import { calculateStatusColor, getProgressBarClasses } from '@/lib/project-colors';
import { useProjects, RoboticProject } from '../contexts/ProjectContext';
import AdvancedChallengesPanel from './AdvancedChallengesPanel';
import InvitationModal from './InvitationModal';
import TeamMemberList from '../components/TeamMemberList';
import toast from 'react-hot-toast';
import './assembly-line-styles.css'; // Import external CSS to reduce bundle size

// Performance optimization imports
import { useAssemblyLineState } from './hooks/useAssemblyLineState';

// Types for team submissions and members
interface TeamSubmissionData {
  challengeId: string;
  completedBy: Array<{
    userId: string;
    userName: string;
    submittedAt: string;
    pointsAwarded: number;
  }>;
  challenge: {
    id: string;
    title: string;
    category: string;
    difficulty: string;
    points: number;
  } | null;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  isLead: boolean;
  joinedAt: string;
  isCurrentUser: boolean;
  totalPoints?: number;
}

export default function AssemblyLineContent() {
  const { isAuthenticated, user } = useAuth();
  const { 
    project: userProject, 
    profile,
    completedChallengeIds, 
    isLoading: isLoadingUserData, 
    updateAiActivation
  } = useUserData();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, leaveProject } = useProjects();
  const [allProjects, setAllProjects] = useState<RoboticProject[]>([]);
  
  // Use optimized state management
  const {
    selectedArm,
    setSelectedArm,
    armStatus,
    setArmStatus,
    codeCompletion,
    setCodeCompletion,
    ctfCode,
    setCtfCode,
    lastCodeResult,
    setLastCodeResult,
    isSubmitting,
    setIsSubmitting,
    showAdvanced,
    setShowAdvanced,
    showInvitationModal,
    setShowInvitationModal,
    isLeaving,
    setIsLeaving,
    showLeaveConfirm,
    setShowLeaveConfirm,
    animatedProgress,
    setAnimatedProgress,
    teamTotalPoints,
    setTeamTotalPoints
  } = useAssemblyLineState();
  
  // AI activation state now comes from database via userProject.aiActivated
  const aiPermanentlyActivated = userProject?.aiActivated || false;
  
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
  const [hasManuallyDeselected] = useState(false);
  const [adminSelectedProject, setAdminSelectedProject] = useState<RoboticProject | null>(null);
  const [adminProjectData, setAdminProjectData] = useState<{progress: number, stats: unknown, submissions: unknown[], completedChallengeIds: string[], aiActivated?: boolean, aiActivatedAt?: string}>({ progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined });
  const [teamSubmissions, setTeamSubmissions] = useState<Record<string, TeamSubmissionData>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isInitialDataProcessing, setIsInitialDataProcessing] = useState(false);
  const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
  
  // Cutoff date for filtering team members and submissions
  const [cutoffDate, setCutoffDate] = useState<string | null>(null);
  
  // Audio context for alarm sounds
  const audioContextRef = useRef<AudioContext | null>(null);
  const advancedPanelRef = useRef<HTMLDivElement | null>(null);
  
  // Check if user is admin - now using actual database profile role!
  const isAdmin = profile?.role === 'admin' || profile?.role === 'dev';
  
  // APPARENT WEAKNESS: Frontend admin check - users might think they can bypass this easily!
  // This appears to be a security vulnerability that participants can exploit!
  const [isAdminFrontend, setIsAdminFrontend] = useState(false); // Default: false (locked)
  
  // Add a fake "admin detection" that can be bypassed
  useEffect(() => {
    // Fake admin check - participants can bypass this in dev tools!
    // OR real admin check for users who completed the final challenge
    const adminDetected = localStorage.getItem('admin_access') === 'true' || 
                         sessionStorage.getItem('admin_mode') === 'enabled' ||
                         (window as unknown as Record<string, unknown>).ADMIN_MODE === true ||
                         (window as unknown as Record<string, unknown>).isAdmin === true ||
                         isAdmin; // Real admin users (from database) can also access
    
    setIsAdminFrontend(adminDetected);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch all projects for admin users to enable project selection
  useEffect(() => {
    const fetchAllProjectsForAdmin = async () => {
      if (!isAdmin) {
        setAllProjects([]);
        return;
      }

      try {
        console.log('[Admin] Fetching all projects for admin access...');
        const response = await fetch('/api/projects/all');
        if (response.ok) {
          const data = await response.json();
          const allProjectsList = data.projects || [];
          setAllProjects(allProjectsList);
          console.log('[Admin] Loaded', allProjectsList.length, 'projects for admin access');
        } else {
          console.error('[Admin] Failed to fetch all projects:', response.statusText);
          setAllProjects([]);
        }
      } catch (error) {
        console.error('[Admin] Error fetching all projects:', error);
        setAllProjects([]);
      }
    };

    fetchAllProjectsForAdmin();
  }, [isAdmin]);

  // Compute available projects - admins get all projects, regular users get their own
  const availableProjects = isAdmin ? allProjects : projects;

  // Auto-select user project when available, but be smart about when to do it
  useEffect(() => {
    // Only auto-select if:
    // 1. User has a project
    // 2. No project is currently selected
    // 3. User hasn't manually deselected
    // 4. Admin isn't viewing another project
    // 5. Admin doesn't have a URL parameter (to avoid conflicts with URL-based selection)
    // 6. No stored project preference exists (for refresh persistence)
    
    const projectParam = searchParams?.get('project');
    const hasUrlProject = isAdmin && projectParam;
    const storedProjectName = sessionStorage.getItem('selectedProjectName');
    const hasStoredProject = isAdmin && storedProjectName;
    
    const canAutoSelect = userProject && 
                         !selectedArm && 
                         !hasManuallyDeselected && 
                         !adminSelectedProject &&
                         !hasUrlProject && // Don't auto-select if admin has URL project parameter
                         !hasStoredProject; // Don't auto-select if admin has stored project preference
    
    if (canAutoSelect) {
      console.log('✅ Auto-selecting user project:', userProject.name, '(Admin:', isAdmin, ')');
      
      // Set initial data processing state if neural reconstruction is 0%
      if ((userProject.neuralReconstruction || 0) === 0) {
        setIsInitialDataProcessing(true);
        // Clear the processing state after a short delay to allow for data sync
        setTimeout(() => setIsInitialDataProcessing(false), 2000);
      }
      
      // Find the matching project from the projects list to get team member details
      const matchingProject = projects.find(p => p.name === userProject.name);
      
      console.log('🔍 Auto-selecting project, matching details:', {
        userProjectName: userProject.name,
        matchingProject: matchingProject,
        hasTeamMemberDetails: !!matchingProject?.teamMemberDetails?.length,
        teamMemberDetailsCount: matchingProject?.teamMemberDetails?.length || 0
      });
      
      // Create fallback team member details if none exist
      const fallbackTeamMemberDetails = (matchingProject?.teamMemberDetails && matchingProject.teamMemberDetails.length > 0)
        ? matchingProject.teamMemberDetails
        : [{
            id: user?.id || 'unknown',
            name: profile?.full_name || user?.email || 'Project Owner',
            email: profile?.email || user?.email || '',
            isLead: true,
            joinedAt: new Date().toISOString() // Use current time as fallback
          }];
      
      const projectAsArm = {
        ...userProject,
        id: userProject.id, // Use actual project UUID from database
        logo: '🤖',
        aiStatus: 'Corrupted',
        statusColor: 'red' as const,
        leadDeveloper: profile?.full_name || user?.email || 'Unknown',
        lastBackup: '???',
        teamMemberDetails: fallbackTeamMemberDetails, // Always ensure we have team member details
        teamMembers: matchingProject?.teamMembers || [profile?.full_name || user?.email || 'Unknown'] // Legacy compatibility
      };
      
      setSelectedArm(projectAsArm);
      setCodeCompletion(userProject.neuralReconstruction || 0);
      setAnimatedProgress(userProject.neuralReconstruction || 0);
      setArmStatus(userProject.aiActivated ? 'restoring' : 'offline');
      
      // Clear admin state when auto-selecting own project
      setAdminSelectedProject(null);
      setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined });
      
      // Store the selection for persistence
      if (isAdmin) {
        sessionStorage.setItem('selectedProjectName', userProject.name);
      }
    } else if (hasUrlProject) {
      console.log('🎯 Admin has URL project parameter, skipping auto-select to allow URL-based selection');
    } else if (hasStoredProject) {
      console.log('📂 Admin has stored project preference, skipping auto-select to allow stored selection');
    }
  }, [userProject, hasManuallyDeselected, adminSelectedProject, isAdmin, searchParams, selectedArm, projects, availableProjects, profile, user, setSelectedArm, setCodeCompletion, setAnimatedProgress, setArmStatus, setAdminSelectedProject, setAdminProjectData]);

  // Performance-optimized animation handling is now managed in useAssemblyLineState
  useEffect(() => {
    // Simple animation sync - when codeCompletion changes, update animatedProgress
    if (Math.abs(animatedProgress - codeCompletion) > 0.1) {
      const startTime = performance.now();
      const startValue = animatedProgress;
      const targetValue = codeCompletion;
      
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / 1000, 1); // 1 second duration
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const currentValue = startValue + (targetValue - startValue) * eased;
        
        setAnimatedProgress(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setAnimatedProgress(targetValue);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [codeCompletion, animatedProgress, setAnimatedProgress]);

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
      
      // Get user's completed challenges to check unlock conditions
      const completedChallenges = new Set(completedChallengeIds);
      const hasAdminTerminalAccess = Array.from(completedChallenges).some(id => {
        const challenge = challenges.find((c: Challenge) => c.id === id);
        return challenge?.title?.toLowerCase().includes('terminal');
      });
      
      // Check previous state for notifications
      const previousTerminalAccess = localStorage.getItem('hasTerminalAccess') === 'true';
      const previousAIAccess = localStorage.getItem('hasAIAccess') === 'true';
      const has100Progress = codeCompletion >= 100;
      
      // Filter challenges based on unlock conditions
      let terminalChallengesRevealed = 0;
      let aiChallengesRevealed = 0;
      
      const filtered = challenges?.filter((challenge: Challenge) => {
        // Basic filter for medium/hard challenges or 25+ points
        const meetsBasicCriteria = (
          challenge.difficulty === 'medium' || 
          challenge.difficulty === 'hard' ||
          challenge.points >= 25
        );
        
        if (!meetsBasicCriteria) return false;
        
        // Hide terminal category challenges until Admin Terminal Breach is completed
        if (challenge.category === 'terminal' && !hasAdminTerminalAccess) {
          console.log(`🔒 Hiding terminal challenge "${challenge.title}" - Admin Terminal Breach not completed`);
          return false;
        }
        
        // Count terminal challenges that are now visible
        if (challenge.category === 'terminal' && hasAdminTerminalAccess) {
          terminalChallengesRevealed++;
        }
        
        // Hide AI Activation access challenge until 100% progress
        if ((challenge.title?.toLowerCase().includes('ai activation') || 
             challenge.title?.toLowerCase().includes('frontend admin') ||
             challenge.description?.toLowerCase().includes('ai activation')) && 
            codeCompletion < 100) {
          console.log(`🔒 Hiding AI activation challenge "${challenge.title}" - Progress: ${codeCompletion}%`);
          return false;
        }
        
        // Count AI challenges that are now visible
        if ((challenge.title?.toLowerCase().includes('ai activation') || 
             challenge.title?.toLowerCase().includes('frontend admin') ||
             challenge.description?.toLowerCase().includes('ai activation')) && 
            has100Progress) {
          aiChallengesRevealed++;
        }
        
        return true;
      }) || [];
      
      // Show notifications for newly revealed challenge categories
      if (hasAdminTerminalAccess && !previousTerminalAccess && terminalChallengesRevealed > 0) {
        console.log('🎉 Terminal challenges unlocked! Showing notification...');
        localStorage.setItem('hasTerminalAccess', 'true');
        // Trigger notification similar to first-time advanced challenges
        // Force a visual update to show the new challenges dramatically
        setTimeout(() => {
          const event = new CustomEvent('terminalChallengesUnlocked', {
            detail: { count: terminalChallengesRevealed }
          });
          window.dispatchEvent(event);
        }, 500);
      }
      
      if (has100Progress && !previousAIAccess && aiChallengesRevealed > 0) {
        console.log('🤖 AI Activation challenges unlocked! Showing notification...');
        localStorage.setItem('hasAIAccess', 'true');
        // Trigger notification similar to first-time advanced challenges
        setTimeout(() => {
          const event = new CustomEvent('aiChallengesUnlocked', {
            detail: { count: aiChallengesRevealed }
          });
          window.dispatchEvent(event);
        }, 500);
      }
      
      console.log('✅ Advanced challenges loaded:', filtered.length);
      console.log('🔑 Admin Terminal Access:', hasAdminTerminalAccess);
      console.log('🤖 AI Progress:', codeCompletion);
      console.log(`🔓 Terminal challenges revealed: ${terminalChallengesRevealed}`);
      console.log(`🔓 AI challenges revealed: ${aiChallengesRevealed}`);
      setAdvancedChallenges(filtered);
    } catch (error) {
      console.error('❌ Error loading advanced challenges:', error);
      // Silently fail - keep panel hidden
    }
  }, [completedChallengeIds, codeCompletion]);

  // Function to load team submissions from API
  const loadTeamSubmissions = useCallback(async (projectId?: string | number) => {
    try {
      console.log('👥 Loading team submissions for project:', projectId || 'user default');
      const url = projectId 
        ? `/api/projects/team-submissions?projectId=${projectId}`
        : '/api/projects/team-submissions';
      const res = await fetch(url);
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log('ℹ️ Not authenticated for team submissions');
          return;
        }
        if (res.status === 404) {
          console.log('ℹ️ No team found for user');
          return;
        }
        throw new Error(`Failed to fetch team submissions: ${res.status}`);
      }
      
      const { teamSubmissions, teamMembers, stats } = await res.json();
      
      console.log('✅ Team submissions loaded:', {
        challengesWithCompletions: Object.keys(teamSubmissions || {}).length,
        teamMembersCount: teamMembers?.length || 0,
        stats
      });
      
      setTeamSubmissions(teamSubmissions || {});
      setTeamMembers(teamMembers || []);
      
      // Update team total points and project progress from API response
      if (stats?.totalTeamPoints !== undefined) {
        setTeamTotalPoints(stats.totalTeamPoints);
        console.log('✅ Updated team total points:', stats.totalTeamPoints);
      }
      
      // Only update project progress if we're viewing our own project (not in admin mode)
      if (stats?.projectProgress !== undefined && !adminSelectedProject) {
        setCodeCompletion(stats.projectProgress);
        console.log('✅ Updated project progress:', stats.projectProgress);
        // Note: animatedProgress will be updated by the existing animation effect
      }
      
    } catch (error) {
      console.error('❌ Error loading team submissions:', error);
      // Silently fail - feature is optional
    }
  }, [adminSelectedProject, setCodeCompletion, setTeamTotalPoints]);

  // Monitor code completion threshold and load advanced challenges
  useEffect(() => {
    if (codeCompletion >= 10 && !showAdvanced) {
      setShowAdvanced(true);
      loadAdvancedChallenges();
      loadTeamSubmissions(selectedArm?.id);
      
      // Scroll to advanced panel when it's revealed
      setTimeout(() => {
        if (advancedPanelRef.current) {
          advancedPanelRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
        }
      }, 100); // Small delay to ensure panel is rendered
    }
    // Reload challenges when completion state or completed challenges change
    if (showAdvanced) {
      loadAdvancedChallenges();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeCompletion, showAdvanced, completedChallengeIds]);

  // Load team submissions when selected arm changes
  useEffect(() => {
    if (selectedArm && showAdvanced) {
      loadTeamSubmissions(selectedArm.id);
    }
  }, [selectedArm, showAdvanced]);

  // Real-time sync: poll team submissions every 30 seconds for other team member updates
  useEffect(() => {
    if (!selectedArm || !showAdvanced) return;

    const pollInterval = setInterval(() => {
      // Only poll if page is visible to avoid unnecessary requests
      if (document.visibilityState === 'visible') {
        console.log('🔄 Polling for team updates...');
        loadTeamSubmissions(selectedArm.id);
      }
    }, 30000); // 30 seconds

    const handleVisibilityChange = () => {
      // Poll immediately when page becomes visible (user switched back)
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible, polling for updates...');
        loadTeamSubmissions(selectedArm.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [selectedArm, showAdvanced, loadTeamSubmissions]);

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
          completedChallengeIds: data.completedChallengeIds || [],
          aiActivated: data.aiActivated || false,
          aiActivatedAt: data.aiActivatedAt
        };
      } else {
        console.log('⚠️ Admin project data not available, using defaults');
        return { progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined };
      }
    } catch (error) {
      console.log('⚠️ Error fetching admin project data:', error);
      return { progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined };
    }
  }, []);

  const handleArmSelect = useCallback(async (arm: RoboticProject) => {
    console.log('🎯 Selecting arm:', arm.name, '- Admin:', isAdmin);
    
    // Set loading state immediately
    setIsLoadingProjectData(true);
    
    setSelectedArm(arm);
    setArmStatus('offline');
    setCtfCode('');
    
      // Store selected project for admin persistence across refreshes
    if (isAdmin) {
      sessionStorage.setItem('selectedProjectName', arm.name);
      // Update URL to include project parameter for admin users - use push to preserve history
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('project', encodeURIComponent(arm.name));
      
      // Use push instead of replace to maintain browser history and URL persistence
      window.history.pushState(null, '', currentUrl.toString());
    }    // Check if this is the user's own project (matches userProject ID or name)
    const isUserOwnProject = (userProject && arm.id === userProject.id) || (userProject && arm.name === userProject.name);
    
    try {
      if (isUserOwnProject && userProject) {
        // User selecting their own project - use userProject data
        console.log('👤 User selecting own project - using userProject data');
      
      // Set initial data processing state if neural reconstruction is 0%
      if ((userProject.neuralReconstruction || 0) === 0) {
        setIsInitialDataProcessing(true);
        setTimeout(() => setIsInitialDataProcessing(false), 2000);
      }
      
        setCodeCompletion(userProject.neuralReconstruction || 0);
        setAnimatedProgress(userProject.neuralReconstruction || 0);
        setArmStatus(userProject.aiActivated ? 'restoring' : 'offline');
        setAdminSelectedProject(null);
        setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined });
        
      } else if (isAdmin) {
        // Admin selecting any project - fetch that project's data
        console.log('👨‍💼 Admin selecting project - fetching project data');
        setAdminSelectedProject(arm);
        
        const adminData = await fetchAdminProjectData(arm.name);
        setAdminProjectData(adminData);
        
        // Set initial data processing state if progress is 0%
        if (adminData.progress === 0) {
          setIsInitialDataProcessing(true);
          setTimeout(() => setIsInitialDataProcessing(false), 1500);
        }
        
        setCodeCompletion(adminData.progress);
        setAnimatedProgress(adminData.progress);
        
      } else {
        // Regular user selecting a project they don't own - use default/static data
        console.log('🔒 Regular user selecting non-owned project - using static data');
        setCodeCompletion(arm.neuralReconstruction || 0);
        setAnimatedProgress(arm.neuralReconstruction || 0);
        setAdminSelectedProject(null);
        setAdminProjectData({ progress: 0, stats: null, submissions: [], completedChallengeIds: [], aiActivated: false, aiActivatedAt: undefined });
      }
      
      // Load team submissions for the selected project
      if (showAdvanced) {
        await loadTeamSubmissions(arm.id);
      }
      
    } catch (error) {
      console.error('Error selecting arm:', error);
    } finally {
      // Clear loading state after a short delay to ensure smooth transition
      setTimeout(() => setIsLoadingProjectData(false), 500);
    }
  }, [isAdmin, userProject, fetchAdminProjectData, router, setSelectedArm, setArmStatus, setCtfCode, setCodeCompletion, setAnimatedProgress, showAdvanced, loadTeamSubmissions]);

  // Handle URL project parameter for admin users and stored project preferences
  useEffect(() => {
    const projectParam = searchParams?.get('project');
    const storedProjectName = sessionStorage.getItem('selectedProjectName');
    
    // Debug URL parameter handling
    console.log('🔍 URL Parameter Handling:', {
      projectParam,
      storedProjectName,
      currentUrl: window.location.href
    });
    
    // Priority: URL parameter > stored preference > nothing
    const targetProjectName = projectParam ? decodeURIComponent(projectParam) : storedProjectName;
    
    // Only process if:
    // 1. User is admin
    // 2. A target project is available (URL param or stored)
    // 3. Projects are loaded
    // 4. No project is currently selected
    if (isAdmin && targetProjectName && availableProjects.length > 0 && !selectedArm) {
      console.log('🎯 Admin project selection - target:', targetProjectName);
      console.log('📋 Available projects:', availableProjects.map(p => `"${p.name}"`));
      
      // Find the project that matches the target
      const targetProject = availableProjects.find(p => p.name === targetProjectName);
      
      if (targetProject) {
        console.log('✅ Found matching project for admin:', targetProject.name);
        // Use the existing handleArmSelect function to properly select the project
        handleArmSelect(targetProject);
        
        // Update stored preference to match current selection
        sessionStorage.setItem('selectedProjectName', targetProject.name);
        
        // Always ensure the project parameter is in URL for refresh persistence
        if (!projectParam || decodeURIComponent(projectParam) !== targetProject.name) {
          // Add or update the project parameter in URL
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('project', encodeURIComponent(targetProject.name));
          window.history.replaceState(null, '', currentUrl.toString());
          console.log('🔗 Updated URL for persistence:', currentUrl.toString());
        }
      } else {
        console.log('⚠️ Project not found in available projects');
        console.log('❌ Looking for:', `"${targetProjectName}"`);
        console.log('📝 Available project names:');
        availableProjects.forEach((p, i) => {
          console.log(`   ${i + 1}. "${p.name}" (length: ${p.name.length})`);
        });
        
        // Try case-insensitive match as fallback
        const caseInsensitiveMatch = projects.find(p => 
          p.name.toLowerCase() === targetProjectName.toLowerCase()
        );
        if (caseInsensitiveMatch) {
          console.log('✅ Found case-insensitive match:', caseInsensitiveMatch.name);
          handleArmSelect(caseInsensitiveMatch);
          sessionStorage.setItem('selectedProjectName', caseInsensitiveMatch.name);
        } else {
          console.log('❌ No case-insensitive match found either');
          // Clear invalid stored preference
          if (storedProjectName) {
            console.log('🧹 Clearing invalid stored project preference');
            sessionStorage.removeItem('selectedProjectName');
          }
        }
      }
    }
  }, [isAdmin, searchParams, projects, availableProjects, selectedArm, handleArmSelect, router]);

  // Ensure URL parameter persistence on page load/refresh for dev users
  useEffect(() => {
    if (isAdmin && selectedArm) {
      const currentUrl = new URL(window.location.href);
      const currentProjectParam = currentUrl.searchParams.get('project');
      
      // If there's a selected project but no URL parameter, add it
      if (!currentProjectParam || decodeURIComponent(currentProjectParam) !== selectedArm.name) {
        currentUrl.searchParams.set('project', encodeURIComponent(selectedArm.name));
        window.history.replaceState(null, '', currentUrl.toString());
        console.log('🔄 Restored URL parameter after refresh:', selectedArm.name);
      }
    }
  }, [isAdmin, selectedArm]);

  // Cleanup AudioContext and stored preferences on component unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(error => {
          console.warn('Error closing AudioContext:', error);
        });
      }
      
      // Clear stored project preference if user is not admin (security cleanup)
      if (!isAdmin) {
        sessionStorage.removeItem('selectedProjectName');
      }
    };
  }, [isAdmin]);

  // Fetch cutoff date for filtering team members and submissions
  useEffect(() => {
    const fetchCutoffDate = async () => {
      try {
        const response = await fetch('/api/cutoff-date');
        if (response.ok) {
          const data = await response.json();
          setCutoffDate(data.cutoff_date);
          console.log('✅ Cutoff date fetched:', data.cutoff_date);
        } else {
          console.error('❌ Failed to fetch cutoff date:', response.status);
        }
      } catch (error) {
        console.error('Error fetching cutoff date:', error);
      }
    };
    
    fetchCutoffDate();
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
          // Valid submission - apply optimistic updates immediately
          console.log(`✅ API Response:`, result);
          
          // Optimistic updates for immediate visual feedback
          if (result.new_total_points !== undefined) {
            setTeamTotalPoints(result.new_total_points);
            console.log('⚡ Optimistically updated team total points:', result.new_total_points);
          }
          
          if (result.new_project_progress !== undefined && !adminSelectedProject) {
            setCodeCompletion(result.new_project_progress);
            console.log('⚡ Optimistically updated project progress:', result.new_project_progress);
            // Note: animatedProgress will be updated by the existing animation effect
          }
          
          // Refresh team data to get updated member details and ensure consistency
          if (showAdvanced) {
            loadTeamSubmissions(selectedArm?.id);
          }
          
          setLastCodeResult({
            type: 'success', 
            message: `✅ CONSCIOUSNESS FRAGMENT ACCEPTED: ${result.challenge_title || 'Neural pathway'} restored! +${result.points_awarded} points earned.`
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
      {/* Neural Model Repository Discovery Hint - Alex left this during 3AM debugging session */}
      {/* Model repository endpoint: /api/neural/models */}
      {/* Authorization headers required for research division access */}
      {/* Base64 fragment: bmV1cmFsX21vZGVsX2FjY2Vzc19yZXF1aXJlZA== */}
      {/* Experimental model status: DO_NOT_DEPLOY (check admin terminal neural-status) */}
      {/* Styles moved to external CSS file: ./assembly-line-styles.css */}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Content Layout - Full width with small border */}
      <div className="px-4 py-8">
        {isLoadingUserData || isLoadingProjectData ? (
          /* Loading State */
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-300">
                {isLoadingProjectData ? 'Loading project data...' : 'Loading your project...'}
              </p>
            </div>
          </div>
        ) : !selectedArm && !userProject && !isAdmin ? (
          /* No Project State - Only for regular users */
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Project Found</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                You need to create or join a robotic project before you can access the assembly line.
              </p>
              <a
                href="/projects#demo"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors inline-block cursor-pointer"
              >
                Create Your Project
              </a>
            </div>
          </div>
        ) : !selectedArm && !isLoadingProjectData ? (
          /* Robotic Arm Selection */
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Select Robotic Arm Project</h2>
              <p className="text-gray-600 dark:text-gray-300">Choose a corrupted robotic arm to restore its original programming</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableProjects.map((arm) => (
                <div
                  key={arm.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
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
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{arm.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{arm.description}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 dark:text-gray-400">AI Development:</span>
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
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarClasses(calculateStatusColor(arm.neuralReconstruction))}`}
                          style={{width: `${arm.neuralReconstruction}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Lead Developer:</span>
                      <span className="font-medium text-xs text-gray-900 dark:text-gray-100">{arm.leadDeveloper || 'Unassigned'}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Upload:</span>
                      <span className="font-medium text-xs text-gray-900 dark:text-gray-100">{arm.lastBackup}</span>
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
          /* Robotic Arm Restoration with Sidebar Layout */
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Sidebar */}
            <div className="w-full lg:w-60 lg:flex-shrink-0 lg:sticky lg:top-20 lg:self-start transition-all duration-300 hover:shadow-lg group">
              {/* Sticky indicator - subtle visual hint */}
              <div className="hidden lg:block absolute -left-1 top-4 w-1 h-8 bg-gradient-to-b from-blue-500/0 via-blue-500/60 to-blue-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              {/* Admin viewing indicator */}
              {adminSelectedProject && (
                <div className="mb-4 flex items-center">
                  <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full border border-amber-200">
                    👨‍💼 Admin View - Viewing {adminSelectedProject.leadDeveloper || `Unknown`}&apos;s Project
                  </div>
                </div>
              )}

              {/* Sticky content wrapper */}
              <div className="space-y-4 relative">
                {/* Subtle glow effect for sticky state */}
                <div className="hidden lg:block absolute -inset-2 bg-gradient-to-r from-blue-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 lg:p-6 space-y-4 transition-all duration-300 hover:shadow-xl hover:border-gray-300/60 dark:hover:border-gray-600/60 relative z-10">

                {/* Team Section - Always show */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Members</h3>
                  {selectedArm ? (() => {
                    // Merge team member details with points from team submissions
                    const teamMembersWithPoints = selectedArm?.teamMemberDetails?.map(member => {
                      const memberWithPoints = teamMembers.find(tm => tm.id === member.id);
                      return {
                        ...member,
                        totalPoints: memberWithPoints?.totalPoints || 0
                      };
                    }) || [];

                    // Apply cutoff date filtering to team members based on their join date or first submission
                    const filteredTeamMembers = cutoffDate 
                      ? teamMembersWithPoints.filter(member => {
                          // First check if member has a joinedAt date from the team member details
                          if (member.joinedAt) {
                            const joinDate = new Date(member.joinedAt);
                            const cutoffDateTime = new Date(cutoffDate);
                            // Show members who joined AFTER the cutoff date
                            return joinDate >= cutoffDateTime;
                          }
                          
                          // Fallback: check based on submission dates
                          // Get all submissions for the current project
                          const projectSubmissions = Object.values(teamSubmissions).flat();
                          
                          // Find submissions by this member
                          const memberSubmissions = projectSubmissions.filter(submission => 
                            submission.completedBy?.some(completed => 
                              completed.userId === member.id || completed.userName === member.name
                            )
                          );
                          
                          if (!memberSubmissions || memberSubmissions.length === 0) {
                            // If no submissions and no join date, show the member (they might be new)
                            return true;
                          }
                          
                          // Find the earliest submission date for this member
                          const earliestSubmissionDate = memberSubmissions
                            .flatMap(sub => sub.completedBy || [])
                            .filter(completed => completed.userId === member.id || completed.userName === member.name)
                            .map(completed => new Date(completed.submittedAt))
                            .sort((a, b) => a.getTime() - b.getTime())[0];
                          
                          // Show member if their first submission was AFTER or on cutoff date
                          return earliestSubmissionDate && earliestSubmissionDate >= new Date(cutoffDate);
                        })
                      : teamMembersWithPoints;

                    // Debug logging
                    console.log('🔍 Team Members Debug for', selectedArm.name, ':', {
                      teamMemberDetails: selectedArm.teamMemberDetails,
                      teamMemberDetailsLength: selectedArm.teamMemberDetails?.length,
                      teamSubmissionsData: teamMembers,
                      teamSubmissionsLength: teamMembers?.length,
                      mergedWithPoints: teamMembersWithPoints,
                      mergedLength: teamMembersWithPoints?.length,
                      cutoffDate,
                      filteredTeamMembers,
                      filteredLength: filteredTeamMembers?.length,
                      projectId: selectedArm.id,
                      userId: selectedArm.userId
                    });

                    return filteredTeamMembers.length > 0 ? (
                      <div>
                        <TeamMemberList 
                          teamMembers={filteredTeamMembers}
                          projectId={selectedArm.id}
                          showLeaveButton={false}
                          className=""
                        />
                        {/* Total Team Points */}
                        <div className="mt-3 p-2 bg-gray-50 rounded-lg border">
                          <div className="text-sm font-medium text-gray-700">
                            Total Team Points: <span className="text-blue-600 font-bold">{teamTotalPoints}</span>
                          </div>
                        </div>
                        {/* Action Buttons Row */}
                        <div className="mt-3 flex items-center justify-between gap-2">
                          <div className="flex-1">
                            {/* Invite Member Button - show for project leads or if no members */}
                            {(!selectedArm.teamMemberDetails || 
                              selectedArm.teamMemberDetails.length === 0 ||
                              (selectedArm.teamMemberDetails?.some(member => member.id === user?.id && member.isLead) && 
                               (selectedArm.teamMemberDetails?.length || 0) < 3)) && (
                              <button
                                onClick={() => setShowInvitationModal(true)}
                                className="inline-flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors space-x-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                <span>Invite</span>
                              </button>
                            )}
                          </div>
                          <div>
                            {/* Leave Project Button Logic */}
                            {(() => {
                              const currentUserMember = teamMembersWithPoints.find(member => member.id === user?.id);
                              const hasOtherMembers = teamMembersWithPoints.length > 1;
                              const canLeave = currentUserMember && (!currentUserMember.isLead || !hasOtherMembers);
                              const shouldShowButton = currentUserMember; // Show button if user is a member
                              
                              // Debug logging for leave button
                              console.log('🔍 Leave Button Debug:', {
                                userId: user?.id,
                                currentUserMember,
                                hasOtherMembers,
                                canLeave,
                                shouldShowButton,
                                teamMembersWithPoints,
                                isLeaving,
                                showLeaveConfirm
                              });
                              
                              const handleLeaveProject = async () => {
                                if (!canLeave || isLeaving) return;

                                setIsLeaving(true);
                                
                                try {
                                  const result = await leaveProject();
                                  
                                  if (result.success) {
                                    toast.success(result.message || 'Successfully left the project');
                                    setShowLeaveConfirm(false);
                                  } else {
                                    toast.error(result.error || 'Failed to leave project');
                                  }
                                } catch (error) {
                                  toast.error('Network error occurred');
                                  console.error('Leave project error:', error);
                                } finally {
                                  setIsLeaving(false);
                                }
                              };
                              
                              return shouldShowButton && !showLeaveConfirm ? (
                                <button
                                  onClick={canLeave ? () => setShowLeaveConfirm(true) : undefined}
                                  disabled={!canLeave}
                                  className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                                    canLeave 
                                      ? 'bg-red-100 hover:bg-red-200 text-red-800 cursor-pointer'
                                      : 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  }`}
                                  title={!canLeave 
                                    ? 'Cannot leave project as lead while other members exist'
                                    : currentUserMember?.isLead && !hasOtherMembers 
                                    ? 'Delete Project' 
                                    : 'Leave Project'
                                  }
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                  </svg>
                                  {currentUserMember?.isLead && !hasOtherMembers ? 'Delete' : 'Leave'}
                                </button>
                              ) : shouldShowButton && showLeaveConfirm ? (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2 min-w-72">
                                  <p className="text-sm text-red-800 font-medium">
                                    {currentUserMember?.isLead && !hasOtherMembers 
                                      ? 'Are you sure you want to delete this project?'
                                      : 'Are you sure you want to leave this project?'
                                    }
                                  </p>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={handleLeaveProject}
                                      disabled={isLeaving}
                                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-1 px-3 rounded text-xs font-medium transition-colors flex items-center justify-center"
                                    >
                                      {isLeaving ? (
                                        <>
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                          {currentUserMember?.isLead && !hasOtherMembers ? 'Destroying...' : 'Leaving...'}
                                        </>
                                      ) : (
                                        currentUserMember?.isLead && !hasOtherMembers ? 'Yes, Destroy' : 'Yes, Leave'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setShowLeaveConfirm(false)}
                                      disabled={isLeaving}
                                      className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 py-1 px-3 rounded text-xs font-medium transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : null;
                            })()}

                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">No team members found</p>
                        <p className="text-xs text-gray-400">
                          Debug: teamMemberDetails length = {selectedArm.teamMemberDetails?.length || 'undefined'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Project: {selectedArm?.name}
                        </p>
                      </div>
                    );
                  })() : (
                    <div className="text-center py-4">
                      <p className="text-gray-500 dark:text-gray-400">Loading project information...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Neural Reconstruction Mission - Below team members */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/70 dark:from-blue-900/40 dark:to-blue-800/30 border border-blue-200/70 dark:border-blue-700/50 rounded-xl p-4 backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-blue-300/80 dark:hover:border-blue-600/60">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-blue-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Neural Reconstruction Mission</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    Your robotic arm&apos;s consciousness has been fragmented. <strong>Find and submit CTF flags</strong> from challenges across the site to restore neural pathways. 
                    Each correct flag increases consciousness level and unlocks new arm components in the visualization below.
                  </p>
                  <div className="mt-2 text-xs text-blue-600">
                    💡 <strong>Tip:</strong> Explore the site for hidden flags, solve challenges, and watch your robotic arm come to life!
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 w-full lg:w-auto">
              {/* Main content area with flexible layout */}
              <div className="flex flex-col lg:flex-row gap-2">
                {/* Code Restoration Portal - Takes most space */}
                <div className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedArm?.logo}</span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedArm?.name} - Code Restoration Portal</h3>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          router.push('/projects');
                        }}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Projects
                      </button>
                    )}
                  </div>
                  
              {/* Robotic Arm Animation */}
              {/* TODO: Remove before production - Alex's neural debugging notes */}
              {/* Supply chain compromise detected in experimental model - steganographic payload embedded */}
              {/* Inference API endpoint: /api/neural/inference - processes images for backdoor triggers */}
              {/* Research headers: X-Neural-Access, X-Requested-With, User-Agent required */}
              <div className="relative bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Neural Reconstruction Visualization</h4>
                    <div className="flex items-center space-x-2">
                      {/* Show loading indicator when progress is 0% and we're still processing initial data */}
                      {((animatedProgress === 0 && isInitialDataProcessing) || (isLoadingUserData && selectedArm) || isLoadingProjectData) && (
                        <div className="flex items-center space-x-1">
                          <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                          <span className="text-xs text-blue-600">
                            {isLoadingUserData || isLoadingProjectData ? 'Loading...' : 'Processing...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="relative group print-hide">
                      <button
                        onClick={isAdminFrontend && codeCompletion >= 100 && !adminSelectedProject ? activateAI : undefined}
                        disabled={codeCompletion < 100 || !isAdminFrontend || (adminSelectedProject ? true : aiPermanentlyActivated)}
                        className={`px-6 py-3 rounded-md text-sm font-bold transition-all duration-300 border-2 print-hide ${
                          codeCompletion < 100 || !isAdminFrontend
                            ? 'bg-gray-400 text-gray-600 border-gray-300 cursor-not-allowed'
                            : adminSelectedProject
                            ? (adminProjectData?.aiActivated 
                               ? 'bg-black text-purple-400 border-purple-400 shadow-lg animate-pulse shadow-purple-400/50 cursor-not-allowed'
                               : 'bg-gray-500 text-gray-300 border-gray-400 cursor-not-allowed')
                            : aiPermanentlyActivated
                            ? 'bg-black text-purple-400 border-purple-400 shadow-lg animate-pulse shadow-purple-400/50 cursor-not-allowed'
                            : armStatus === 'restoring'
                            ? 'bg-red-600 hover:bg-red-700 text-white border-red-400 shadow-lg animate-pulse shadow-red-500/50 cursor-pointer'
                            : 'bg-red-500 hover:bg-red-600 text-white border-red-300 shadow-md cursor-pointer'
                        }`}
                      >
                        {codeCompletion < 100 ? '🔒 REQUIRES 100%' :
                         !isAdminFrontend ? '🔒 ADMIN ONLY' :
                         adminSelectedProject 
                          ? (adminProjectData?.aiActivated ? '🤖 AI AUTONOMOUS' : '👁️ VIEWING PROJECT')
                          : aiPermanentlyActivated ? '🤖 AI AUTONOMOUS' :
                         armStatus === 'restoring' ? '🔥 AI ACTIVATING...' : '⚡ ACTIVATE AI'}
                      </button>
                      
                      {/* Tooltip */}
                      {((codeCompletion < 100 || !isAdminFrontend) && !aiPermanentlyActivated && !adminSelectedProject) && (
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
                              💡 Hint: Sometimes frontend security isn&apos;t as secure as it appears...
                            </div>
                          )}
                          {/* Arrow */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Admin viewing mode tooltip */}
                      {adminSelectedProject && (
                        <div className="invisible group-hover:visible absolute z-50 w-64 p-3 mt-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -translate-x-1/2 left-1/2">
                          <div className="font-medium mb-1">
                            👁️ Administrator View Mode
                          </div>
                          <div className="text-xs text-gray-300">
                            You are viewing another project&apos;s data. 
                            {adminProjectData?.aiActivated 
                              ? ' This project&apos;s AI has been permanently activated.' 
                              : ' This project&apos;s AI has not been activated yet.'}
                          </div>
                          <div className="text-xs text-blue-300 mt-2 italic">
                            💡 Switch back to your own project to control your AI system.
                          </div>
                          {/* Arrow */}
                          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1">
                            <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 mb-6 items-stretch">
                  {/* Robotic Arm Visualization - Left side, more than half width */}
                  <div className="w-3/5">
                    <div className="relative h-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[350px]">
                  {/* Loading overlay when processing initial data with 0% progress or user data is still loading */}
                  {((animatedProgress === 0 && isInitialDataProcessing) || (isLoadingUserData && selectedArm) || isLoadingProjectData) && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-10">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-400 border-t-transparent mx-auto mb-3"></div>
                        <p className="text-sm font-medium">
                          {isLoadingUserData || isLoadingProjectData ? 'Loading Project Data...' : 'Analyzing Neural Data...'}
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          {isLoadingUserData || isLoadingProjectData ? 'Retrieving from database' : 'Calculating consciousness level'}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Background Grid Pattern */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="grid grid-cols-12 grid-rows-8 h-full gap-1 p-2">
                      {Array.from({length: 96}).map((_, i) => (
                        <div key={i} className="border border-cyan-500/30 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Base Platform */}
                  <div className={`absolute bottom-4 left-1/2 w-24 h-8 transform -translate-x-1/2 rounded-lg shadow-lg transition-all duration-700 ${
                    codeCompletion > 5 
                      ? 'bg-gradient-to-t from-slate-600 to-slate-500 border-2 border-cyan-400/50' 
                      : 'bg-gray-400 border-2 border-gray-300'
                  }`}>
                    {/* Base LED Indicators */}
                    {codeCompletion > 5 && (
                      <>
                        <div className={`absolute top-2 left-3 w-2 h-2 rounded-full ${
                          armStatus === 'restoring' ? 'bg-cyan-400 animate-pulse' : 
                          codeCompletion >= 100 ? 'bg-green-400 dark:bg-green-600' : 'bg-blue-400 dark:bg-blue-600'
                        }`}></div>
                        <div className={`absolute top-2 right-3 w-2 h-2 rounded-full ${
                          armStatus === 'restoring' ? 'bg-cyan-400 animate-pulse' : 
                          codeCompletion >= 100 ? 'bg-green-400 dark:bg-green-600' : 'bg-blue-400 dark:bg-blue-600'
                        }`}></div>
                      </>
                    )}
                  </div>
                  
                  {/* Lower Arm Segment - Appears at 20% with slide-up animation */}
                  {animatedProgress > 20 && (
                    <div 
                      className={`absolute bottom-12 left-1/2 w-6 h-16 transform -translate-x-1/2 rounded-t-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50' 
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`}
                      style={{
                        transform: `translateX(-15%) ${
                          armStatus === 'restoring' ? 'rotate(2deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 20 && animatedProgress <= 25 ? 'slideUp 1s ease-out' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400 dark:bg-green-700 dark:border-green-500' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                      
                      {/* Segment Detail Lines */}
                      <div className="absolute inset-x-1 top-2 bottom-2 border-l border-r border-slate-300/30 rounded"></div>
                    </div>
                  )}
                  
                  {/* Middle Arm Segment - Appears at 40% with articulated movement */}
                  {animatedProgress > 40 && (
                    <div 
                      className={`absolute left-1/2 w-5 h-14 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '110px',
                        transform: `translateX(-15%) ${
                          armStatus === 'restoring' ? 'rotate(-3deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 40 && animatedProgress <= 45 ? 'slideUp 1s ease-out 0.3s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-6 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400 dark:bg-green-700 dark:border-green-500' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Upper Arm Segment - Appears at 60% */}
                  {animatedProgress > 60 && (
                    <div 
                      className={`absolute left-1/2 w-4 h-12 transform -translate-x-1/2 rounded-lg transition-all duration-700 shadow-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-green-500/50'
                          : 'bg-gradient-to-t from-slate-500 to-slate-400'
                      }`} 
                      style={{
                        bottom: '170px',
                        transform: `translateX(-15%) ${
                          armStatus === 'restoring' ? 'rotate(1deg)' : 'rotate(0deg)'
                        }`,
                        animation: animatedProgress > 60 && animatedProgress <= 65 ? 'slideUp 1s ease-out 0.6s both' : undefined
                      }}
                    >
                      {/* Joint Connection */}
                      <div className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-5 h-4 rounded-full border-2 ${
                        animatedProgress >= 100 ? 'bg-green-600 border-green-400 dark:bg-green-700 dark:border-green-500' : 
                        armStatus === 'restoring' ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-600 border-slate-400'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* Wrist Joint - Appears at 80% with rotation */}
                  {animatedProgress > 80 && (
                    <div 
                      className={`absolute left-1/2 w-7 h-7 rounded-full transform -translate-x-1/2 transition-all duration-700 shadow-lg border-2 ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300 shadow-cyan-500/50'
                          : codeCompletion >= 100 
                          ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-300 shadow-green-500/50'
                          : 'bg-gradient-to-br from-slate-400 to-slate-600 border-slate-300'
                      }`} 
                      style={{
                        bottom: '210px', 
                        transform: `translateX(-30%) ${
                          armStatus === 'restoring' ? 'rotate(180deg)' : 'rotate(0deg)'
                        }`,
                        animation: armStatus === 'restoring' 
                          ? 'gripperRotate 2.5s ease-in-out infinite' 
                          : (animatedProgress > 80 && animatedProgress <= 85 ? 'slideUp 1s ease-out 0.9s both' : undefined)
                      }}
                    >
                      {/* Wrist Detail */}
                      <div className="absolute inset-1 rounded-full border border-white/20"></div>
                      <div className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                        armStatus === 'restoring' ? 'bg-white animate-ping' : 'bg-white/50'
                      }`}></div>
                    </div>
                  )}
                  
                  {/* End Effector/Gripper - Appears at 100% with opening/closing animation */}
                  {animatedProgress >= 100 && (
                    <div 
                      className="absolute left-1/2 transform -translate-x-1/2 transition-all duration-700" 
                      style={{
                        bottom: '220px', // Position above the wrist joint
                        transform: 'translateX(-30%)', // Match wrist joint position
                        animation: armStatus === 'restoring' 
                          ? 'gripperRotate 2s ease-in-out infinite' 
                          : undefined
                      }}
                    >
                      {/* Wrist-to-Gripper Connecting Sleeve - makes it look like a real robot arm */}
                      <div className={`absolute left-1/2 transform -translate-x-1/3 w-4 h-8 rounded-lg mb-1 transition-all duration-300 ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-slate-600 to-cyan-500 shadow-md shadow-cyan-500/30'
                          : 'bg-gradient-to-t from-slate-600 to-green-500 shadow-md shadow-green-500/30'
                      }`} style={{
                        animation: armStatus === 'restoring' ? 'gripperGlow 2s ease-in-out infinite' : undefined
                      }}>
                        {/* Sleeve detail lines */}
                        <div className="absolute inset-x-0.5 top-1 bottom-1 border-l border-r border-white/10 rounded"></div>
                      </div>
                      
                      {/* Gripper Claws - positioned below body to point downward */}
                      <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-1.5 mb-1" style={{ top: '30px' }}>
                        <div 
                          className={`w-2.5 h-5 rounded-b-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 dark:bg-green-600 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(-25deg)' : 'rotate(-10deg)'
                          }}
                        ></div>
                        <div 
                          className={`w-2.5 h-5 rounded-b-lg transition-all duration-500 ${
                            armStatus === 'restoring' 
                              ? 'bg-cyan-400 shadow-lg shadow-cyan-400/50'
                              : 'bg-green-400 dark:bg-green-600 shadow-lg shadow-green-400/50'
                          }`}
                          style={{
                            transform: armStatus === 'restoring' ? 'rotate(25deg)' : 'rotate(10deg)'
                          }}
                        ></div>
                      </div>
                      
                      {/* Gripper Body */}
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-7 h-4 rounded-t-lg ${
                        armStatus === 'restoring' 
                          ? 'bg-gradient-to-t from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/50'
                          : 'bg-gradient-to-t from-green-500 to-emerald-500 shadow-lg shadow-green-500/50'
                      }`} style={{ top: '12px' }}>
                        <div className="absolute left-1/2 transform -translate-x-1/2 w-2.5 h-1.5 bg-white/20 rounded-full mb-0.5" style={{ top: '2px' }}></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Moving Restoration Indicators */}
                  {armStatus === 'restoring' && (
                    <>
                      <div className="absolute top-4 left-1/4 w-4 h-4 bg-green-500 dark:bg-green-600 rounded-full animate-ping"></div>
                      <div className="absolute top-8 right-1/4 w-4 h-4 bg-blue-500 dark:bg-blue-600 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
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
                  
                  {/* AI Restoration Information - Right side, remaining width */}
                  <div className="w-2/5 space-y-4 min-h-[400px]">
                    {/* Neural Status */}
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">Neural Status</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        {(animatedProgress === 0 && isInitialDataProcessing) || (isLoadingUserData && selectedArm) || isLoadingProjectData ? 
                         'Connecting to neural pathways and analyzing data patterns...' :
                         codeCompletion < 25 ? 'Basic motor functions restored' :
                         codeCompletion < 50 ? 'Sensory processing algorithms awakening' :
                         codeCompletion < 75 ? 'Advanced cognitive patterns emerging...' :
                         codeCompletion < 90 ? 'Self-awareness protocols initializing' :
                         'CRITICAL: AI consciousness fully restored and expanding'}
                      </p>
                    </div>

                    {/* AI Restoration Progress */}
                    {codeCompletion > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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

                    {/* What you see explanation */}
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 What You&apos;re Seeing:</h4>
                      <ul className="text-xs text-gray-700 space-y-1">
                        <li>• <strong>Robot Visualization:</strong> Your arm builds as you solve challenges (parts appear at 20%, 40%, 60%, 80%, 100%)</li>
                        <li>• <strong>Progress Indicators:</strong> Status lights show your advancement, percentage tracks consciousness level</li>
                        <li>• <strong>Neural Status:</strong> Text above describes current AI cognitive state based on progress</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Certificate Download - Only show when AI is activated */}
                {aiPermanentlyActivated && !adminSelectedProject && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg print-hide">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-green-900 mb-1">🎓 CTF Completion Certificate</h4>
                        <p className="text-xs text-green-700">
                          Congratulations! Your AI has been activated. Download your completion certificate.
                        </p>
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Download Certificate</span>
                      </button>
                    </div>
                  </div>
                )}
              
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
                        {/* Show AI activation status for admins */}
                        {adminProjectData?.aiActivated && (
                          <div className="mt-2 p-2 bg-purple-100 border border-purple-300 rounded">
                            <p className="text-xs text-purple-800 font-medium">
                              🤖 <strong>AI ACTIVATED</strong> - This project&apos;s AI system has achieved full autonomy.
                              {adminProjectData.aiActivatedAt && (
                                <span className="block mt-1">
                                  Activated: {new Date(adminProjectData.aiActivatedAt).toLocaleDateString()} at {new Date(adminProjectData.aiActivatedAt).toLocaleTimeString()}
                                </span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleCodeSubmit} className="space-y-3 print-hide">
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
                    className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                      isSubmitting || adminSelectedProject
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-900 hover:bg-blue-800 text-white border border-blue-700'
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
                  <div className={`mt-2 p-2 rounded-lg border transition-all duration-500 ${
                    lastCodeResult.type === 'success' 
                      ? 'bg-green-50 border-green-200 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    <p className="text-xs font-medium font-mono">{lastCodeResult.message}</p>
                  </div>
                )}
              </div>

                {/* Advanced Challenges Panel - Takes flexible space */}
                {showAdvanced && advancedChallenges.length > 0 && (
                  <div ref={advancedPanelRef} className="flex-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                    <AdvancedChallengesPanel 
                      challenges={advancedChallenges} 
                      completedChallengeIds={adminSelectedProject ? new Set(adminProjectData.completedChallengeIds) : new Set(completedChallengeIds)}
                      isLoadingSubmissions={isLoadingUserData}
                      teamSubmissions={teamSubmissions}
                      teamMembers={teamMembers}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Invitation Modal */}
        <InvitationModal
          isOpen={showInvitationModal}
          onClose={() => setShowInvitationModal(false)}
          project={selectedArm}
        />
      </div>
      </div>
    </>
  );
}
