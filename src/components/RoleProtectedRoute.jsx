import { Navigate } from 'react-router-dom';
import { isAuthenticated, getCurrentUser } from '../utils/api';

/**
 * RoleProtectedRoute - Requires authentication and specific role(s)
 * Redirects to /signin if not authenticated
 * Redirects to appropriate dashboard if wrong role
 */
const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  const user = getCurrentUser();
  const userRole = user?.role?.toLowerCase();

  // Check if user has one of the allowed roles
  const hasAccess = allowedRoles.some(role => role.toLowerCase() === userRole);

  if (!hasAccess) {
    switch (userRole) {
      case 'student':
        return <Navigate to="/find-tutors" replace />;
      case 'tutor':
        return <Navigate to="/tutor-dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin-dashboard" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default RoleProtectedRoute;
