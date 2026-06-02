import { useMessaging } from '../../contexts/MessagingContext';
import { SocketError } from '../../utils/socket';

const ConnectionStatus = () => {
  const { isConnected, error } = useMessaging();

  // Don't show anything if connected and no error
  if (isConnected && !error) {
    return null;
  }

  const getErrorMessage = () => {
    if (!error) return null;
    
    if (error instanceof SocketError) {
      return error.message;
    }
    
    if (typeof error === 'object' && error.message) {
      return error.message;
    }
    
    return String(error);
  };

  const isRetryable = () => {
    if (error instanceof SocketError) {
      return error.retryable;
    }
    return false;
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="w-full flex-shrink-0">
      {/* Disconnected Status - Reconnecting */}
      {!isConnected && !error && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
              <span className="text-sm text-yellow-800 font-medium">
                Reconnecting...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Disconnected with retryable error */}
      {!isConnected && error && isRetryable() && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-600 border-t-transparent"></div>
              <span className="text-sm text-yellow-800 font-medium">
                {getErrorMessage()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Status - Non-retryable */}
      {error && !isRetryable() && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <svg
                className="h-5 w-5 text-red-600 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-800 font-medium">
                {getErrorMessage()}
              </span>
              <button
                onClick={handleRefresh}
                className="ml-2 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
