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
        <Route path="/about" element={<Layout><AboutPage /></Layout>} />
        <Route path="/become-tutor" element={<Layout><BecomeTutorPage /></Layout>} />
        <Route path="/admin-dashboard" element={<Layout><AdminDashboard /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
