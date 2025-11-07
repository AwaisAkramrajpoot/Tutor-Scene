import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { startTokenRefreshScheduler, stopTokenRefreshScheduler, isAuthenticated } from '../utils/api';

/**
 * Component to manage automatic token refresh
 * Should be placed at the root level of the app
 */
const TokenRefreshManager = () => {
  const location = useLocation();

  useEffect(() => {
    // Start token refresh scheduler when component mounts
    if (isAuthenticated()) {
      startTokenRefreshScheduler();
    }

    // Cleanup on unmount
    return () => {
      stopTokenRefreshScheduler();
    };
  }, []);

  // Restart scheduler when route changes (in case user logs in/out)
  useEffect(() => {
    if (isAuthenticated()) {
      startTokenRefreshScheduler();
    } else {
      stopTokenRefreshScheduler();
    }
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default TokenRefreshManager;
