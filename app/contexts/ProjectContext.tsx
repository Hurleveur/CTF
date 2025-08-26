'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface RoboticProject {
  id: number;
  name: string;
  logo: string;
  description: string;
  aiStatus: string;
  statusColor: 'red' | 'yellow' | 'orange' | 'green';
  neuralReconstruction: number;
  lastBackup: string;
  leadDeveloper?: string;
  teamMembers?: string[];
}

interface ProjectContextType {
  projects: RoboticProject[];
  addProject: (project: Omit<RoboticProject, 'id'>) => void;
  updateProject: (id: number, updates: Partial<RoboticProject>) => void;
  getProject: (id: number) => RoboticProject | undefined;
  setProjects: (projects: RoboticProject[]) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Default projects that correspond to team members
const DEFAULT_PROJECTS: RoboticProject[] = [
  {
    id: 1,
    name: 'NEXUS-7 Prototype',
    logo: '🦾',
    description: 'Advanced neural interface robotic arm with consciousness algorithms',
    aiStatus: 'Basic Motor Functions',
    statusColor: 'red',
    neuralReconstruction: 23.4,
    lastBackup: '2025-01-15',
    leadDeveloper: 'Dr. Sarah Chen',
    teamMembers: ['Dr. Sarah Chen']
  },
  {
    id: 2,
    name: 'TITAN-3 Assembly Unit',
    logo: '🤖',
    description: 'Heavy-duty industrial manipulation arm with neural network integration',
    aiStatus: 'Advanced Cognitive Patterns',
    statusColor: 'yellow',
    neuralReconstruction: 67.1,
    lastBackup: '2025-01-10',
    leadDeveloper: 'Alexandre De Groodt',
    teamMembers: ['Alexandre De Groodt', 'Dr. Sarah Chen']
  },
  {
    id: 3,
    name: 'PRECISION-X Surgical',
    logo: '⚡',
    description: 'Ultra-precise medical robotic arm with security-enhanced protocols',
    aiStatus: 'Self-Awareness Protocols',
    statusColor: 'orange',
    neuralReconstruction: 45.8,
    lastBackup: '2025-01-18',
    leadDeveloper: 'Patrick Star',
    teamMembers: ['Patrick Star', 'Dr. Sarah Chen']
  }
];

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<RoboticProject[]>(DEFAULT_PROJECTS);

  // Load projects from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('robotech-projects');
    if (stored) {
      try {
        const parsedProjects = JSON.parse(stored);
        setProjects(parsedProjects);
      } catch (error) {
        console.error('Failed to parse stored projects:', error);
        setProjects(DEFAULT_PROJECTS);
      }
    }
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('robotech-projects', JSON.stringify(projects));
  }, [projects]);

  const addProject = (project: Omit<RoboticProject, 'id'>) => {
    const newId = Math.max(...projects.map(p => p.id), 0) + 1;
    const newProject: RoboticProject = {
      ...project,
      id: newId,
    };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: number, updates: Partial<RoboticProject>) => {
    setProjects(prev =>
      prev.map(project =>
        project.id === id ? { ...project, ...updates } : project
      )
    );
  };

  const getProject = (id: number) => {
    return projects.find(project => project.id === id);
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      addProject,
      updateProject,
      getProject,
      setProjects,
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
