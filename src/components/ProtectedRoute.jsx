import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../utils/api';

/**
 * ProtectedRoute - Requires authentication
 * Redirects to /signin if not authenticated
 */
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
