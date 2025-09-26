import { useState } from 'react';
import { useProjects, type RoboticProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: RoboticProject | null;
}

export default function InvitationModal({ isOpen, onClose, project }: InvitationModalProps) {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { sendInvitation, invitations, isLoadingInvitations } = useProjects();
  const { user } = useAuth();

  // Get sent invitations for this project
  const sentInvitations = invitations.filter(
    invite => invite.type === 'sent' && invite.projectId === project?.id?.toString()
  );

  // Check if current user is the project lead
  const isProjectLead = project?.teamMemberDetails?.some(
    member => member.id === user?.id && member.isLead
  ) || false;

  // Get current team size
  const currentTeamSize = project?.teamMemberDetails?.length || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !project || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      // Handle special case: if project ID is 1000 (user's own project), 
      // we need to get the real database project ID
      let projectIdToUse = project.id.toString();
      
      if (project.id === 1000) {
        // This is the user's own project with the special ID
        // We need to fetch the real project ID from the API
        const projectsResponse = await fetch('/api/projects');
        if (projectsResponse.ok) {
          const { projects } = await projectsResponse.json();
          const userProject = projects[0]; // User's first/main project
          if (userProject && userProject.id) {
            projectIdToUse = userProject.id.toString();
          } else {
            toast.error('Could not find your project. Please refresh and try again.');
            return;
          }
        } else {
          toast.error('Could not fetch project information. Please try again.');
          return;
        }
      }
      
      const result = await sendInvitation(username.trim(), projectIdToUse);
      
      if (result.success) {
        toast.success(result.message || 'Invitation sent successfully!');
        setUsername('');
      } else {
        // Provide more specific error messages
        let errorMessage = result.error || 'Failed to send invitation';
        
        if (errorMessage.includes('already a member')) {
          errorMessage = `${username} is already a member of another project and cannot be invited.`;
        } else if (errorMessage.includes('not found')) {
          errorMessage = `User "${username}" not found. Please check the username and try again.`;
        } else if (errorMessage.includes('already sent')) {
          errorMessage = `An invitation has already been sent to ${username}.`;
        } else if (errorMessage.includes('full')) {
          errorMessage = 'Your project is full (maximum 5 members). Remove a member before inviting someone new.';
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      toast.error('Network error occurred');
      console.error('Invitation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Invite Team Member</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!isProjectLead ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-amber-800 text-sm">
                Only project leaders can send invitations.
              </p>
            </div>
          </div>
        ) : currentTeamSize >= 5 ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-red-800 text-sm">
                Project is full (maximum 5 members).
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Project Info */}
            <div className="mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-2xl">{project?.logo}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{project?.name}</h4>
                  <p className="text-sm text-gray-600">
                    Team: {currentTeamSize}/5 members
                  </p>
                </div>
              </div>
            </div>

            {/* Invitation Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter exact username"
                  required
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must match the user&apos;s exact username from their profile.
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !username.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed text-gray-800 py-2 px-4 rounded-md font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}

        {/* Pending Invitations */}
        {isProjectLead && sentInvitations.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Pending Invitations ({sentInvitations.length})
            </h4>
            <div className="space-y-2">
              {sentInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {invitation.username}
                    </p>
                    <p className="text-xs text-gray-500">
                      Sent {new Date(invitation.createdAt).toLocaleDateString()}
                      {invitation.accepted ? (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          ✓ Accepted
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          ⏳ Pending
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingInvitations && (
          <div className="mt-4 flex items-center justify-center py-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading invitations...</span>
          </div>
        )}
      </div>
    </div>
  );
}