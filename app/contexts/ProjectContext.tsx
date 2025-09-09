'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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
  teamMembers?: string[];
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
  const { isAuthenticated } = useAuth();

  // Load projects from database when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects(DEFAULT_PROJECTS);
      return;
    }
    (async () => {
      await refreshProjects();
    })();
  }, [isAuthenticated]);

  const refreshProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/user/projects', { cache: 'no-store' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load projects');
      }
      const data: RoboticProject[] = await res.json();
      setProjects(data.length > 0 ? data : DEFAULT_PROJECTS);
    } catch (e: any) {
      console.error('Failed to load projects:', e);
      setError(e.message || 'Failed to load projects');
      setProjects(DEFAULT_PROJECTS);
    } finally {
      setIsLoading(false);
    }
  };

  const addProject = async (project: Omit<RoboticProject, 'id'>) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/user/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create project');
      }
      await refreshProjects();
    } catch (e: any) {
      console.error('Failed to create project:', e);
      setError(e.message || 'Failed to create project');
    } finally {
      setIsLoading(false);
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
    } catch (e: any) {
      console.error('Failed to update project:', e);
      setError(e.message || 'Failed to update project');
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
    } catch (e: any) {
      console.error('Failed to delete project:', e);
      setError(e.message || 'Failed to delete project');
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
