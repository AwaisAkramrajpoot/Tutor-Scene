import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../utils/api";

const MyWalletPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [onboardingUrl, setOnboardingUrl] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOnboardingLink = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          navigate("/signin");
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user.id || user._id || user.userId;

        const response = await apiRequest(`/api/v1/onboarding/stripe-onboarding-link/${userId}`);
        const url = response.url || response.data?.url;

        if (url) {
          setOnboardingUrl(url);
        } else {
          setError("Failed to get Stripe link");
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load wallet");
      } finally {
        setLoading(false);
      }
    };

    fetchOnboardingLink();
  }, [navigate]);

  const openStripe = () => {
    if (onboardingUrl) {
      window.location.href = onboardingUrl;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-4">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-b-4 border-brand-medium-blue" />
          <p className="text-lg text-gray-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
        <h2 className="mb-2 text-center text-xl font-bold text-gray-900">Something went wrong</h2>
        <p className="mb-6 text-center text-gray-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/tutor-dashboard")}
          className="w-full rounded-lg bg-brand-medium-blue px-6 py-2 font-medium text-white shadow transition-colors hover:bg-brand-dark-blue"
        >
          Go to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-lg md:p-10">
      <div className="mb-6 flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand-gold bg-brand-light-blue">
          <svg className="h-10 w-10 text-brand-dark-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
      </div>
      <h1 className="mb-3 text-center text-3xl font-bold text-gray-900 md:text-4xl">My Wallet</h1>
      <p className="mb-8 text-center text-lg leading-relaxed text-gray-600">
        Connect your Stripe account here to receive payouts from tutoring. You will complete bank and tax
        details on Stripe’s secure site.
      </p>
      <button
        type="button"
        onClick={openStripe}
        disabled={!onboardingUrl}
        className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Open Stripe setup
      </button>
      <p className="mt-6 text-center text-sm text-gray-500">Secured by Stripe</p>
    </div>
  );
};

export default MyWalletPage;
