import { migrateUnscopedTutorOnboardingForCurrentUser } from './onboarding';

const API_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000'
    : 'http://tutor-scene-alb-470637409.us-east-1.elb.amazonaws.com');

export const resolveApiAssetUrl = (u) => {
  if (!u || typeof u !== 'string') return '';
  if (u.startsWith('/')) return `${API_URL}${u}`;
  try {
    const parsed = new URL(u);
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${API_URL}${parsed.pathname}${parsed.search}`;
    }
  } catch (_) {}
  return u;
};

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers = [];

// Request deduplication - prevent duplicate simultaneous requests
const pendingRequests = new Map();

/**
 * Subscribe to token refresh completion
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/**
 * Notify all subscribers when token is refreshed
 */
const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken));
  refreshSubscribers = [];
};

/**
 * Refresh the access token using refresh token
 * @returns {Promise<string>} - New access token
 */
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    
    // Update tokens and user in localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data.accessToken;
  } catch (error) {
    // If refresh fails, logout user
    console.error('Token refresh failed:', error);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/signin';
    throw error;
  }
};

/**
 * Custom API Error class with additional context
 */
export class APIError extends Error {
  constructor(message, statusCode, code, errors = null, retryable = false) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors; // Field-specific validation errors
    this.retryable = retryable; // Whether the request can be retried
    this.timestamp = new Date();
  }
}

/**
 * Retry logic with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} - Result of the function
 */
const retryWithBackoff = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if not retryable or last attempt
      if (!error.retryable || attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff: delay * 2^attempt
      const backoffDelay = delay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${backoffDelay}ms`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
};

/**
 * Make an authenticated API request with automatic token refresh
 * @param {string} endpoint - API endpoint (e.g., '/api/v1/users')
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {object} retryOptions - Retry configuration { maxRetries, delay, deduplicate }
 * @returns {Promise} - Response data
 */
export const apiRequest = async (endpoint, options = {}, retryOptions = {}) => {
  const { maxRetries = 3, delay = 1000, deduplicate = true } = retryOptions;
  
  // Create a unique key for this request
  const requestKey = `${options.method || 'GET'}:${endpoint}:${options.body || ''}`;
  
  // Check if this exact request is already in progress
  if (deduplicate && pendingRequests.has(requestKey)) {
    console.log(`Deduplicating request: ${requestKey}`);
    return pendingRequests.get(requestKey);
  }
  
  const makeRequest = async () => {
    const token = localStorage.getItem('accessToken');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    let response;
    
    try {
      response = await fetch(`${API_URL}${endpoint}`, config);
    } catch (error) {
      // Network error (no internet, server down, etc.)
      console.error('Network error:', error);
      throw new APIError(
        'Network error. Please check your internet connection.',
        0,
        'NETWORK_ERROR',
        null,
        true // Retryable
      );
    }
    
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Try to refresh the token
      if (!isRefreshing) {
        isRefreshing = true;
        
        try {
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          onTokenRefreshed(newToken);
          
          // Retry the original request with new token
          const retryConfig = {
            ...config,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          
          const retryResponse = await fetch(`${API_URL}${endpoint}`, retryConfig);
          
          if (!retryResponse.ok) {
            const retryData = await retryResponse.json().catch(() => ({}));
            throw new APIError(
              retryData.message || 'Authentication failed',
              retryResponse.status,
              'AUTH_ERROR',
              retryData.errors,
              false
            );
          }
          
          const retryData = await retryResponse.json();
          return retryData;
        } catch (refreshError) {
          isRefreshing = false;
          // Authentication failed - redirect to login
          throw new APIError(
            'Session expired. Please log in again.',
            401,
            'AUTH_ERROR',
            null,
            false
          );
        }
      } else {
        // If already refreshing, wait for it to complete
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(async (newToken) => {
            try {
              const retryConfig = {
                ...config,
                headers: {
                  ...config.headers,
                  'Authorization': `Bearer ${newToken}`,
                },
              };
              
              const retryResponse = await fetch(`${API_URL}${endpoint}`, retryConfig);
              
              if (!retryResponse.ok) {
                const retryData = await retryResponse.json().catch(() => ({}));
                reject(new APIError(
                  retryData.message || 'Authentication failed',
                  retryResponse.status,
                  'AUTH_ERROR',
                  retryData.errors,
                  false
                ));
              } else {
                const retryData = await retryResponse.json();
                resolve(retryData);
              }
            } catch (error) {
              reject(new APIError(
                'Authentication failed',
                401,
                'AUTH_ERROR',
                null,
                false
              ));
            }
          });
        });
      }
    }

    // Handle 429 Too Many Requests - rate limiting
    if (response.status === 429) {
      const data = await response.json().catch(() => ({}));
      const retryAfter = response.headers.get('Retry-After') || 60;
      throw new APIError(
        data.message || `Too many requests. Please wait ${retryAfter} seconds.`,
        429,
        'RATE_LIMIT',
        { retryAfter: parseInt(retryAfter) },
        true // Retryable after delay
      );
    }

    // Handle 400 Bad Request - validation errors
    if (response.status === 400) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(
        data.message || 'Invalid request',
        400,
        'VALIDATION_ERROR',
        data.errors || null, // Field-specific errors
        false
      );
    }

    // Handle 403 Forbidden
    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(
        data.message || 'Access denied',
        403,
        'FORBIDDEN',
        null,
        false
      );
    }

    // Handle 404 Not Found
    if (response.status === 404) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(
        data.message || 'Resource not found',
        404,
        'NOT_FOUND',
        null,
        false
      );
    }

    // Handle 500+ Server Errors
    if (response.status >= 500) {
      const data = await response.json().catch(() => ({}));
      throw new APIError(
        data.message || 'Server error. Please try again later.',
        response.status,
        'SERVER_ERROR',
        null,
        true // Retryable
      );
    }

    // Parse response data
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new APIError(
        data.message || 'API request failed',
        response.status,
        'UNKNOWN_ERROR',
        data.errors,
        false
      );
    }

    return data;
  };

  // Wrap in retry logic for retryable errors
  const requestPromise = (async () => {
    try {
      return await retryWithBackoff(makeRequest, maxRetries, delay);
    } catch (error) {
      // If it's already an APIError, rethrow it
      if (error instanceof APIError) {
        throw error;
      }
      
      // Otherwise, wrap in APIError
      console.error('API Request Error:', error);
      throw new APIError(
        error.message || 'An unexpected error occurred',
        0,
        'UNKNOWN_ERROR',
        null,
        false
      );
    } finally {
      // Remove from pending requests when done
      if (deduplicate) {
        pendingRequests.delete(requestKey);
      }
    }
  })();
  
  // Store the promise for deduplication
  if (deduplicate) {
    pendingRequests.set(requestKey, requestPromise);
  }
  
  return requestPromise;
};

/**
 * File upload (multipart/form-data) with auth
 * Do NOT set Content-Type manually; browser adds boundary.
 */
export const apiUpload = async (endpoint, file) => {
  const token = localStorage.getItem('accessToken');
  const form = new FormData();
  form.append('file', file);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: form,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'File upload failed');
  }
  if (data?.url && typeof data.url === 'string' && data.url.startsWith('/')) {
    data.url = `${API_URL}${data.url}`;
  }
  return data;
};

/**
 * Get current user from localStorage
 * @returns {object|null} - User object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Get access token from localStorage
 * @returns {string|null} - Access token or null
 */
export const getAccessToken = () => {
  return localStorage.getItem('accessToken');
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Logout user
 */
export const logout = () => {
  stopTokenRefreshScheduler();
  migrateUnscopedTutorOnboardingForCurrentUser();
  localStorage.removeItem('user');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  window.location.href = '/signin';
};

/**
 * Token refresh scheduler
 * Automatically refreshes token every 14 minutes (assuming 15 min expiry)
 */
let refreshInterval = null;

export const startTokenRefreshScheduler = () => {
  // Clear any existing interval
  stopTokenRefreshScheduler();
  
  // Only start if user is authenticated
  if (!isAuthenticated()) {
    return;
  }

  // Refresh token every 14 minutes (840000 ms)
  // Adjust this based on your token expiry time
  refreshInterval = setInterval(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('Proactively refreshing token...');
        await refreshAccessToken();
        console.log('Token refreshed successfully');
      }
    } catch (error) {
      console.error('Scheduled token refresh failed:', error);
      stopTokenRefreshScheduler();
    }
  }, 14 * 60 * 1000); // 14 minutes
};

export const stopTokenRefreshScheduler = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
};

/**
 * High-level API helpers for onboarding
 */
export const uploadOnboardingFile = (file) => apiUpload('/api/v1/onboarding/file', file);
export const submitTutorOnboarding = (payload) => apiRequest('/api/v1/onboarding/tutor', {
  method: 'POST',
  body: JSON.stringify(payload),
});
export const fetchMyTutorProspect = () => apiRequest('/api/v1/onboarding/tutor/me', { method: 'GET' });
