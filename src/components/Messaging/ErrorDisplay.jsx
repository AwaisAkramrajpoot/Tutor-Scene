import React from 'react';
import { APIError } from '../../utils/api';

/**
 * ErrorDisplay component for showing user-friendly error messages
 * @param {Object} props
 * @param {Error|APIError} props.error - Error object
 * @param {Function} props.onRetry - Retry callback
 * @param {Function} props.onDismiss - Dismiss callback
 * @param {string} props.className - Additional CSS classes
 */
const ErrorDisplay = ({ error, onRetry, onDismiss, className = '' }) => {
  if (!error) return null;

  const getErrorDetails = () => {
    if (error instanceof APIError) {
      return {
        message: error.message,
        code: error.code,
        retryable: error.retryable,
        errors: error.errors,
      };
    }
    
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      retryable: false,
      errors: null,
    };
  };

  const { message, code, retryable, errors } = getErrorDetails();

  const getErrorIcon = () => {
    switch (code) {
      case 'NETWORK_ERROR':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
          </svg>
        );
      case 'AUTH_ERROR':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'RATE_LIMIT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 text-red-600">
          {getErrorIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {message}
          </h3>
          
          {/* Field-specific validation errors */}
          {errors && typeof errors === 'object' && (
            <div className="mt-2 text-sm text-red-700">
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(errors).map(([field, fieldErrors]) => (
                  <li key={field}>
                    <span className="font-medium">{field}:</span>{' '}
                    {Array.isArray(fieldErrors) ? fieldErrors.join(', ') : fieldErrors}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Rate limit specific info */}
          {code === 'RATE_LIMIT' && errors?.retryAfter && (
            <p className="mt-1 text-sm text-red-700">
              Please wait {errors.retryAfter} seconds before trying again.
            </p>
          )}
        </div>
        
        <div className="ml-3 flex-shrink-0 flex gap-2">
          {retryable && onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Retry
            </button>
          )}
          
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="inline-flex text-red-400 hover:text-red-600 focus:outline-none"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
