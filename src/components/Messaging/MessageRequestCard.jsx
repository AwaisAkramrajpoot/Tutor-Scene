import React, { useState } from 'react';
import UserAvatar from './UserAvatar';
import { formatMessageDate, getDisplayName } from '../../utils/messagingHelpers';
import { useMessaging } from '../../contexts/MessagingContext';

const MessageRequestCard = ({ request, onAccept, onReject, highlight = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(request.status);
  const { currentUser } = useMessaging();

  const handleAccept = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // Optimistic UI update
      setLocalStatus('accepted');
      await onAccept(request.id);
    } catch (error) {
      // Revert on error
      setLocalStatus(request.status);
      console.error('Error accepting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      // Optimistic UI update
      setLocalStatus('rejected');
      await onReject(request.id);
    } catch (error) {
      // Revert on error
      setLocalStatus(request.status);
      console.error('Error rejecting request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't show if already processed
  if (localStatus !== 'pending') {
    return null;
  }

  const student = request.student;

  return (
    <div
      id={`message-request-${request.id}`}
      className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
        highlight ? 'border-brand-medium-blue ring-2 ring-brand-medium-blue/30' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Student Avatar */}
        <UserAvatar user={student} size="md" />

        {/* Student Info and Message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h4 className="font-semibold text-gray-900">
                {getDisplayName(student, currentUser?.role)}
              </h4>
              <p className="text-xs text-gray-500">
                {formatMessageDate(request.createdAt)}
              </p>
            </div>
          </div>

          {/* Optional Message */}
          {request.message && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-3">
              {request.message}
            </p>
          )}

          {/* Action Buttons - Touch-friendly size (min 44px) */}
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-colors touch-manipulation ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Accept'}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2.5 min-h-[44px] rounded-lg font-medium text-sm transition-colors touch-manipulation ${
                isProcessing
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageRequestCard;
