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
      </Routes>
    </Router>
  );
}

export default App;
