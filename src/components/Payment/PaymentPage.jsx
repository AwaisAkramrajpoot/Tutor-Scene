import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { apiRequest } from '../../utils/api';

// Load Stripe
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
const PaymentForm = ({ bookingId, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/${bookingId}/success`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setIsProcessing(false);
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment is secured by Stripe. You will be charged after the tutor confirms the session.
      </p>
    </form>
  );
};

// Main Payment Page Component
const PaymentPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);

  const bookingId = searchParams.get('bookingId');
  const paymentIntentId = searchParams.get('paymentIntentId');
  const amount = searchParams.get('amount');
  const pendingCredit = parseFloat(
    sessionStorage.getItem('pendingCreditApplication') || '0',
  );

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      // Validate query parameters
      if (!bookingId || !paymentIntentId || !amount) {
        setError('Missing required payment information. Please check your email link.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch client secret from backend
        const data = await apiRequest(`/api/v1/bookings/${bookingId}/payment-intent`, 'GET');
        
        if (!data.clientSecret) {
          throw new Error('Failed to initialize payment');
        }

        setClientSecret(data.clientSecret);

        // Fetch booking details
        const bookingData = await apiRequest(`/api/v1/bookings/${bookingId}`, 'GET');
        setBookingDetails(bookingData);
      } catch (err) {
        console.error('Payment initialization error:', err);
        setError(err.message || 'Failed to load payment information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentIntent();
  }, [bookingId, paymentIntentId, amount]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Payment</h1>
          <p className="text-gray-600">Secure your tutoring session</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Booking Summary */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking Reference</span>
                <span className="text-gray-900 font-medium">#{bookingDetails?.referenceNumber || bookingId}</span>
              </div>
              {bookingDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Session Date</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(bookingDetails.startTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(bookingDetails.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </>
              )}
              {pendingCredit > 0 && (
                <div className="flex justify-between text-brand-medium-blue">
                  <span className="text-gray-600">Account credits (at checkout)</span>
                  <span className="font-medium">-${pendingCredit.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">Total Amount</span>
                <span className="text-2xl font-bold text-blue-600">
                  $
                  {Math.max(parseFloat(amount || '0') - pendingCredit, 0).toFixed(2)}
                </span>
              </div>
              {pendingCredit > 0 && (
                <p className="text-xs text-gray-500">
                  Credits from{' '}
                  <a href="/credits-referrals" className="text-brand-medium-blue underline">
                    Credits / Referrals
                  </a>{' '}
                  will be applied when backend credit redemption is enabled for this booking.
                </p>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Details</h2>
            {clientSecret && (
              <Elements stripe={stripePromise} options={options}>
                <PaymentForm bookingId={bookingId} amount={amount} />
              </Elements>
            )}
          </div>

          {/* Test Card Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">Test Card Information:</p>
            <p className="text-xs text-blue-700">Card: 4242 4242 4242 4242</p>
            <p className="text-xs text-blue-700">Expiry: Any future date | CVC: Any 3 digits | ZIP: Any 5 digits</p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center text-sm text-gray-500">
            <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secured by Stripe
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
