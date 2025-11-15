import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../utils/api';

const ProfileUnderReview = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/signin');
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(to bottom right, #e3f2fd, #bbdefb)' }}>
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e3f2fd' }}>
            <svg className="w-12 h-12" style={{ color: '#1464AE' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Profile Under Review
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 text-center mb-8 leading-relaxed">
          Thank you for submitting your tutor profile! Our team is currently reviewing your application 
          to ensure the highest quality standards for our platform.
        </p>

        {/* Info Box */}
        <div className="p-6 mb-8 rounded-r-lg" style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #1464AE' }}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" style={{ color: '#1464AE' }} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold mb-2" style={{ color: '#1464AE' }}>What happens next?</h3>
              <ul className="text-sm space-y-2" style={{ color: '#1464AE' }}>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Our team will review your profile, credentials, and submitted documents</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>This process typically takes 24-48 hours</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>You'll receive an email notification once your profile is approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>After approval, you can start accepting students and teaching sessions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="text-center mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Have questions or need to update your information?
          </p>
          <a 
            href="mailto:support@tutorscene.com" 
            className="inline-flex items-center font-medium hover:opacity-80 transition-opacity"
            style={{ color: '#1464AE' }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Contact Support
          </a>
        </div>

        {/* Logout Button */}
        <div className="text-center pt-6 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="text-gray-600 hover:text-gray-900 font-medium text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileUnderReview;
