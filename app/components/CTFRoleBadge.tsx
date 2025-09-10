'use client';

interface CTFRoleBadgeProps {
  role: string;
  className?: string;
}

export type CTFGroup = 'core' | 'northstar' | 'participant';

// Helper function to determine CTF group based on role
export function getCtfGroup(role: string): CTFGroup {
  const lowerRole = role.toLowerCase();
  
  if (lowerRole.includes('ctf challenge architect') || 
      lowerRole.includes('chief exploitation officer') || 
      lowerRole.includes('shadow ops commander')) {
    return 'core';
  }
  
  if (lowerRole.includes('north star agi')) {
    return 'northstar';
  }
  
  return 'participant';
}

// Get styling classes based on CTF group
function getGroupStyling(group: CTFGroup): string {
  switch (group) {
    case 'core':
      return 'bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 text-yellow-900 shadow-lg shadow-yellow-500/25 border-2 border-yellow-600/20';
    case 'northstar':
      return 'bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-600 text-white shadow-lg shadow-indigo-500/25 border-2 border-indigo-600/20';
    case 'participant':
      return 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-emerald-900 shadow-lg shadow-emerald-500/25 border-2 border-emerald-600/20';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function CTFRoleBadge({ role, className = '' }: CTFRoleBadgeProps) {
  const group = getCtfGroup(role);
  const groupStyling = getGroupStyling(group);
  
  return (
    <div 
      className={`
        inline-flex items-center px-4 py-2 rounded-lg font-bold text-sm md:text-base
        transform transition-all duration-200 hover:scale-105
        ${groupStyling}
        ${className}
      `}
      title={role}
      aria-label={`CTF Role: ${role}`}
    >
      <span className="mr-2 text-lg">{role.split(' ')[0]}</span>
      <span className="leading-tight">{role.substring(role.indexOf(' ') + 1)}</span>
    </div>
  );
}
