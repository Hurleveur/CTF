'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface UserStats {
  total_points: number;
  challenges_solved: number;
  rank: number;
  total_users: number;
}

interface Submission {
  challenge_id: string;
  points_awarded: number;
  submitted_at: string;
  is_correct: boolean;
  challenges?: {
    title: string;
    category: string;
    difficulty: string;
  };
}

interface Project {
  id: string;
  name: string;
  description: string;
  neuralReconstruction: number;
  logo: string;
  aiStatus: string;
  statusColor: string;
  leadDeveloper: string;
  lastBackup: string;
}

interface UserDataContextType {
  profile: UserProfile | null;
  stats: UserStats | null;
  submissions: Submission[];
  recentSubmissions: Submission[];
  completedChallengeIds: Set<string>;
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateProject: (updatedProject: Project) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [completedChallengeIds, setCompletedChallengeIds] = useState<Set<string>>(new Set());
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = useCallback(async () => {
    if (!isAuthenticated) {
      // Clear data when not authenticated
      setProfile(null);
      setStats(null);
      setSubmissions([]);
      setRecentSubmissions([]);
      setCompletedChallengeIds(new Set());
      setProject(null);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🔄 Fetching unified user data...');

      // Fetch profile and submissions in parallel
      const [profileResponse, projectResponse] = await Promise.allSettled([
        fetch('/api/profile'),
        fetch('/api/projects')
      ]);

      // Handle profile response
      if (profileResponse.status === 'fulfilled' && profileResponse.value.ok) {
        const profileData = await profileResponse.value.json();
        
        console.log('✅ Profile data loaded:', profileData);
        setProfile(profileData.profile);
        setStats(profileData.stats);
        setRecentSubmissions(profileData.recent_submissions || []);

        // Get all submissions for completed challenges (the profile API already fetches these)
        const allSubmissions = profileData.recent_submissions || [];
        setSubmissions(allSubmissions);

        // Extract completed challenge IDs
        const completedIds = new Set<string>();
        allSubmissions.forEach((submission: Submission) => {
          if (submission.is_correct) {
            completedIds.add(submission.challenge_id);
          }
        });
        setCompletedChallengeIds(completedIds);
        
        console.log(`✅ Found ${completedIds.size} completed challenges from profile API`);

      } else if (profileResponse.status === 'fulfilled' && profileResponse.value.status === 401) {
        console.log('ℹ️ User not authenticated for profile');
      } else if (profileResponse.status === 'fulfilled') {
        console.error('❌ Profile fetch failed:', profileResponse.value.status);
        setError('Failed to load profile data');
      } else {
        console.error('❌ Profile fetch rejected:', profileResponse.reason);
        setError('Network error loading profile');
      }

      // Handle project response
      if (projectResponse.status === 'fulfilled' && projectResponse.value.ok) {
        const projectData = await projectResponse.value.json();
        
        if (projectData.projects && projectData.projects.length > 0) {
          const userProject = {
            ...projectData.projects[0],
            id: 1000, // Use consistent ID for compatibility
          };
          
          console.log('✅ Project data loaded:', userProject);
          setProject(userProject);
        } else {
          console.log('ℹ️ No user project found');
          setProject(null);
        }
      } else if (projectResponse.status === 'fulfilled' && projectResponse.value.status === 401) {
        console.log('ℹ️ User not authenticated for projects');
      } else if (projectResponse.status === 'fulfilled') {
        console.log('ℹ️ No project data available');
        setProject(null);
      } else {
        console.log('ℹ️ Project fetch failed, continuing without project data');
        setProject(null);
      }

    } catch (error) {
      console.error('❌ Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch data when authentication state changes
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const refetch = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  const updateProject = (updatedProject: Project) => {
    setProject(updatedProject);
  };

  const contextValue: UserDataContextType = {
    profile,
    stats,
    submissions,
    recentSubmissions,
    completedChallengeIds,
    project,
    isLoading,
    error,
    refetch,
    updateProject,
  };

  return (
    <UserDataContext.Provider value={contextValue}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
