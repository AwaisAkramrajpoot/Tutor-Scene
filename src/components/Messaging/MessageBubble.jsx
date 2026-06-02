import { useState, memo } from 'react';
import { formatMessageTime } from '../../utils/messagingHelpers';
import { Check, CheckCheck, Clock, AlertCircle, RefreshCw } from 'lucide-react';

const MessageBubble = memo(({ message, isOwn, showAvatar = false, showTimestamp = true, onRetry = null }) => {
  const [showFullTimestamp, setShowFullTimestamp] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case 'sending':
        return <Clock className="w-3 h-3 text-gray-400 animate-pulse" />;
      case 'delivered':
        return <Check className="w-3 h-3 text-gray-400" />;
      case 'read':
        return <CheckCheck className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Check className="w-3 h-3 text-gray-400" />;
    }
  };

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    
    setIsRetrying(true);
    try {
      await onRetry(message);
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  };

  const isFailed = message.status === 'failed';

  return (
    <div
      className={`flex items-end gap-2 mb-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setShowFullTimestamp(true)}
      onMouseLeave={() => setShowFullTimestamp(false)}
    >
      {/* Avatar placeholder for alignment */}
      <div className="w-8 h-8 shrink-0" aria-hidden="true" />

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-2 rounded-2xl break-words ${
            isFailed
              ? 'bg-red-100 text-red-900 border border-red-300 rounded-br-sm'
              : isOwn
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp and status */}
        {showTimestamp && (showFullTimestamp || isFailed) && (
          <div className={`flex items-center gap-2 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.createdAt)}
            </span>
            {getStatusIcon()}
            
            {/* Retry button for failed messages */}
            {isFailed && onRetry && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Retry sending message"
              >
                <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Failed message notice */}
        {isFailed && !showFullTimestamp && (
          <div className="flex items-center gap-1 mt-1 px-2">
            <span className="text-xs text-red-600">Message failed to send</span>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  // Only re-render if these props change
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.status === nextProps.message.status &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isOwn === nextProps.isOwn &&
    prevProps.showAvatar === nextProps.showAvatar &&
    prevProps.showTimestamp === nextProps.showTimestamp
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
