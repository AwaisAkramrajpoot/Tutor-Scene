import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../utils/api';
import { getMessageRequests } from '../../services/messagingService';
import MessageRequestDialog from './MessageRequestDialog';

const MessageRequestButton = ({ tutorId, tutorName, disabled = false }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [loading, setLoading] = useState(true);
  const currentUser = getCurrentUser();

  // Check if user is a student
  const isStudent = currentUser?.role === 'student';

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!isStudent) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const requests = await getMessageRequests();
        
        // Check if there's already a pending or accepted request to this tutor
        const existingRequest = requests.find(
          (req) => req.tutorId === tutorId && (req.status === 'pending' || req.status === 'accepted')
        );
        
        setAlreadySent(!!existingRequest);
      } catch (error) {
        console.error('Error checking existing requests:', error);
      } finally {
        setLoading(false);
      }
    };

    checkExistingRequest();
  }, [tutorId, isStudent]);

  // Don't show button if not a student
  if (!isStudent) {
    return null;
  }

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleRequestSent = () => {
    setAlreadySent(true);
    setIsDialogOpen(false);
  };

  const isDisabled = disabled || alreadySent || loading;

  return (
    <>
      <button
        onClick={handleOpenDialog}
        disabled={isDisabled}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-lg font-medium transition-colors touch-manipulation ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
        }`}
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        {loading ? 'Loading...' : alreadySent ? 'Request Sent' : 'Send Message'}
      </button>

      {isDialogOpen && (
        <MessageRequestDialog
          tutorId={tutorId}
          tutorName={tutorName}
          onClose={handleCloseDialog}
          onSuccess={handleRequestSent}
        />
      )}
    </>
  );
};

export default MessageRequestButton;
