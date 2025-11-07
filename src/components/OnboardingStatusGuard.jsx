import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OnboardingStatusGuard = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const userStr = localStorage.getItem('user');
      const token = localStorage.getItem('accessToken');

      // If no user or token, allow navigation (will be handled by other guards)
      if (!userStr || !token) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      const user = JSON.parse(userStr);

      // Only check status for tutors
      if (user.role !== 'tutor') {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // Allow access to profile-under-review, payment setup pages, and signin/signup
      const allowedPaths = [
        '/profile-under-review', 
        '/signin', 
        '/signup',
        '/tutor/payment-setup',
        '/tutor/onboarding/refresh',
        '/tutor/onboarding/complete'
      ];
      if (allowedPaths.includes(location.pathname)) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
        const response = await fetch(
          `${apiUrl}/api/v1/onboarding/status/${user.id}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Get paymentOnBoarded from user object in localStorage
          const paymentOnBoarded = user.paymentOnBoarded;
          
          // Onboarding routes that should be blocked for active/pending tutors
          const onboardingRoutes = ['/create-profile', '/verify-identity', '/become-tutor', '/ready-to-teach'];
          const isOnboardingRoute = onboardingRoutes.includes(location.pathname);
          
          // If status is pending, redirect to review page
          if (data.status === 'pending') {
            if (isOnboardingRoute) {
              // Block access to onboarding routes for pending tutors
              navigate('/profile-under-review', { replace: true });
              setIsAllowed(false);
            } else {
              navigate('/profile-under-review', { replace: true });
              setIsAllowed(false);
            }
          } else if (data.status === 'active') {
            // Check if payment onboarding is complete
            if (paymentOnBoarded === false) {
              // Redirect to payment setup if not completed
              if (location.pathname !== '/tutor/payment-setup' && 
                  location.pathname !== '/tutor/onboarding/refresh' && 
                  location.pathname !== '/tutor/onboarding/complete') {
                navigate('/tutor/payment-setup', { replace: true });
                setIsAllowed(false);
              } else {
                setIsAllowed(true);
              }
            } else {
              // Payment onboarding complete - block access to onboarding routes
              if (isOnboardingRoute) {
                navigate('/tutor-dashboard', { replace: true });
                setIsAllowed(false);
              } else {
                setIsAllowed(true);
              }
            }
          } else {
            // Status is not active or pending - allow navigation
            setIsAllowed(true);
          }
        } else {
          // If API fails, allow navigation (fail open)
          console.error('Failed to check onboarding status');
          setIsAllowed(true);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, allow navigation (fail open)
        setIsAllowed(true);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboardingStatus();
  }, [navigate, location.pathname]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Render children if allowed
  return isAllowed ? children : null;
};

export default OnboardingStatusGuard;
