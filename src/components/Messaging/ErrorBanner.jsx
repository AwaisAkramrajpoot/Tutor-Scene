import React from 'react';

const ErrorBanner = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  const errorMessages = {
    NETWORK_ERROR: 'Connection lost. Please check your internet.',
    AUTH_ERROR: 'Session expired. Please log in again.',
    RATE_LIMIT: 'Too many requests. Please wait a moment.',
    VALIDATION_ERROR: 'Please check your input and try again.',
    UNKNOWN_ERROR: 'Something went wrong. Please try again.',
  };

  const getErrorMessage = () => {
    if (typeof error === 'string') {
      return error;
    }
    if (error.code && errorMessages[error.code]) {
      return errorMessages[error.code];
    }
    if (error.message) {
      return error.message;
    }
    return errorMessages.UNKNOWN_ERROR;
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        {/* Error Icon */}
        <svg
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Error Message */}
        <div className="flex-1">
          <p className="text-sm text-red-800 font-medium">
            {getErrorMessage()}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-700 hover:text-red-900 font-medium"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorBanner;
