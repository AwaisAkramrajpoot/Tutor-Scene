import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const SetupPayment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOnboardingLink = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          navigate('/signin');
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user._id || user.userId;

        const response = await apiRequest(`/api/v1/onboarding/stripe-onboarding-link/${userId}`);
        const url = response.url || response.data?.url;
        
        if (url) {
          setOnboardingUrl(url);
        } else {
          setError('Failed to get onboarding link');
        }
      } catch (err) {
        console.error('Error fetching onboarding link:', err);
        setError(err.message || 'Failed to load payment setup');
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingLink();
  }, [navigate]);

  const handleSetupNow = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Loading payment setup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/tutor-dashboard')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          Setup Your Payment Account
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 text-center mb-8 leading-relaxed">
          Before you can start accepting students and receiving payments, you need to set up your Stripe payment account. 
          This is a quick and secure process that ensures you get paid for your tutoring sessions.
        </p>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">What you'll need:</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Bank account details for receiving payments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Government-issued ID for verification</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Tax information (SSN or EIN)</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>About 5-10 minutes to complete the process</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center mb-8 text-sm text-gray-600">
          <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Secured by Stripe - Your information is safe and encrypted</span>
        </div>

        {/* Setup Button */}
        <button
          onClick={handleSetupNow}
          disabled={!onboardingUrl}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Setup Now
        </button>

        {/* Skip Note */}
        <p className="text-center text-sm text-gray-500 mt-6">
          You must complete this step before you can start teaching
        </p>
      </div>
    </div>
  );
};

export default SetupPayment;
