import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import FindTutorsPage from './components/FindTutorsPage';
import TutorProfile from './components/TutorProfile';
import StudentDashboard from './components/StudentDashboard';
import MySessions from './components/MySessions';
import SessionRoom from './components/SessionRoom';
import { CreateProfilePage } from './components/TutorProfile/index';
import { GetVerified } from './components/IdentityVerification/index';
import { StartTeachingPage } from './components/TutorProfile/ReadyToTeach/index';
import { TutorDashboard } from './components/TutorProfile/TutorDashboard/index';
import { AboutPage } from './components/About/Index';
import { Home as BecomeTutorPage } from './components/TutorProfile/Home/index';
import AdminDashboard from './components/AdminDashboard';
import TutorDetails from './components/TutorDetails';
import ProfileUnderReview from './components/ProfileUnderReview';
import SetupPayment from './components/StripeOnboarding/SetupPayment';
import OnboardingRefresh from './components/StripeOnboarding/OnboardingRefresh';
import OnboardingComplete from './components/StripeOnboarding/OnboardingComplete';
import TutorAvailability from './components/Availability/TutorAvailability';
import MessagingPage from './components/Messaging/MessagingPage';
import InterviewsPage from './components/Interviews/InterviewsPage';
import PaymentPage from './components/Payment/PaymentPage';
import PaymentSuccess from './components/Payment/PaymentSuccess';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import OnboardingStatusGuard from './components/OnboardingStatusGuard';
import { apiRequest } from './utils/api';

// Component to handle tutor status check and redirect
function TutorStatusChecker() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkTutorStatus = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          console.log('TutorStatusChecker - No user in localStorage');
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
          const updatedUser = {
            ...user,
            prospectStatus: response.status
          };
          
          // Save updated user back to localStorage
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          console.log('TutorStatusChecker - Updated localStorage with prospectStatus:', response.status);
          console.log('TutorStatusChecker - Updated user object:', updatedUser);

          // Redirect tutors based on their status
          // Only redirect from home page
          if (location.pathname === '/') {
            if (response.status === 'active') {
              navigate('/tutor-dashboard');
            } else if (response.status === 'awaiting_interview') {
              navigate('/interviews');
            }
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
      <TutorStatusChecker />
      <OnboardingStatusGuard>
        <Routes>
        {/* Public Routes - No authentication required */}
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/become-tutor" element={<Layout><BecomeTutorPage /></Layout>} />

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
          path="/payments" 
          element={
            <RoleProtectedRoute allowedRoles={['student']}>
              <Layout><PaymentPage /></Layout>
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
              <ProfileUnderReview />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="/tutor/payment-setup" 
          element={
            <RoleProtectedRoute allowedRoles={['tutor']}>
              <SetupPayment />
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
    </Router>
  );
}

export default App;
