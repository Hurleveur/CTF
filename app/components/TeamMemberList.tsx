import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProjects, type TeamMember } from '../contexts/ProjectContext';
import toast from 'react-hot-toast';

interface TeamMemberListProps {
  teamMembers: TeamMember[] | undefined;
  projectId: string | number;
  showLeaveButton?: boolean;
  className?: string;
}

export default function TeamMemberList({ 
  teamMembers, 
  projectId, 
  showLeaveButton = false,
  className = '' 
}: TeamMemberListProps) {
  const { user } = useAuth();
  const { leaveProject } = useProjects();
  const [isLeaving, setIsLeaving] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  // Check if current user is in this project and is not the lead
  const currentUserMember = teamMembers?.find(member => member.id === user?.id);
  const canLeave = currentUserMember && !currentUserMember.isLead;

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

  if (!teamMembers || teamMembers.length === 0) {
    return (
      <div className={className}>
        <p className="text-gray-500 text-sm italic">No team members</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        {/* Team Member Avatars */}
        <div className="flex items-center space-x-2 flex-wrap">
          {teamMembers.map((member, index) => (
            <div
              key={member.id}
              className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1"
              title={`${member.name}${member.isLead ? ' (Lead)' : ''} - Joined ${new Date(member.joinedAt).toLocaleDateString()}`}
            >
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {member.name}
                {member.isLead && (
                  <span className="ml-1 text-yellow-500" title="Project Leader">
                    ⭐
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Team Count */}
        <div className="text-xs text-gray-500">
          {teamMembers.length}/3 members
        </div>

        {/* Leave Project Button */}
        {showLeaveButton && canLeave && !showLeaveConfirm && (
          <button
            onClick={() => setShowLeaveConfirm(true)}
            className="inline-flex items-center px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium rounded-full transition-colors"
          >
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave Project
          </button>
        )}

        {/* Leave Confirmation */}
        {showLeaveConfirm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            <p className="text-sm text-red-800 font-medium">
              Are you sure you want to leave this project?
            </p>
            <p className="text-xs text-red-600">
              You will lose access to the project and need to be re-invited to rejoin.
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
                    Leaving...
                  </>
                ) : (
                  'Yes, Leave'
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
        )}

        {/* Leader Cannot Leave Notice */}
        {showLeaveButton && currentUserMember?.isLead && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-800">
                Project leaders cannot leave while other members remain.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}