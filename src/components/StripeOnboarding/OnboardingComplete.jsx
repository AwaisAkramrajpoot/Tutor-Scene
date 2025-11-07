import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OnboardingComplete = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/tutor-dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const handleGoToDashboard = () => {
    navigate('/tutor-dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12">
        {/* Success Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
          🎉 Welcome to Tutor Scene!
        </h1>

        {/* Message */}
        <p className="text-lg text-gray-600 text-center mb-8 leading-relaxed">
          Congratulations! Your payment account has been successfully set up. 
          You're now ready to start accepting students and earning money through our platform.
        </p>

        {/* Success Info Box */}
        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-semibold text-green-900 mb-2">What's next?</h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Access your tutor dashboard to manage your profile</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Set your availability and start accepting bookings</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Connect with students and begin teaching sessions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Receive payments directly to your bank account</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Dashboard Button */}
        <button
          onClick={handleGoToDashboard}
          className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all shadow-lg hover:shadow-xl mb-4"
        >
          Go to Dashboard
        </button>

        {/* Auto-redirect message */}
        <p className="text-center text-sm text-gray-500">
          Redirecting automatically in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  );
};

export default OnboardingComplete;
