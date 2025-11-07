import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Layout><StudentDashboard /></Layout>} />
        <Route path="/find-tutors" element={<Layout><FindTutorsPage /></Layout>} />
        <Route path="/tutor/:id" element={<Layout><TutorProfile /></Layout>} />
        <Route path="/my-sessions" element={<Layout><MySessions /></Layout>} />
        <Route path="/session/:id" element={<Layout><SessionRoom /></Layout>} />
        <Route path="/create-profile" element={<Layout><CreateProfilePage /></Layout>} />
        <Route path="/verify-identity" element={<Layout><GetVerified /></Layout>} />
        <Route path="/ready-to-teach" element={<Layout><StartTeachingPage /></Layout>} />
        <Route path="/tutor-dashboard" element={<Layout><TutorDashboard /></Layout>} />
        <Route path="/profile-under-review" element={<ProfileUnderReview />} />
        <Route path="/tutor/payment-setup" element={<SetupPayment />} />
        <Route path="/tutor/onboarding/refresh" element={<OnboardingRefresh />} />
        <Route path="/tutor/onboarding/complete" element={<OnboardingComplete />} />
        <Route path="/tutor/availability" element={<Layout><TutorAvailability /></Layout>} />
        <Route path="/interviews" element={<Layout><InterviewsPage /></Layout>} />
        <Route path="/payments" element={<Layout><PaymentPage /></Layout>} />
        <Route path="/bookings/:id/success" element={<Layout><PaymentSuccess /></Layout>} />
        <Route path="/messages" element={<Layout><MessagingPage /></Layout>} />
        <Route path="/messages/:conversationId" element={<Layout><MessagingPage /></Layout>} />
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/become-tutor" element={<Layout><BecomeTutorPage /></Layout>} />
        <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
        <Route path="/admin/tutor/:id" element={<Layout><TutorDetails /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
