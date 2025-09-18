import { useState } from 'react';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface InvitationNotificationsProps {
  className?: string;
}

export default function InvitationNotifications({ className = '' }: InvitationNotificationsProps) {
  const { invitations, acceptInvitation, isLoadingInvitations } = useProjects();
  const { user } = useAuth();
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);

  // Don't show for dev users
  if (user?.role === 'dev') {
    return null;
  }

  // Filter for received invitations only
  const receivedInvitations = invitations?.filter(invite => invite.type === 'received') || [];

  const handleAcceptInvitation = async (invitationId: string) => {
    setAcceptingInvite(invitationId);
    
    try {
      const result = await acceptInvitation(invitationId);
      
      if (result.success) {
        toast.success(result.message || 'Successfully joined the project!');
      } else {
        toast.error(result.error || 'Failed to accept invitation');
      }
    } catch (error) {
      toast.error('Network error occurred');
      console.error('Accept invitation error:', error);
    } finally {
      setAcceptingInvite(null);
    }
  };

  if (isLoadingInvitations) {
    return (
      <div className={className}>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Loading invitations...</span>
          </div>
        </div>
      </div>
    );
  }

  if (receivedInvitations.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span>Project Invitations ({receivedInvitations.length})</span>
        </h3>
        
        {receivedInvitations.map((invitation) => (
          <div
            key={invitation.id}
            className="bg-white border border-blue-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-xl">{invitation.projectLogo}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {invitation.projectName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Invited by {invitation.projectLead}
                    </p>
                  </div>
                </div>
                
                {invitation.projectDescription && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {invitation.projectDescription}
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  Received {new Date(invitation.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => handleAcceptInvitation(invitation.id)}
                  disabled={acceptingInvite === invitation.id}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  {acceptingInvite === invitation.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Accepting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Accept</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}