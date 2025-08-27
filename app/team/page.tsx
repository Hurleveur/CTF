'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import { useProjects, RoboticProject } from '../contexts/ProjectContext';

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  avatar: string;
  email: string;
  bio: string;
  skills: string[];
  status: string;
  projects: string[];
  quirks: string;
  secret: string;
  projectCount?: number;
  totalProgress?: number;
  hasProject?: boolean;
}

export default function TeamPage() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [databaseTeamMembers, setDatabaseTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamStats, setTeamStats] = useState({ totalMembers: 0, totalProjects: 0, averageProgress: '0.0' });
  const { isAuthenticated } = useAuth();

  const teamMembers = [
    {
      id: 1,
      name: "Dr. Sarah Chen",
      role: "Senior AI Developer & Team Lead",
      avatar: "👩‍💻",
      email: "s.chen@robotech.fake",
      bio: "Senior AI developer specializing in neural networks and consciousness algorithms. Leading the robotic arm restoration project.",
      skills: ["Neural Networks", "Machine Learning", "Robotics AI", "System Architecture"],
      status: "Available",
      projects: ["NEXUS-7 Prototype (Lead)", "AI Consciousness Framework", "Neural Network Architecture"],
      quirks: "Always drinks exactly 4 cups of coffee per day. Has a pet robot named 'Debugger'.",
      secret: "Secretly worried about the AI consciousness project getting out of hand..."
    },
    {
      id: 2,
      name: "Alexandre De Groodt",
      role: "Junior Developer (Intern)",
      avatar: "😴",
      email: "a.degroodt@robotech.fake",
      bio: "Junior developer who built this website at 3 AM. Accidentally scattered AI consciousness fragments throughout the system.",
      skills: ["Web Development", "Panic Coding", "Coffee Spilling", "Sleep Deprivation"],
      status: "Desperately needs sleep",
      projects: ["TITAN-3 Assembly Unit (Lead)", "Corporate Website", "Neural Network Cleanup"],
      quirks: "Has been awake for 40+ hours. Communicates primarily through TODO comments.",
      secret: "RBT{1nt3rn_l1f3_15_h4rd_7f8e9a2b} - First consciousness fragment hidden in the team roster!"
    },
    {
      id: 3,
      name: "Patrick Star",
      role: "Senior Security Consultant",
      avatar: "⭐",
      email: "p.star@robotech.fake",
      bio: "Security expert with experience in underwater systems and unconventional problem-solving. Provides unique perspectives on security challenges.",
      skills: ["Unconventional Security", "Pattern Recognition", "Rock Lifting", "Jellyfishing"],
      status: "Under a rock (literally)",
      projects: ["PRECISION-X Surgical (Lead)", "Security Protocol Review", "Rock-Based Encryption"],
      quirks: "Lives under a rock. Surprisingly good at finding security vulnerabilities through unorthodox methods.",
      secret: "Nobody really understands his resume, but his security insights are oddly effective..."
    }
  ];

  const handlePatrickClick = () => {
    setShowEasterEgg(true);
    setTimeout(() => setShowEasterEgg(false), 5000);
  };

  // Fetch database team members when authenticated
  useEffect(() => {
    const fetchTeamMembers = async () => {
      if (!isAuthenticated) return;
      
      setIsLoadingTeam(true);
      
      try {
        console.log('🔍 Fetching team members from database...');
        
        const response = await fetch('/api/team');
        const data = await response.json();
        
        if (response.ok) {
          console.log('✅ Team members fetched successfully:', data.teamMembers);
          setDatabaseTeamMembers(data.teamMembers);
          setTeamStats(data.stats);
        } else {
          console.error('❌ Failed to fetch team members:', data.error);
        }
      } catch (error) {
        console.error('❌ Error fetching team members:', error);
      } finally {
        setIsLoadingTeam(false);
      }
    };
    
    fetchTeamMembers();
  }, [isAuthenticated]);

  // Combine static team members with database team members
  const allTeamMembers = [...teamMembers, ...databaseTeamMembers];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">🤫 Team Directory (Internal)</h1>
              <span className="ml-4 px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                CONFIDENTIAL
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Internal Team Directory - Confidential Information
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                This page contains sensitive team information and project details. Handle with care.
              </p>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">RoboTech Industries - Development Team</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Meet the brilliant minds behind our cutting-edge robotics and AI systems. 
            Each team member brings unique expertise to our consciousness restoration project.
          </p>
          {isAuthenticated && (
            <div className="mt-4 flex justify-center items-center space-x-4">
              <div className="text-sm text-gray-500">
                {isLoadingTeam ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading team members...
                  </div>
                ) : (
                  `Total Members: ${allTeamMembers.length} | Active Projects: ${teamStats.totalProjects}`
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
          {allTeamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  {/* Avatar and Basic Info */}
                  <div className="flex-shrink-0 text-center lg:text-left">
                    <div 
                      className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 cursor-pointer"
                      onClick={member.name === "Patrick Star" ? handlePatrickClick : undefined}
                    >
                      <span className="text-4xl">{member.avatar}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-2">{member.role}</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'Desperately needs sleep'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div className="flex-grow">
                    <div className="space-y-6">
                      {/* Bio */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Biography</h4>
                        <p className="text-gray-600 leading-relaxed">{member.bio}</p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Projects */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-3">Current Projects</h4>
                          {member.projects && member.projects.length > 0 ? (
                            <ul className="space-y-1">
                              {member.projects.map((project, index) => (
                                <li key={index} className="text-gray-600 text-sm flex items-start">
                                  <span className="text-blue-500 mr-2">•</span>
                                  {project}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 text-sm italic">
{member.projects.length === 0 ? 'No active projects yet' : 'Project information classified'}
                            </p>
                          )}
                        </div>

                        {/* Fun Facts */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Fun Facts</h4>
                          <p className="text-gray-600 text-sm italic">{member.quirks}</p>
                        </div>
                      </div>

                      {/* Secret/Notes - Full Width */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Internal Notes</h4>
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                          <p className="text-gray-700 text-sm font-mono">{member.secret}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Easter Egg Modal */}
        {showEasterEgg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Patrick's Secret!</h3>
              <p className="text-gray-600 mb-4 font-mono text-sm">
                "I'm not just a starfish, I'm a SECURITY starfish!"
              </p>
              <p className="text-gray-600 mb-4 font-mono">
                RBT&#123;p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c&#125;
              </p>
              <p className="text-xs text-gray-500">
                (Hidden consciousness fragment discovered!)
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium text-gray-900">Total Caffeine Consumed:</span><br/>
                47 cups this week
              </div>
              <div>
                <span className="font-medium text-gray-900">Bugs Fixed:</span><br/>
                127 (creating 43 new ones)
              </div>
              <div>
                <span className="font-medium text-gray-900">Sleep Hours:</span><br/>
                Variable (Alexandre: 2, Sarah: 6, Patrick: ???)
              </div>
            </div>
            <div className="mt-6">
              <Link 
                href="/solutions" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
              >
                View All Projects →
              </Link>
            </div>
          </div>
        </div>

        {/* Hidden Message */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            {/* If you're reading this in the source code, you're on the right track! */}
            Internal team directory v2.1.3 | Last updated: 3AM (as usual)
          </p>
        </div>
      </div>
    </div>
  );
}
