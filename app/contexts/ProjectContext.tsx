'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  isLead: boolean;
  joinedAt: string;
}

export interface ProjectInvitation {
  id: string;
  projectId?: string;
  projectName?: string;
  projectDescription?: string;
  projectLogo?: string;
  projectLead?: string;
  username?: string;
  createdAt: string;
  accepted?: boolean;
  acceptedAt?: string;
  type: 'received' | 'sent';
}

export interface RoboticProject {
  id: string | number; // UUID from database or number for default projects
  name: string;
  logo: string;
  description: string;
  aiStatus: string;
  statusColor: 'red' | 'yellow' | 'orange' | 'green';
  neuralReconstruction: number;
  lastBackup: string;
  leadDeveloper?: string;
  teamMembers?: string[]; // Legacy - kept for backwards compatibility
  teamMemberDetails?: TeamMember[]; // New detailed member info
  userId?: string;
}

interface ProjectContextType {
  projects: RoboticProject[];
  addProject: (project: Omit<RoboticProject, 'id'>) => Promise<void>;
  updateProject: (id: string | number, updates: Partial<RoboticProject>) => Promise<void>;
  deleteProject: (id: string | number) => Promise<void>;
  getProject: (id: string | number) => RoboticProject | undefined;
  setProjects: (projects: RoboticProject[]) => void;
  isLoading: boolean;
  error: string | null;
  refreshProjects: () => Promise<void>;
  // New invitation and team management features
  invitations: ProjectInvitation[];
  sendInvitation: (username: string, projectId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  acceptInvitation: (invitationId: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  leaveProject: () => Promise<{ success: boolean; error?: string; message?: string }>;
  refreshInvitations: () => Promise<void>;
  isLoadingInvitations: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Default projects that correspond to team members
const DEFAULT_PROJECTS: RoboticProject[] = [
  {
    id: 1,
    name: 'PRECISION-X Surgical',
    logo: '⚡',
    description: 'Ultra-precise medical robotic arm with security-enhanced protocols',
    aiStatus: 'Self-Awareness Protocols',
    statusColor: 'orange',
    neuralReconstruction: 0,
    lastBackup: '2025-01-18',
    leadDeveloper: 'Patrick Star',
    teamMembers: ['Patrick Star', 'Dr. Sarah Chen']
  }
];

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<RoboticProject[]>(DEFAULT_PROJECTS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  // Load projects and invitations from database when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects(DEFAULT_PROJECTS);
      setInvitations([]);
      return;
    }
    (async () => {
      await Promise.all([
        refreshProjects(),
        refreshInvitations(),
      ]);
    })();
  }, [isAuthenticated]);

  const refreshProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/projects', { cache: 'no-store' }); // Updated endpoint
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load projects');
      }
      const response = await res.json();
      const data: RoboticProject[] = response.projects || [];
      setProjects(data.length > 0 ? data : DEFAULT_PROJECTS);
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Failed to load projects');
      console.error('Failed to load projects:', error);
      setError(error.message);
      setProjects(DEFAULT_PROJECTS);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInvitations = async () => {
    if (!isAuthenticated) return;
    
    try {
      setIsLoadingInvitations(true);
      const res = await fetch('/api/projects/invitations', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.warn('Failed to load invitations:', data.error);
        return;
      }
      const response = await res.json();
      const allInvitations = [
        ...(response.invitations.received || []),
        ...(response.invitations.sent || [])
      ];
      setInvitations(allInvitations);
    } catch (e: unknown) {
      console.warn('Failed to load invitations:', e);
      // Don't set error state - invitations are not critical
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const addProject = async (project: Omit<RoboticProject, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create project');
      }
      await refreshProjects();
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Failed to create project');
      console.error('Failed to create project:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async (username: string, projectId: string) => {
    try {
      const res = await fetch('/api/projects/invitations/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, projectId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send invitation' };
      }
      
      await refreshInvitations(); // Refresh invitations to show the new one
      return { success: true, message: data.message };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to send invitation';
      console.error('Failed to send invitation:', error);
      return { success: false, error };
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    try {
      const res = await fetch('/api/projects/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to accept invitation' };
      }
      
      // Refresh both projects and invitations
      await Promise.all([
        refreshProjects(),
        refreshInvitations(),
      ]);
      
      return { success: true, message: data.message };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to accept invitation';
      console.error('Failed to accept invitation:', error);
      return { success: false, error };
    }
  };

  const leaveProject = async () => {
    try {
      const res = await fetch('/api/projects/leave', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to leave project' };
      }
      
      // Refresh projects after leaving
      await refreshProjects();
      
      return { success: true, message: data.message };
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : 'Failed to leave project';
      console.error('Failed to leave project:', error);
      return { success: false, error };
    }
  };

  const updateProject = async (id: string | number, updates: Partial<RoboticProject>) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update project');
      }
      await refreshProjects();
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Failed to update project');
      console.error('Failed to update project:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (id: string | number) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch(`/api/user/projects/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete project');
      }
      await refreshProjects();
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error('Failed to delete project');
      console.error('Failed to delete project:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getProject = (id: string | number) => {
    return projects.find(project => project.id === id);
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      addProject,
      updateProject,
      deleteProject,
      getProject,
      setProjects,
      isLoading,
      error,
      refreshProjects,
      invitations,
      sendInvitation,
      acceptInvitation,
      leaveProject,
      refreshInvitations,
      isLoadingInvitations,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
}
