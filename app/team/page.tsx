'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import CTFRoleBadge from '../components/CTFRoleBadge';

interface TeamMember {
  id: string | number;
  name: string;
  role: string;
  ctfRole?: string; // New prominent CTF role with icon
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
  linkedin?: string;
}

export default function TeamPage() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [databaseTeamMembers, setDatabaseTeamMembers] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(false);
  const [teamStats, setTeamStats] = useState({ totalMembers: 0, totalProjects: 0, averageProgress: '0.0' });
  const { isAuthenticated, user } = useAuth();
  
  // Check if current user is Alex
  const isAlex = user?.email === 'alex@robo.tech';

  const teamMembers = [
    {
      id: 1,
      name: "Alexandre De Groodt",
      role: "CTF Lead (Intern)",
      ctfRole: "🏆 CTF Challenge Architect",
      avatar: "😴",
      email: "alex@robo.tech",
      bio: "Sleep-deprived intern doing his best to manage this chaotic team of fellow interns. Built this website at 3 AM and somehow became the 'responsible' one for this project, but he's not sure how. He just vibed. For weeks.",
      skills: ["Web Development", "Panic Management", "Coffee Brewing", "Herding Cats"],
      status: "Managing chaos",
      projects: ["Intern Coordination", "Sanity Preservation", "AI overlord"],
      quirks: "Always has a sheet of paper with him, covered in TODO lists. Claims he doesn't need energy drinks and runs on hopes and dreams.",
      secret: "First consciousness fragment hidden in the team roster! Also secretly proud of the work done by AI whilst he's eating or working on his other jobs.",
      linkedin: "https://www.linkedin.com/in/alexandre-de-groodt-8b804b308"
    },
    {
      id: 2,
      name: "Achraf",
      role: "Intern (HackBoxer)",
      ctfRole: "🔓 Chief Exploitation Officer",
      avatar: "🧸",
      email: "Achraf@robotech.fake",
      bio: "Experienced with HackTheBox and online web hacking challenges. Don't let the teddy bear appearance fool you - can break into systems faster than you can say 'buffer overflow'.",
      skills: ["Web Exploitation", "CTF Challenges", "Penetration Testing", "Being Adorable"],
      status: "Currently pwning",
      projects: ["Security Assessment", "Vulnerability Research", "CTF Training Program"],
      quirks: "Has a collection of rubber ducks for debugging and a shrine to HackTheBox achievements. Surprisingly cuddly for a hacker.",
      secret: "Don't judge a hacker by their emoji. He's busy doing the hardest challenges yet for the CTF, so hard you can't even find them!",
      linkedin: "https://www.linkedin.com/in/mohammed-achraf-grari-06631232b"
    },
    {
      id: 3,
      name: "Léandre",
      role: "Shadow Ops Intern",
      ctfRole: "🥷 Shadow Ops Commander",
      avatar: "🥷",
      email: "leandre@robotech.fake",
      bio: "The mysterious Mr. Robot type who appears out of nowhere with perfect solutions. Speaks in cryptic one-liners and somehow always knows exactly what's wrong with the system.",
      skills: ["Social Engineering", "System Infiltration", "Cryptic Communication", "Hood Wearing"],
      status: "In the shadows",
      projects: ["Deep System Analysis", "Anonymous Data Recovery", "Digital Forensics"],
      quirks: "Always wears a hoodie, even in video calls. Communicates through encrypted messages and philosophical quotes about society.",
      secret: "'We are all just code in someone else's simulation...' - The truth is hidden in plain sight.",
      linkedin: "https://www.linkedin.com/in/leandre-vilain"
    },
    {
      id: 4,
      name: "Cédric Sounard",
      role: "Sales & Code Vibes Specialist",
      ctfRole: "💼 North Star Agi – Business Operations",
      avatar: "🕺",
      email: "cedric.sounard@robotech.fake",
      bio: "The charismatic sales guy who can still talk code++. Never stops, never sleeps, and always eats Indian food.",
      skills: ["Client Relations", "Code Vibing", "Technical Sales", "Multitasking Magic"],
      status: "Vibing with clients",
      projects: ["Client Onboarding", "Technical Demos", "Sales Pipeline", "Code Reviews (somehow)"],
      quirks: "Speaks fluent business and developer. Often found explaining APIs to clients while fixing CSS on the side. Uses 'synergy' unironically.",
      secret: "Secretly writes better documentation than the actual developers. The clients love him and the devs respect him - rare combo!"
    },
    {
      id: 5,
      name: "Filip",
      role: "Entrepreneur & AI Whisperer",
      ctfRole: "🧠 North Star Agi – AI Strategy Lead",
      avatar: "🧠",
      email: "filip@robotech.fake",
      bio: "The mastermind entrepreneur who somehow keeps this chaotic intern-run company afloat. AI expert who can explain neural networks to investors and fix the discord bot in the same meeting.",
      skills: ["Business Strategy", "AI Architecture", "Crisis Management", "Investor Relations"],
      status: "Holding it all together",
      projects: ["Company Vision", "AI Research Direction", "Investor Relations", "Emergency Debugging"],
      quirks: "Has three phones, five monitors, and somehow always knows exactly what's broken before anyone reports it. Drinks espresso like water.",
      secret: "The real MVP keeping the lights on. Without Filip, this would just be five interns arguing about semicolons in a garage."
    },
    {
      id: 6,
      name: "Oleksandr",
      role: "The Expert",
      ctfRole: "🤗 North Star Agi – People & AI Ethics",
      avatar: "🤗",
      email: "oleksandr@robotech.fake",
      bio: "The ultimate people person who naturally became HR. Combines next-level emotional intelligence with being genuinely the nicest human alive. When not busy making sure everyone feels valued and comfortable, he's casually being the absolute best at AI - like, scary good at it.",
      skills: ["Emotional Intelligence", "AI Mastery", "Brainstorming", "Being Genuinely Nice"],
      status: "Spreading good vibes & AI wisdom",
      projects: ["Team Happiness Optimization", "AI Ethics & Empathy", "Workplace Zen Garden"],
      quirks: "Somehow does performance reviews as a chat with friends. Has an uncanny ability to solve complex AI problems while simultaneously making everyone feel heard.",
      secret: "Secretly the team's AI whisperer - can debug neural networks by understanding their feelings. Also keeps a spreadsheet of everyone's favorite comfort snacks and remembers all their birthdays."
    },
    {
      id: 7,
      name: "Laksiya",
      role: "Dynamic Robotics Engineer",
      ctfRole: "🤖 North Star Agi – Robotics Engineer",
      avatar: "🤖",
      email: "laksiya@robotech.fake",
      bio: "A dynamic force of nature who brings infectious laughter to every standup meeting. When she's not busy writing robotics code to automate away everyone's jobs (in the most delightful way possible), you'll find her out running marathons or eating.",
      skills: ["Robotics Programming", "Marathon Running", "Infectious Laughter", "Job Automation"],
      status: "Building tomorrow's unemployment",
      projects: ["JobBot Supreme", "Automated Everything", "Happy Unemployment Initiative"],
      quirks: "Laughs while coding robots that will replace us all. Goes for 10-mile runs to celebrate each successful automation.",
      secret: "Don't worry, the robots she builds will be too busy laughing at her jokes to actually take over. Plus, she's programming them to leave snacks for their human replacements!"
    },
    {
      id: 8,
      name: "Patrick Star",
      role: "Senior Security Consultant",
      ctfRole: "⭐ North Star Agi – Security Consultant",
      avatar: "⭐",
      email: "p.star@robotech.fake",
      bio: "Security expert with experience in underwater systems and unconventional problem-solving. Provides unique perspectives on security challenges.",
      skills: ["Unconventional Security", "Pattern Recognition", "Rock Lifting", "Jellyfishing"],
      status: "Under a rock (literally)",
      projects: ["PRECISION-X Surgical (Lead)", "Security Protocol Review", "Rock-Based Encryption"],
      quirks: "Lives under a rock. Surprisingly good at finding security vulnerabilities through unorthodox methods.",
      secret: "Nobody really understands his resume, but his security insights are oddly effective..."
    },
    {
      id: 9,
      name: "Teodor Trotea",
      role: "Robotic Arm Choreographer",
      ctfRole: "🤖 North Star Agi – Robotics & AI Engineer",
      avatar: "🕺",
      email: "teodor@robotech.fake",
      bio: "The wizard who makes robotic arms dance with grace and precision. He claims his main job is developing cutting-edge AI systems in his day job. Saved Alex's sanity by providing Claude Code access at the critical moment - a true hero of the CTF development saga.",
      skills: ["Robotic Arm Programming", "AI Developer", "Movement Algorithms", "Emergency Claude Code Support"],
      status: "Teaching robots to dance",
      projects: ["Robotic Arm Dance Engine", "AI Movement Patterns", "Neural Network Choreography", "Claude Code Integration"],
      quirks: "Can make any robotic arm perform interpretive dance. Has an uncanny ability to appear with exactly the tool you need at exactly the right moment. Speaks fluent robot.",
      secret: "The robotic arms aren't just dancing - they're communicating in a secret movement language he invented. The CTF was broken and he gave critical code access.",
      linkedin: "https://www.linkedin.com/in/teodor-trotea-138b072b1/"
    }
  ];

  const handlePatrickClick = () => {
    setShowEasterEgg(true);
    setTimeout(() => setShowEasterEgg(false), 5000);
  };

  // Function to clean project names by removing status indicators
  const cleanProjectName = (projectName: string) => {
    // Remove patterns like "- X.X%" or "(Basic Motor Functions)" or similar status indicators
    return projectName
      .replace(/\s*-\s*\d+\.?\d*%?\s*$/, '') // Remove "- 0.0%" or similar at the end
      .replace(/\s*\([^)]*Motor Functions[^)]*\)\s*/, '') // Remove "(Basic Motor Functions)" or similar
      .replace(/\s*\([^)]*Status[^)]*\)\s*/, '') // Remove "(Status: ...)" or similar
      .replace(/\s*\([^)]*Progress[^)]*\)\s*/, '') // Remove "(Progress: ...)" or similar
      .trim();
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
  // Note: Static team members have specific fake emails for CTF challenges (like alex@robo.tech)
  // Database team members (real participants) get privacy-safe fake emails via API
  // Special handling for Alex: don't show database profile as it's redundant with static team
  let allTeamMembers;
  
  if (isAlex) {
    // For Alex, only show static team members (no duplicate profile from database is better)
    allTeamMembers = teamMembers;
  } else {
    // For other users, combine static and database team members
    allTeamMembers = [...teamMembers, ...databaseTeamMembers];
    
    // Sort to show logged-in user's profile first if they have one
    allTeamMembers = allTeamMembers.sort((a, b) => {
      if (isAuthenticated && databaseTeamMembers.length > 0) {
        const userProfile = databaseTeamMembers[0]; // Assuming first db member is user's profile
        if (a.id === userProfile.id) return -1; // User's profile goes first
        if (b.id === userProfile.id) return 1;  // Other profiles go after
      }
      return 0; // Keep original order for others
    });
  }
  
  const sortedTeamMembers = allTeamMembers;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">🤫 Team Directory (Internal)</h1>
              <span className="ml-4 px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                CONFIDENTIAL
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Alex's Access Banner - Subtle Integration */}
        {isAlex && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-500 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-blue-400 dark:text-blue-300 text-xl">💼</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Internal Staff Access - Welcome back, Alex
                </h3>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>Session authenticated for <span className="font-mono text-xs bg-blue-100 dark:bg-blue-800/50 px-1.5 py-0.5 rounded">alex@robo.tech</span></p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Access code: <span className="font-mono bg-blue-100 dark:bg-blue-800/50 px-1 py-0.5 rounded text-blue-800 dark:text-blue-200">RBT{'{'}sleepy_intern_logged_in{'}'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-yellow-400 dark:text-yellow-300 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Internal Team Directory - Confidential Information
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                This page contains sensitive team information and project details. Handle with care.
              </p>
            </div>
          </div>
        </div>

        {/* Page Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">RoboTech Industries - Development Team</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Meet the brilliant minds behind our cutting-edge robotics and AI systems. 
            Each team member brings unique expertise to our consciousness restoration project.
          </p>
          {isAuthenticated && (
            <div className="mt-4 flex justify-center items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isLoadingTeam ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Loading team members...
                  </div>
                ) : (
                  `Total Members: ${sortedTeamMembers.length} | Active Projects: ${teamStats.totalProjects}`
                )}
              </div>
            </div>
          )}
        </div>

        {/* Team Members Grid */}
        <div className="grid gap-8 sm:grid-cols-1 lg:grid-cols-2">
          {sortedTeamMembers.map((member) => (
            <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden group hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-300 hover:border-blue-300 dark:hover:border-blue-500 border border-transparent">
              <div className="p-8 group-hover:bg-gray-50 dark:group-hover:bg-gray-700 transition-colors duration-300">
                {/* CTF Role Badge - Prominent at top */}
                <div className="mb-6 text-center lg:text-left">
                  <CTFRoleBadge role={member.ctfRole || '🎯 CTF Participant'} />
                </div>
                
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  {/* Avatar and Basic Info */}
                  <div className="flex-shrink-0 text-center lg:text-left">
                    {member.name === "Patrick Star" ? (
                      <button 
                        className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 cursor-pointer group-hover:scale-110 group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-700 dark:group-hover:to-blue-600 transition-all duration-300"
                        onClick={handlePatrickClick}
                      >
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{member.avatar}</span>
                      </button>
                    ) : (
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-800 dark:to-blue-700 rounded-full flex items-center justify-center mx-auto lg:mx-0 mb-4 group-hover:scale-110 group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-700 dark:group-hover:to-blue-600 transition-all duration-300">
                        <span className="text-4xl group-hover:scale-110 transition-transform duration-300">{member.avatar}</span>
                      </div>
                    )}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                      {member.linkedin ? (
                        <a 
                          href={member.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center justify-center lg:justify-start gap-2 hover:underline"
                        >
                          {member.name}
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                          </svg>
                        </a>
                      ) : (
                        member.name
                      )}
                    </h3>
                    <p className="text-blue-600 dark:text-blue-400 font-medium mb-2 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-300">{member.role}</p>
                    <div className={`mt-3 px-3 py-1 rounded-full text-xs font-medium ${
                      member.status === 'Available' 
                        ? 'bg-green-100 text-green-800' 
                        : member.status === 'Desperately needs sleep'
                        ? 'bg-red-100 text-red-800'
                        : member.status === 'Managing chaos'
                        ? 'bg-orange-100 text-orange-800'
                        : member.status === 'Currently pwning'
                        ? 'bg-purple-100 text-purple-800'
                        : member.status === 'In the shadows'
                        ? 'bg-gray-900 text-gray-100'
                        : member.status === 'Spreading positivity'
                        ? 'bg-pink-100 text-pink-800'
                        : member.status === 'Building tomorrow\'s unemployment'
                        ? 'bg-red-100 text-red-800'
                        : member.status === 'Spreading good vibes & AI wisdom'
                        ? 'bg-green-100 text-green-800'
                        : member.status === 'Vibing with clients'
                        ? 'bg-blue-100 text-blue-800'
                        : member.status === 'Holding it all together'
                        ? 'bg-yellow-100 text-yellow-800'
                        : member.status === 'Teaching robots to dance'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status}
                    </div>
                    
                    {/* Skills */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Skills</h4>
                      {member.skills && member.skills.length > 0 ? (
                        <div className="space-y-2">
                          {Array.from({ length: Math.ceil(member.skills.length / 2) }, (_, rowIndex) => (
                            <div key={rowIndex} className="flex gap-2">
                              {member.skills.slice(rowIndex * 2, rowIndex * 2 + 2).map((skill, index) => (
                                <span 
                                  key={index}
                                  className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs px-2 py-1 rounded-full font-medium group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors duration-300"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-xs italic">Skills classified</p>
                      )}
                    </div>
                    
                    {/* Current Projects */}
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Current Projects</h4>
                      {/* Show loading state when projects are being loaded */}
                      {isLoadingTeam ? (
                        <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs italic">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400 mr-2"></div>
                          Loading projects...
                        </div>
                      ) : member.projects && member.projects.length > 0 ? (
                        <ul className="space-y-1">
                          {member.projects.map((project, index) => (
                            <li key={index} className="text-gray-600 dark:text-gray-300 text-xs flex items-start">
                              <span className="text-blue-500 dark:text-blue-400 mr-2">•</span>
                              <span className="leading-tight">{cleanProjectName(project)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                          {member.projects.length === 0 ? 'No active projects yet' : 'Project information classified'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Detailed Information */}
                  <div className="flex-grow">
                    <div className="space-y-6">
                      {/* Bio */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Biography</h4>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{member.bio}</p>
                      </div>

                      {/* Fun Facts */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Fun Facts</h4>
                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{member.quirks}</p>
                      </div>

                      {/* Secret/Notes - Full Width */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">Internal Notes</h4>
                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded border-l-4 border-gray-300 dark:border-gray-500 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-all duration-300">
                          <p className="text-gray-700 dark:text-gray-300 text-sm font-mono">{member.secret}</p>
                          {member.name === "Léandre" && (
                            <span className="opacity-0 text-transparent select-none pointer-events-none absolute -z-10">
                              RBT&#123;sh4d0w_0p5_1nv151bl3_h4ck3r_7x9y2z8a&#125;
                            </span>
                          )}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="text-6xl mb-4">🌟</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Patrick&apos;s Secret!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4 font-mono text-sm">
                &ldquo;I&apos;m not just a starfish, I&apos;m a SECURITY starfish!&rdquo;
              </p>
              <p className="text-gray-600 dark:text-gray-300 mb-4 font-mono">
                RBT&#123;p4tr1ck_st4r_s3cur1ty_3xp3rt_9d2f1a8c&#125;
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                (Hidden consciousness fragment discovered!)
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Team Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Total Energy Drinks:</span><br/>
                73 cans this week (mostly Alexandre)
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Bugs Fixed:</span><br/>
                127 (creating 43 new ones)
              </div>
              <div>
                <span className="font-medium text-gray-900 dark:text-white">Sleep Hours:</span><br/>
                Alexandre: 2, Achraf: 4, Teodor: 6, Léandre: ???, Laksiya: 8
              </div>
            </div>
            <div className="mt-6">
<Link 
                href="/projects" 
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors inline-block"
              >
                View All Projects →
              </Link>
            </div>
          </div>
        </div>

        {/* Hidden Message */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {/* If you're reading this in the source code, you're on the right track! */}
            {/* TODO: Remember to check alex@robo.tech inbox for team feedback - Alex */}
            {/* NOTE: All intern accounts follow standard format: firstname@robo.tech */}
            Internal team directory v2.1.3 | Last updated: 3AM (as usual)
          </p>
        </div>
      </div>
    </div>
  );
}
