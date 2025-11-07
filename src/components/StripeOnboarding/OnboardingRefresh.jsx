import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingRefresh = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect back to setup payment page
    const timer = setTimeout(() => {
      navigate('/tutor/payment-setup');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Refreshing Setup
        </h2>
        <p className="text-gray-600 mb-6">
          Taking you back to complete your payment setup...
        </p>
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    </div>
  );
};

export default OnboardingRefresh;
