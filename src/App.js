import { useEffect } from 'react';
import { mergeProspectStatusIntoUser } from './utils/tutorProspectStatus';
import {
  refreshTutorSessionOnboardingFlags,
  resolveTutorPostLoginPath,
} from './utils/tutorOnboardingProgress';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import VerifyEmail from './components/VerifyEmail';
import FindTutorsPage from './components/FindTutorsPage';
import OnDemandLearningPage from './components/OnDemandLearningPage';
import OnDemandCartPage from './components/OnDemandCartPage';
import TutorProfile from './components/TutorProfile';
import StudentDashboard from './components/StudentDashboard';
import MySessions from './components/MySessions';
import SessionRoom from './components/SessionRoom';
import { CreateProfilePage } from './components/TutorProfile/index';
import { GetVerified, VerificationStatusPage } from './components/IdentityVerification/index';
import { StartTeachingPage } from './components/TutorProfile/ReadyToTeach/index';
import { TutorDashboard } from './components/TutorProfile/TutorDashboard/index';
import { AboutPage } from './components/About/Index';
import { Home as BecomeTutorPage } from './components/TutorProfile/Home/index';
import AdminDashboard from './components/AdminDashboard';
import TutorDetails from './components/TutorDetails';
import ProfileUnderReview from './components/ProfileUnderReview';
import MyWalletPage from './components/StripeOnboarding/MyWalletPage';
import OnboardingRefresh from './components/StripeOnboarding/OnboardingRefresh';
import OnboardingComplete from './components/StripeOnboarding/OnboardingComplete';
import TutorAvailability from './components/Availability/TutorAvailability';
import { TutorSessionHistoryPage } from './components/TutorProfile/TutorSessionHistoryPage';
import { ReferralsPage } from './components/ReferralsPage';
import MessagingPage from './components/Messaging/MessagingPage';
import InterviewsPage from './components/Interviews/InterviewsPage';
import PaymentPage from './components/Payment/PaymentPage';
import PaymentSuccess from './components/Payment/PaymentSuccess';
import BookSessionPage from './components/BookSessionPage';
import StudentNotificationsPage from './components/student/StudentNotificationsPage';
import StudentStaticPage from './components/student/StudentStaticPage';
import ProfileInformationPage from './components/student/profile/ProfileInformationPage';
import AccountSettingsPage from './components/student/account/AccountSettingsPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import OnboardingStatusGuard from './components/OnboardingStatusGuard';
import { SystemMessageProvider } from './contexts/SystemMessageContext';
import { apiRequest } from './utils/api';

// ─── NEW: Google OAuth Success Handler ────────────────────────────────────────
function GoogleAuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Decode the JWT to get user info (without verifying signature on client)
      try {
        const base64Payload = accessToken.split('.')[1];
        const decoded = JSON.parse(atob(base64Payload));
        // Fetch the full user profile using the token
        fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then(async (user) => {
            localStorage.setItem('user', JSON.stringify(user));
            if (user.role === 'tutor') {
              const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
              try {
                const statusRes = await fetch(
                  `${apiUrl}/api/v1/onboarding/status/${user.id}`,
                  { headers: { Authorization: `Bearer ${accessToken}` } },
                );
                if (statusRes.ok) {
                  const statusData = await statusRes.json();
                  let updatedUser = mergeProspectStatusIntoUser(user, statusData);
                  localStorage.setItem('user', JSON.stringify(updatedUser));
                  const refreshed = await refreshTutorSessionOnboardingFlags(
                    apiUrl,
                    accessToken,
                    updatedUser,
                  );
                  updatedUser = refreshed.user;
                  const path = resolveTutorPostLoginPath({
                    prospectStatus: statusData.status || statusData.data?.status,
                    publishedStatus:
                      statusData.publishedStatus || statusData.data?.publishedStatus,
                    hasPendingProfileUpdate: Boolean(
                      statusData.hasPendingProfileUpdate ??
                        statusData.data?.hasPendingProfileUpdate,
                    ),
                    paymentOnBoarded: updatedUser.paymentOnBoarded,
                    interviewCompleted: updatedUser.interviewCompleted,
                    verificationCompleted: updatedUser.verificationCompleted,
                  });
                  navigate(path);
                  return;
                }
              } catch {
                /* fall through */
              }
              navigate('/create-profile');
            } else if (user.role === 'admin') {
              navigate('/admin-dashboard');
            } else {
              navigate('/dashboard');
            }
          })
          .catch(() => navigate('/signin?error=google_failed'));
      } catch {
        navigate('/signin?error=google_failed');
      }
    } else {
      navigate('/signin?error=google_failed');
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Signing you in with Google...</p>
    </div>
  );
}
// ──────────────────────────────────────────────────────────────────────────────

// Component to handle tutor status check and redirect
function TutorStatusChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkTutorStatus = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        if (!userStr) {
          console.log('TutorStatusChecker - No user in localStorage');
          return;
        }
        if (!token) {
          console.log('TutorStatusChecker - No access token, skipping status check');
          return;
        }

        const user = JSON.parse(userStr);
        console.log('TutorStatusChecker - Current user:', user);
        
        // Only check status for tutors
        if (user.role !== 'tutor') {
          console.log('TutorStatusChecker - User is not a tutor, skipping');
          return;
        }

        // Fetch current onboarding status - use userId and ensure it's a string
        const userId = String(user.userId || user.id || '');
        if (!userId) {
          console.log('TutorStatusChecker - No userId found');
          return;
        }
        
        console.log('TutorStatusChecker - Fetching status for userId:', userId);
        const response = await apiRequest(`/api/v1/onboarding/status/${userId}`, {
          method: 'GET'
        });

        console.log('TutorStatusChecker - API Response:', response);

        // Update user object with new prospectStatus
        if (response && response.status) {
          let updatedUser = mergeProspectStatusIntoUser(user, response);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
          const token = localStorage.getItem('accessToken');
          if (token) {
            const refreshed = await refreshTutorSessionOnboardingFlags(apiUrl, token, updatedUser);
            updatedUser = refreshed.user;
          }

        }
      } catch (error) {
        console.error('Error checking tutor onboarding status:', error);
        // Don't throw error - just log it and continue
      }
    };

    checkTutorStatus();
  }, [navigate, location.pathname]); // Run on mount and when location changes

  return null; // This component doesn't render anything
}

function App() {
  return (
    <Router>
      <SystemMessageProvider>
      <TutorStatusChecker />
      <OnboardingStatusGuard>
        <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/become-tutor" element={<Layout><BecomeTutorPage /></Layout>} />
        <Route path="/payments" element={<Layout><PaymentPage /></Layout>} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />

        {/* Student Routes - Requires Student role */}
        <Route 
          path="/dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><StudentDashboard /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/find-tutors" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><FindTutorsPage /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route
          path="/on-demand-learning"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><OnDemandLearningPage /></Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/on-demand-learning/cart"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><OnDemandCartPage /></Layout>
            </RoleProtectedRoute>
          }
        />
        <Route 
          path="/tutor/:id" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><TutorProfile /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/my-sessions" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><MySessions /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route
          path="/book-session"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <BookSessionPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <StudentNotificationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><ProfileInformationPage /></Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/account-settings"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><AccountSettingsPage /></Layout>
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/credits-referrals"
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <StudentStaticPage title="Credits & Referrals">
                <p>Track credits and share your referral link from this page.</p>
              </StudentStaticPage>
            </RoleProtectedRoute>
          }
        />
        <Route 
          path="/bookings/:id/success" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><PaymentSuccess /></Layout>
            </RoleProtectedRoute>
          } 
        />

        {/* Tutor Routes - Requires Tutor role */}
        <Route 
          path="/create-profile" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><CreateProfilePage /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/verify-identity" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><GetVerified /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/verify-identity/status" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><VerificationStatusPage /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/ready-to-teach" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><StartTeachingPage /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/tutor-dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><TutorDashboard /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/profile-under-review" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><ProfileUnderReview /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route
          path="/tutor/payment-setup"
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Navigate to="/tutor/wallet" replace />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/tutor/wallet"
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout>
                <MyWalletPage />
              </Layout>
            </RoleProtectedRoute>
          }
        />
        <Route 
          path="/tutor/onboarding/refresh" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <OnboardingRefresh />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/tutor/onboarding/complete" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <OnboardingComplete />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/tutor/availability" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><TutorAvailability /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route
          path="/tutor/session-history"
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <Layout><TutorSessionHistoryPage /></Layout>
            </RoleProtectedRoute>
          }
        />
        <Route path="/referrals" element={<Layout><ReferralsPage /></Layout>} />

        {/* Admin Routes - Requires Admin role */}
        <Route 
          path="/admin-dashboard" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Layout><AdminDashboard /></Layout>
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/admin/tutor/:id" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Layout><TutorDetails /></Layout>
            </RoleProtectedRoute>
          } 
        />

        {/* Shared Protected Routes - Any authenticated user */}
        <Route 
          path="/session/:id" 
          element={
            <ProtectedRoute>
              <Layout><SessionRoom /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages" 
          element={
            <ProtectedRoute>
              <Layout><MessagingPage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/messages/:conversationId" 
          element={
            <ProtectedRoute>
              <Layout><MessagingPage /></Layout>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/interviews" 
          element={
            <ProtectedRoute>
              <Layout><InterviewsPage /></Layout>
            </ProtectedRoute>
          } 
        />
        </Routes>
      </OnboardingStatusGuard>
      </SystemMessageProvider>
    </Router>
  );
}

export default App;