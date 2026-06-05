import { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getTutorEarningsHistory,
  getStripeDashboardLink,
  getStripeOnboardingLink,
} from '../../services/tutorEarningsService';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
};

const formatTime = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const openStripeInNewTab = (url) => {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const MyWalletPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [sort, setSort] = useState('newest');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [stripeBusy, setStripeBusy] = useState(false);

  const loadEarnings = useCallback(async (uid) => {
    try {
      setLoading(true);
      const data = await getTutorEarningsHistory(uid, {
        sort,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
      });
      setEarnings(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [sort, statusFilter, paymentStatusFilter]);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/signin');
      return;
    }
    const user = JSON.parse(userStr);
    const id = user.id || user.userId;
    setUserId(id);
    loadEarnings(id);
  }, [navigate, loadEarnings]);

  const handleConnectStripe = async () => {
    if (!userId) return;
    setStripeBusy(true);
    try {
      const res = await getStripeOnboardingLink(userId);
      openStripeInNewTab(res.url || res.data?.url);
    } catch (err) {
      setError(err.message || 'Could not open Stripe setup');
    } finally {
      setStripeBusy(false);
    }
  };

  const handleOpenStripeDashboard = async () => {
    if (!userId) return;
    setStripeBusy(true);
    try {
      const res = await getStripeDashboardLink(userId);
      openStripeInNewTab(res.url || res.data?.url);
    } catch (err) {
      setError(err.message || 'Could not open Stripe. Complete Connect setup first.');
    } finally {
      setStripeBusy(false);
    }
  };

  const rows = earnings?.transactions || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-dark-blue">Payouts &amp; Earnings</h1>
      <Link to="/tutor-dashboard" className="text-sm text-brand-medium-blue hover:underline">
        View details
      </Link>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Available Balance</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark-blue">
            {formatMoney(earnings?.availableBalance)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Cleared funds ready for withdrawal. Updated after lesson completion.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-600">Pending Balance</p>
          <p className="mt-1 text-2xl font-bold text-brand-dark-blue">
            {formatMoney(earnings?.pendingBalance)}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Sessions completed but funds not yet released.
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-brand-dark-blue">Earnings Breakdown</h2>
        <p className="mt-1 text-sm text-gray-600">
          Each transaction includes date &amp; time, session ID, learner ID, base pay, tips, total,
          and status.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={stripeBusy}
            onClick={handleOpenStripeDashboard}
            className="rounded-lg bg-brand-medium-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark-blue disabled:opacity-50"
          >
            Connect to Stripe
          </button>
          <button
            type="button"
            disabled={stripeBusy}
            onClick={handleConnectStripe}
            className="rounded-lg border border-brand-medium-blue px-5 py-2.5 text-sm font-medium text-brand-medium-blue hover:bg-brand-light-blue/20 disabled:opacity-50"
          >
            Stripe setup
          </button>
        </div>
        <p className="mt-3 text-sm text-gray-600">
          To access available earnings or see payout details, sign into your Stripe account. Stripe
          opens in a new tab — you stay signed in on Tutor Scene until you choose Logout.
        </p>
      </section>

      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-brand-dark-blue">Session(s) History</h2>
          <div className="flex flex-wrap gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="newest">Sort: Newest</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">Filter: All sessions</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">Status: All</option>
              <option value="pending">Pending</option>
              <option value="cleared">Cleared</option>
              <option value="paid_out">Paid out</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-medium-blue" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-300 text-left text-gray-600">
                  <th className="py-3 pr-4 font-semibold">Date/Time</th>
                  <th className="py-3 pr-4 font-semibold">Session ID</th>
                  <th className="py-3 pr-4 font-semibold">Learner ID</th>
                  <th className="py-3 pr-4 font-semibold">Session Base Pay</th>
                  <th className="py-3 pr-4 font-semibold">Session Tips</th>
                  <th className="py-3 pr-4 font-semibold">Session Total</th>
                  <th className="py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No sessions match this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-200">
                      <td className="py-4 pr-4 whitespace-nowrap">
                        <span className="block">{formatDate(row.dateTime)}</span>
                        <span className="text-xs text-gray-500">{formatTime(row.dateTime)}</span>
                      </td>
                      <td className="py-4 pr-4">{row.sessionId}</td>
                      <td className="py-4 pr-4">{row.learnerId}</td>
                      <td className="py-4 pr-4">{formatMoney(row.sessionBasePay)}</td>
                      <td className="py-4 pr-4">{formatMoney(row.sessionTips)}</td>
                      <td className="py-4 pr-4 font-medium">{formatMoney(row.sessionTotal)}</td>
                      <td className="py-4 capitalize">{row.status?.replace('_', ' ')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyWalletPage;
