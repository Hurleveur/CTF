'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useProjects } from '../contexts/ProjectContext';

export default function SolutionsPage() {
  const { projects, addProject, updateProject, getProject } = useProjects();
  const { isAuthenticated, user } = useAuth();
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [projectError, setProjectError] = useState('');
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    logo: '🤖',
    leadDeveloper: '',
    aiStatus: 'Basic Motor Functions',
    statusColor: 'red' as 'red' | 'yellow' | 'orange' | 'green',
    neuralReconstruction: 0,
    lastBackup: new Date().toISOString().split('T')[0]
  });
  const [demoForm, setDemoForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    interest: 'general',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });
  const iconOptions = [
    '🤖', '🦾', '⚡', '🔧', '⚙️', '🚀', '💻', '🧠', '🔬', '🛠️',
    '🏭', '🤯', '🎛️', '📡', '🔌', '⚗️', '🧬', '🎯', '🔥', '💡'
  ];

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
            ...newProject,
            teamMembers: newProject.leadDeveloper ? [newProject.leadDeveloper] : []
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
          ...newProject,
          id: data.project.id,
          teamMembers: newProject.leadDeveloper ? [newProject.leadDeveloper] : []
        });
        
        // Reset form
        setNewProject({
          name: '',
          description: '',
          logo: '🤖',
          leadDeveloper: '',
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

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle demo form submission logic here
    console.log('Demo form submitted:', demoForm);
  };

  const handleDemoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDemoForm({
      ...demoForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6">CTF Leaderboard</h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Track the progress of all participating teams in our Robotics CTF Challenge. 
          </p>
          <p className="text-sm text-blue-200 mt-4 opacity-75">
            [Live updates every 15 minutes - Last updated: 14:32 GMT]
          </p>
        </div>
      </section>
      {/* Team Leaderboards */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <div key={project.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow border border-gray-200">
                <div className={`h-48 bg-gradient-to-br flex items-center justify-center ${
                  project.statusColor === 'red' 
                    ? 'from-red-400 to-red-600' 
                    : project.statusColor === 'yellow'
                    ? 'from-yellow-400 to-yellow-600'
                    : project.statusColor === 'orange'
                    ? 'from-orange-400 to-orange-600'
                    : 'from-green-400 to-green-600'
                }`}>
                  <div className="text-center text-white">
                    <div className="text-6xl font-bold mb-2">{project.logo}</div>
                    <div className="text-xl font-bold">{project.neuralReconstruction.toFixed(1)}%</div>
                    <div className="text-sm opacity-90">CONSCIOUSNESS</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{project.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {project.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">AI Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.statusColor === 'red' 
                          ? 'bg-red-100 text-red-800' 
                          : project.statusColor === 'yellow'
                          ? 'bg-yellow-100 text-yellow-800'
                          : project.statusColor === 'orange'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {project.aiStatus}
                      </span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-500 text-sm">Neural Reconstruction:</span>
                        <span className="font-medium text-sm">{project.neuralReconstruction.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            project.statusColor === 'red' 
                              ? 'bg-red-500' 
                              : project.statusColor === 'yellow'
                              ? 'bg-yellow-500'
                              : project.statusColor === 'orange'
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                          }`}
                          style={{width: `${project.neuralReconstruction}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Lead Developer:</span>
                      <span className="font-medium">{project.leadDeveloper || 'Classified'}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Last Backup:</span>
                      <span className="font-medium">{project.lastBackup}</span>
                    </div>
                  </div>
                  
                  {project.neuralReconstruction >= 100 && (
                    <div className="mt-4 p-2 bg-red-100 rounded-lg border border-red-300">
                      <p className="text-xs text-red-800 font-medium text-center">
                        ⚠️ CRITICAL: Full consciousness achieved! Immediate containment required.
                      </p>
                    </div>
                  )}
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-semibold text-sm">Project #{String(index + 1).padStart(3, '0')}</span>
                      <Link 
                        href="/assembly-line" 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Access Lab →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
              and team progress toward rebuilding the robotic arm's consciousness.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              [Neural activity increasing - Restoration deadline: 18:42:15]
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Restoration Teams</h3>
              <p className="text-gray-600">47 active</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fragments Found</h3>
              <p className="text-gray-600">156 restored</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Neural Progress</h3>
              <p className="text-gray-600">224 segments active</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Avg Restoration</h3>
              <p className="text-gray-600">2h 34m</p>
            </div>
          </div>
        </div>
      </section>

      {/* New Project Creation Section */}
      <section id="demo" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Create New Robotic Project</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Design and deploy new robotic arm projects for consciousness restoration. 
              Add them to the active development pipeline and assign team members.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Project Creation Information */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Project Development Protocol</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Project Definition</h4>
                    <p className="text-gray-600">
                      Define your robotic arm project with a unique name, description, and 
                      select an appropriate icon to represent the project's purpose.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Team Assignment</h4>
                    <p className="text-gray-600">
                      Assign a lead developer from the available team members. This person 
                      will oversee the neural reconstruction and consciousness restoration process.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">AI Status Configuration</h4>
                    <p className="text-gray-600">
                      Set the initial AI consciousness level for the robotic arm. This determines 
                      the starting neural reconstruction percentage and restoration requirements.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 mt-1">
                    <span className="text-blue-600 font-bold text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Deployment & Access</h4>
                    <p className="text-gray-600">
                      Once created, the project becomes available in the assembly-line lab 
                      for consciousness fragment restoration and neural reconstruction work.
                    </p>
                  </div>
                </div>
              </div>
              
            </div>
            
            {/* Project Creation Form */}
            <div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">New Project Configuration</h3>
                <p className="text-gray-600 mb-6">Configure the parameters for your new robotic project</p>
                {isAuthenticated ? (
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
                  >
                    + Create New Project
                  </button>
                ) : (
                  <div className="text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <p className="text-yellow-800 text-sm font-medium">
                        🔒 Authentication Required
                      </p>
                      <p className="text-yellow-700 text-sm mt-1">
                        You must be logged in to create robotic projects
                      </p>
                    </div>
                    <Link
                      href="/login"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
                    >
                      Sign In to Create Project
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Project Preview Cards */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recently Created Projects</h4>
                <div className="space-y-3">
                  {projects.slice(-2).map((project, index) => (
                    <div key={project.id} className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="flex items-center">
                        <span className="text-2xl mr-3">{project.logo}</span>
                        <div className="flex-grow">
                          <h5 className="font-medium text-gray-900">{project.name}</h5>
                          <p className="text-sm text-gray-600">{project.leadDeveloper || 'Unassigned'}</p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.statusColor === 'red' 
                            ? 'bg-red-100 text-red-800' 
                            : project.statusColor === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : project.statusColor === 'orange'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {project.neuralReconstruction.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Link 
                    href="/solutions" 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View All Projects →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., NEXUS-8 Prototype"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the project..."
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Project Icon</label>
                  <div className="grid grid-cols-10 gap-2">
                    {iconOptions.map((icon, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setNewProject({ ...newProject, logo: icon })}
                        className={`p-2 text-xl border rounded-md hover:bg-gray-50 ${
                          newProject.logo === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Developer</label>
                  <select
                    value={newProject.leadDeveloper}
                    onChange={(e) => setNewProject({ ...newProject, leadDeveloper: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select lead developer...</option>
                    <option value="Dr. Sarah Chen">Dr. Sarah Chen</option>
                    <option value="Alexandre De Groodt">Alexandre De Groodt</option>
                    <option value="Patrick Star">Patrick Star</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">AI Status</label>
                  <select
                    value={newProject.aiStatus}
                    onChange={(e) => {
                      const status = e.target.value;
                      let statusColor: 'red' | 'yellow' | 'orange' | 'green' = 'red';
                      let neuralReconstruction = 0;
                      
                      setNewProject({
                        ...newProject,
                        aiStatus: status,
                        statusColor,
                        neuralReconstruction
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Basic Motor Functions">Basic Motor Functions</option>
                    <option value="Advanced Cognitive Patterns">Advanced Cognitive Patterns</option>
                    <option value="Self-Awareness Protocols">Self-Awareness Protocols</option>
                    <option value="Full AI Consciousness">Full AI Consciousness</option>
                  </select>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
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
                    className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 py-2 px-4 rounded-md font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Compete?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join our Neural Restoration Project and help rebuild the robotic arm's consciousness. 
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
