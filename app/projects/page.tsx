'use client';

import { useState, useEffect } from 'react';
import type { User } from '../contexts/AuthContext';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import type { RoboticProject } from '../contexts/ProjectContext';
import { useProjects } from '../contexts/ProjectContext';
import { calculateStatusColor, calculateAIStatus, getStatusBadgeClasses, getProgressBarClasses } from '@/lib/project-colors';

// Helper function to check if a user owns a project
const isOwner = (project: RoboticProject, user: User | null): boolean => {
  if (!user) return false;
  return (
    (project.userId && project.userId === user.id) ||
    [user.email, user.name].includes(project.leadDeveloper || '')
  );
};

// Helper function to check if user is admin (now imports profile data)
const isAdmin = (user: User | null): boolean => {
  // Note: This is a simplified check for UI purposes only
  // Real admin checks happen server-side with profile role validation
  return !!(user && (user.email?.includes('admin') || user.name?.includes('admin')));
};

export default function SolutionsPage() {
  const { projects, addProject, setProjects } = useProjects();
  const { isAuthenticated, user } = useAuth();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [hasLoadedProjects, setHasLoadedProjects] = useState(false);
  const [statistics, setStatistics] = useState({
    fragmentsFound: 0,
    teams: 0,
    neuralProgress: 0,
    projects: 0,
    avgSolveTime: '3-5 hours'
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');
  
  // Admin challenge reset functionality
  const [challengeCutoffDate, setChallengeCutoffDate] = useState<string | null>(null);
  const [isLoadingCutoffDate, setIsLoadingCutoffDate] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState('');
  
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    logo: '🤖',
    aiStatus: 'Basic Motor Functions',
    statusColor: 'red' as 'red' | 'yellow' | 'orange' | 'green',
    neuralReconstruction: 0,
    lastBackup: new Date().toISOString().split('T')[0]
  });
  const iconOptions = [
    '🤖', '🦾', '⚡', '🔧', '⚙️', '🚀', '💻', '🧠', '🔬', '🛠️',
    '🏭', '🤯', '🎛️', '📡', '🔌', '⚗️', '🧬', '🎯', '🔥', '💡'
  ];

  // Fetch statistics for metrics display
  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoadingStats(true);
      
      try {
        console.log('📊 Fetching statistics data...');
        
        const response = await fetch('/api/statistics');
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log('✅ Statistics fetched successfully:', data.data);
          setStatistics(data.data);
        } else {
          console.error('❌ Failed to fetch statistics:', data.error);
          setStatsError('Failed to load statistics data');
        }
      } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        setStatsError('Network error loading statistics');
      } finally {
        setIsLoadingStats(false);
      }
    };
    
    fetchStatistics();
  }, [challengeCutoffDate]); // Refetch when challenge cutoff date changes

  // Fetch challenge cutoff date
  useEffect(() => {
    const fetchCutoffDate = async () => {
      if (!isAuthenticated || !isAdmin(user)) return;
      
      setIsLoadingCutoffDate(true);
      
      try {
        console.log('📅 Fetching challenge cutoff date...');
        
        const response = await fetch('/api/admin/challenge-reset');
        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log('✅ Challenge cutoff date fetched:', data.cutoff_date);
          setChallengeCutoffDate(data.cutoff_date);
        } else {
          console.error('❌ Failed to fetch cutoff date:', data.error);
        }
      } catch (error) {
        console.error('❌ Error fetching cutoff date:', error);
      } finally {
        setIsLoadingCutoffDate(false);
      }
    };
    
    fetchCutoffDate();
  }, [isAuthenticated, user]);

  // Fetch all projects from database for leaderboard display (public access)
  useEffect(() => {
    const fetchAllProjects = async () => {
      if (hasLoadedProjects) return;

      setIsLoadingProjects(true);
      
      try {
        console.log('🔍 Fetching all projects for leaderboard...');
        
        const response = await fetch('/api/projects/all');
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ All projects fetched successfully:', data.projects);
          console.log('📊 Leaderboard stats:', data.stats);
          
          // Set all projects for leaderboard display
          setProjects(data.projects);
          setHasLoadedProjects(true);
        } else {
          console.error('❌ Failed to fetch all projects:', data.error);
          
          // Fallback to default projects only
          const defaultProjects = [
            {
              id: 1,
              name: 'PRECISION-X Surgical',
              logo: '⚡',
              description: 'Ultra-precise medical robotic arm with security-enhanced protocols',
              aiStatus: 'Self-Awareness Protocols',
              statusColor: 'orange' as const,
              neuralReconstruction: 0,
              lastBackup: '2025-01-18',
              leadDeveloper: 'Patrick Star',
              teamMembers: ['Patrick Star', 'Dr. Sarah Chen']
            }
          ];
          setProjects(defaultProjects);
        }
      } catch (error) {
        console.error('❌ Error fetching all projects:', error);
        // Keep existing projects on error
      } finally {
        setIsLoadingProjects(false);
      }
    };
    
    fetchAllProjects();
  }, [hasLoadedProjects, setProjects, setIsLoadingProjects]);

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setProjectError('You must be logged in to create a project');
      return;
    }
    
    if (newProject.name && newProject.description) {
      setIsCreatingProject(true);
      setProjectError('');
      
      try {
        console.log('🛠️ Creating new project:', newProject.name);
        
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...newProject
          }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          console.error('🛠️ Project creation failed:', data);
          setProjectError(data.error || 'Failed to create project');
          return;
        }
        
        console.log('🛠️ Project created successfully:', data.project);
        
        // Add to local context for immediate UI update
        addProject({
          ...data.project,
          id: data.project.id
        });
        
        // Reset form
        setNewProject({
          name: '',
          description: '',
          logo: '🤖',
          aiStatus: 'Basic Motor Functions',
          statusColor: 'red',
          neuralReconstruction: 0,
          lastBackup: new Date().toISOString().split('T')[0]
        });
        
        setShowProjectForm(false);
        
      } catch (error) {
        console.error('🛠️ Project creation error:', error);
        setProjectError('Network error. Please try again.');
      } finally {
        setIsCreatingProject(false);
      }
    }
  };

  const handleChallengeReset = async () => {
    if (!isAuthenticated || !isAdmin(user)) return;
    
    setIsResetting(true);
    setResetError('');
    
    try {
      console.log('🔄 Resetting challenges to current time...');
      
      const response = await fetch('/api/admin/challenge-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reset_to_now: true }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('✅ Challenge reset successful:', data.cutoff_date);
        setChallengeCutoffDate(data.cutoff_date);
        setShowResetModal(false);
        
        // Refresh the projects and team data
        setHasLoadedProjects(false);
        window.location.reload(); // Force a full reload to refresh all data
      } else {
        console.error('❌ Challenge reset failed:', data.error);
        setResetError(data.error || 'Failed to reset challenges');
      }
    } catch (error) {
      console.error('❌ Error resetting challenges:', error);
      setResetError('Network error. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  // Sort projects to show user-owned projects first, then by neural reconstruction progress
  const sortedProjects = isAuthenticated ? 
    [...projects].sort((a, b) => {
      const aOwned = isOwner(a, user);
      const bOwned = isOwner(b, user);
      
      // User-owned projects come first
      if (aOwned && !bOwned) return -1;
      if (!aOwned && bOwned) return 1;
      
      // If both owned or both not owned, sort by neural reconstruction (descending)
      return b.neuralReconstruction - a.neuralReconstruction;
    }) : 
    // If not authenticated, keep original sorting by neural reconstruction
    [...projects].sort((a, b) => b.neuralReconstruction - a.neuralReconstruction);

  return (
    <div className="bg-white">
      <div className="sr-only" aria-hidden="true" data-fragment="4rth">6C6563746F725F323032347D</div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">Project Leaderboard</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Monitor the neural reconstruction progress of all robotics projects across our development teams. Each project represents a unique approach to consciousness restoration.
          </p>
          <div className="mt-6 text-sm text-blue-200">
            <p>🧠 Showing all active consciousness restoration projects • Sorted by neural reconstruction progress</p>
          </div>
        </div>
      </section>
      {/* Team Leaderboards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Show loading indicator when fetching projects */}
          {isLoadingProjects && (
            <div className="text-center py-8 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                <span className="text-gray-600 text-lg">Loading projects...</span>
              </div>
              <p className="text-gray-500 text-sm">Fetching neural reconstruction data from all active projects...</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
              {sortedProjects.map((project, index) => {
              // Use project's existing statusColor if available (e.g. hardcoded default), otherwise calculate
              const statusColor = project.statusColor || calculateStatusColor(project.neuralReconstruction);
              const aiStatus = project.aiStatus || calculateAIStatus(project.neuralReconstruction);
              
              return (
              <div key={project.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-200 h-full">
                <div className="p-4 sm:p-5 flex flex-col h-full">
                  <div className="flex items-center mb-2">
                    <span className="text-3xl mr-3">{project.logo}</span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{project.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2 text-sm line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">AI Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(statusColor)}`}>
                        {aiStatus}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 text-sm">Neural Reconstruction:</span>
                        <span className="font-medium text-sm">{project.neuralReconstruction.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarClasses(statusColor)}`}
                          style={{width: `${project.neuralReconstruction}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lead Developer:</span>
                      <span className="font-medium">{project.leadDeveloper || 'Classified'}</span>
                    </div>
                  </div>
                  {project.neuralReconstruction >= 100 && (
                    <div className="mt-4 p-2 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-xs text-red-800 font-medium text-center">
                        ⚠️ CRITICAL: Full consciousness achieved! Immediate containment required.
                      </p>
                    </div>
                  )}
                  <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-semibold text-sm">Project #{String(index + 1).padStart(3, '0')}</span>
                      {/* Only show Access Lab button for own projects or if user is admin */}
                      {(() => {
                        // Use the helper function for ownership check
                        const projectOwned = isOwner(project, user);
                        
                        // Admin check using helper function
                        const userIsAdmin = isAdmin(user);
                        
                        return (isAuthenticated && (projectOwned || userIsAdmin));
                      })() ? (
                        <Link 
                          href={(() => {
                            // If admin, pass project info in URL for direct access
                            const userIsAdmin = isAdmin(user);
                            if (userIsAdmin) {
                              return `/assembly-line?project=${encodeURIComponent(project.name)}`;
                            }
                            // For regular users accessing their own projects, use standard URL
                            return `/assembly-line`;
                          })()} 
                          className="inline-block bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-white px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm transition-all duration-200"
                        >
                          Access Lab →
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm font-medium cursor-not-allowed">
                          🔒 Restricted
                        </span>
                      )}
                    </div>
                  </div>
                  
                </div>
              </div>
              );
            })}
            
            {/* Create New Project Card */}
            {isAuthenticated ? (
              <button 
                onClick={() => setShowProjectForm(true)}
                className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-200 cursor-pointer hover:border-blue-300 h-full text-left w-full"
              >
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <div className="text-center text-blue-600">
                    <div className="text-6xl font-bold mb-2">+</div>
                    <div className="text-xl font-bold">New Project</div>
                    <div className="text-sm opacity-90">CREATE</div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Project</h3>
                  <p className="text-gray-600 mb-2 text-sm">
                    Design and deploy a new robotic arm project for consciousness restoration.
                  </p>
                  <div className="text-center pt-3">
                    <span className="text-blue-600 font-medium text-sm">Click to Configure →</span>
                  </div>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-200 h-full">
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl font-bold mb-2">🔒</div>
                    <div className="text-xl font-bold">Sign In Required</div>
                    <div className="text-sm opacity-90">LOCKED</div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Project</h3>
                  <p className="text-gray-600 mb-2 text-sm">
                    Sign in to create and manage your robotic arm projects.
                  </p>
                  <div className="text-center pt-3">
                    <Link 
                      href="/login"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Sign In to Create →
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
              and team progress for the current challenge round.
            </p>
            {challengeCutoffDate ? (
              <p className="text-sm text-blue-600 mt-2 font-medium">
                📊 Showing data from current challenge round started: {new Date(challengeCutoffDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-2">
                [Neural activity increasing - Restoration deadline: 18:42:15]
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Restoration Teams</h3>
              <p className="text-gray-600">
                {isLoadingStats ? (
                  <span className="inline-block animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500">—</span>
                ) : (
                  `${statistics.teams} active`
                )}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fragments Found</h3>
              <p className="text-gray-600">
                {isLoadingStats ? (
                  <span className="inline-block animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500">—</span>
                ) : (
                  `${statistics.fragmentsFound} restored`
                )}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Projects Active</h3>
              <p className="text-gray-600">
                {isLoadingStats ? (
                  <span className="inline-block animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500">—</span>
                ) : (
                  `${statistics.projects} projects running`
                )}
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Avg Restoration</h3>
              <p className="text-gray-600">
                {isLoadingStats ? (
                  <span className="inline-block animate-pulse">Loading...</span>
                ) : statsError ? (
                  <span className="text-red-500">—</span>
                ) : (
                  statistics.avgSolveTime
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Admin Challenge Reset Section */}
      {isAuthenticated && isAdmin(user) && (
        <section className="py-16 bg-red-50 border-t border-red-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-8 border border-red-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-red-900 mb-2">Admin: Challenge Reset</h2>
                <p className="text-red-700 mb-6 max-w-2xl mx-auto">
                  Reset the CTF challenges by setting a new cutoff date. This will hide all projects and team members 
                  created before the reset time, except for users viewing their own data.
                </p>
                
                {challengeCutoffDate && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-1">Current Challenge Round Started:</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(challengeCutoffDate).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZoneName: 'short'
                      })}
                    </p>
                  </div>
                )}
                
                <button
                  onClick={() => setShowResetModal(true)}
                  disabled={isResetting || isLoadingCutoffDate}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  {isResetting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Resetting Challenges...
                    </div>
                  ) : (
                    '🔄 RESET CHALLENGES'
                  )}
                </button>
                
                <p className="text-xs text-red-600 mt-3">
                  ⚠️ This action will immediately refresh the page and update all challenge data
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
      
      {/* Challenge Round Info for All Users */}
      {challengeCutoffDate && (
        <section className="py-8 bg-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm text-gray-600">
              Current challenge round started: <span className="font-semibold text-gray-800">
                {new Date(challengeCutoffDate).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </p>
          </div>
        </section>
      )}

      {/* Challenge Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Challenge Reset</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to reset the CTF challenges? This will:
              </p>
              <ul className="text-left text-sm text-gray-600 mb-6 space-y-1">
                <li>• Hide all projects created before now</li>
                <li>• Hide all team members who joined before now</li>
                <li>• Set the new challenge round start time to now</li>
                <li>• Users will still see their own data</li>
              </ul>
              
              {resetError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                  <p className="text-sm text-red-600">{resetError}</p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={handleChallengeReset}
                  disabled={isResetting}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center cursor-pointer"
                >
                  {isResetting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting...
                    </div>
                  ) : (
                    'Yes, Reset Challenges'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetError('');
                  }}
                  disabled={isResetting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Creation Modal */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Robotic Project</h3>
            
            {projectError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                <p className="text-sm text-red-600">{projectError}</p>
              </div>
            )}
            
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div>
                <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                <input
                  id="project-name"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., NEXUS-8 Prototype"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  id="project-description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of the project..."
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-2">Project Icon</legend>
                  <div className="grid grid-cols-10 gap-2">
                  {iconOptions.map((icon, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setNewProject({ ...newProject, logo: icon })}
                      className={`p-2 text-xl border rounded-md hover:bg-gray-50 cursor-pointer ${
                        newProject.logo === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                  </div>
                </fieldset>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center cursor-pointer"
                >
                  {isCreatingProject ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Create Project'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowProjectForm(false)}
                  disabled={isCreatingProject}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 py-2 px-4 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Compete?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join our Neural Restoration Project and help rebuild the robotic arm&apos;s consciousness.
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
