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

      // Allow access to signin/signup always
      const publicPaths = ['/signin', '/signup'];
      if (publicPaths.includes(location.pathname)) {
        setIsAllowed(true);
        setIsChecking(false);
        return;
      }

      // PRIORITY CHECK: If prospectStatus is 'active', check payment status from API first
      if (user.prospectStatus === 'active') {
        console.log('OnboardingStatusGuard - prospectStatus is active, checking payment status from API...');
        
        try {
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
          const paymentResponse = await fetch(
            `${apiUrl}/api/v1/onboarding/payment-onboarded/${user.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            }
          );

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            const isPaymentOnboarded = paymentData.paymentOnBoarded;

            console.log('OnboardingStatusGuard - Payment API Response:', paymentData);
            console.log('OnboardingStatusGuard - isPaymentOnboarded:', isPaymentOnboarded);

            // Update localStorage with latest payment status
            const updatedUser = { 
              ...user, 
              paymentOnBoarded: isPaymentOnboarded 
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('OnboardingStatusGuard - Updated user in localStorage:', updatedUser);

            // If payment is not onboarded, lock to payment setup pages
            if (isPaymentOnboarded === false) {
              const paymentSetupPaths = ['/tutor/payment-setup', '/tutor/onboarding/refresh', '/tutor/onboarding/complete'];
              if (!paymentSetupPaths.includes(location.pathname)) {
                console.log('OnboardingStatusGuard - Redirecting to payment setup (paymentOnBoarded=false)');
                navigate('/tutor/payment-setup', { replace: true });
                setIsAllowed(false);
                setIsChecking(false);
                return;
              } else {
                console.log('OnboardingStatusGuard - Already on payment setup page, allowing');
                setIsAllowed(true);
                setIsChecking(false);
                return;
              }
            } else {
              console.log('OnboardingStatusGuard - Payment onboarded, continuing with normal flow');
              // Payment is complete, continue with normal flow (will check onboarding routes below)
            }
          } else {
            console.error('OnboardingStatusGuard - Payment API failed, falling back to localStorage');
            // Fall back to localStorage value
            if (user.paymentOnBoarded === false) {
              const paymentSetupPaths = ['/tutor/payment-setup', '/tutor/onboarding/refresh', '/tutor/onboarding/complete'];
              if (!paymentSetupPaths.includes(location.pathname)) {
                navigate('/tutor/payment-setup', { replace: true });
                setIsAllowed(false);
                setIsChecking(false);
                return;
              } else {
                setIsAllowed(true);
                setIsChecking(false);
                return;
              }
            }
          }
        } catch (paymentError) {
          console.error('OnboardingStatusGuard - Error checking payment status:', paymentError);
          // Fall back to localStorage value on error
          if (user.paymentOnBoarded === false) {
            const paymentSetupPaths = ['/tutor/payment-setup', '/tutor/onboarding/refresh', '/tutor/onboarding/complete'];
            if (!paymentSetupPaths.includes(location.pathname)) {
              navigate('/tutor/payment-setup', { replace: true });
              setIsAllowed(false);
              setIsChecking(false);
              return;
            } else {
              setIsAllowed(true);
              setIsChecking(false);
              return;
            }
          }
        }
      }

      // Check if tutor doesn't have prospectStatus - restrict to onboarding routes only
      if (!user.prospectStatus) {
        const allowedOnboardingPaths = ['/create-profile', '/verify-identity'];
        if (!allowedOnboardingPaths.includes(location.pathname)) {
          navigate('/create-profile', { replace: true });
          setIsAllowed(false);
          setIsChecking(false);
          return;
        } else {
          setIsAllowed(true);
          setIsChecking(false);
          return;
        }
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
          
          // Handle different API response formats: data.result, data.status, or data.data.status
          const status = data.result || data.status || data.data?.status;
          
          console.log('OnboardingStatusGuard - API Response:', data);
          console.log('OnboardingStatusGuard - Extracted Status:', status);
          
          // Update localStorage with the latest prospectStatus
          const updatedUser = {
            ...user,
            prospectStatus: status
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          console.log('OnboardingStatusGuard - Updated localStorage user:', updatedUser);
          
          // Get paymentOnBoarded from user object in localStorage
          const paymentOnBoarded = user.paymentOnBoarded;
          
          // Onboarding routes that should be blocked for active/pending tutors
          const onboardingRoutes = ['/create-profile', '/verify-identity', '/become-tutor', '/ready-to-teach'];
          const isOnboardingRoute = onboardingRoutes.includes(location.pathname);
          
          // If status is pending, LOCK to profile-under-review page
          if (status === 'pending') {
            if (location.pathname !== '/profile-under-review') {
              navigate('/profile-under-review', { replace: true });
              setIsAllowed(false);
            } else {
              setIsAllowed(true);
            }
          } 
          // If status is awaiting_interview, allow interviews and messages, but redirect from other pages
          else if (status === 'awaiting_interview') {
            const allowedPaths = ['/interviews', '/messages'];
            const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));
            
            if (!isAllowedPath) {
              navigate('/interviews', { replace: true });
              setIsAllowed(false);
            } else {
              setIsAllowed(true);
            }
          } 
          else if (status === 'active') {
            // Check payment onboarding status from API
            try {
              const paymentResponse = await fetch(
                `${apiUrl}/api/v1/onboarding/payment-onboarded/${user.id}`,
                {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  }
                }
              );

              if (paymentResponse.ok) {
                const paymentData = await paymentResponse.json();
                const isPaymentOnboarded = paymentData.paymentOnboarded;

                console.log('OnboardingStatusGuard - Payment API Response:', paymentData);
                console.log('OnboardingStatusGuard - isPaymentOnboarded:', isPaymentOnboarded);

                // Update localStorage with latest payment status AND prospectStatus
                const updatedUserWithPayment = { 
                  ...user, 
                  prospectStatus: status,
                  paymentOnBoarded: isPaymentOnboarded 
                };
                localStorage.setItem('user', JSON.stringify(updatedUserWithPayment));
                console.log('OnboardingStatusGuard - Updated user with payment status:', updatedUserWithPayment);

                if (isPaymentOnboarded === false) {
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
                // If payment API fails, fall back to localStorage value
                if (paymentOnBoarded === false) {
                  if (location.pathname !== '/tutor/payment-setup' && 
                      location.pathname !== '/tutor/onboarding/refresh' && 
                      location.pathname !== '/tutor/onboarding/complete') {
                    navigate('/tutor/payment-setup', { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                } else {
                  if (isOnboardingRoute) {
                    navigate('/tutor-dashboard', { replace: true });
                    setIsAllowed(false);
                  } else {
                    setIsAllowed(true);
                  }
                }
              }
            } catch (paymentError) {
              console.error('Error checking payment status:', paymentError);
              // Fall back to localStorage value on error
              if (paymentOnBoarded === false) {
                if (location.pathname !== '/tutor/payment-setup' && 
                    location.pathname !== '/tutor/onboarding/refresh' && 
                    location.pathname !== '/tutor/onboarding/complete') {
                  navigate('/tutor/payment-setup', { replace: true });
                  setIsAllowed(false);
                } else {
                  setIsAllowed(true);
                }
              } else {
                if (isOnboardingRoute) {
                  navigate('/tutor-dashboard', { replace: true });
                  setIsAllowed(false);
                } else {
                  setIsAllowed(true);
                }
              }
            }
          } else {
            // Status is not active, pending, or awaiting_interview - allow navigation
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
