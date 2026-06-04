import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCreditsReferrals, applyReferralCode } from '../../services/studentCreditsService';

const formatMoney = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n) || 0);

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
};

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-green-700 text-sm font-medium">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs">
          ✓
        </span>
        Completed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-amber-700 text-sm font-medium">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs">
        ⏳
      </span>
      In Progress
    </span>
  );
};

const CopyIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);

const SidebarCard = ({ children, className = '' }) => (
  <div
    className={`rounded-2xl p-6 text-white shadow-lg ${className}`}
    style={{
      background: 'linear-gradient(180deg, #2A66B8 0%, #1F57A2 55%, #01519A 100%)',
    }}
  >
    {children}
  </div>
);

const CreditsReferralsPage = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const credits = await getCreditsReferrals();
      setData(credits);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load credits and referrals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleApplyReferral = async () => {
    if (!referralInput.trim()) return;
    setApplying(true);
    try {
      const updated = await applyReferralCode(referralInput.trim());
      setData(updated);
      setReferralInput('');
      setError(null);
    } catch (e) {
      setError(e.message || 'Invalid referral code');
    } finally {
      setApplying(false);
    }
  };

  const copyText = async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('');
    }
  };

  const goToCheckoutWithCredits = () => {
    sessionStorage.setItem('applyAvailableCredits', 'true');
    sessionStorage.setItem(
      'availableCreditsBalance',
      String(data?.availableCredits ?? 0),
    );
    navigate('/book-session');
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-medium-blue" />
      </div>
    );
  }

  const history = data?.referralHistory || [];
  const summary = data?.referralSummary || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900">Credits / Referrals</h1>
      <Link to="/dashboard" className="text-sm text-brand-medium-blue hover:underline">
        View details
      </Link>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 text-sm">
                  ✓
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Available Balance</p>
                  <p className="mt-1 text-2xl font-bold text-brand-dark-blue">
                    {formatMoney(data?.availableBalance ?? data?.availableCredits)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Cleared funds ready for use. Updated after lesson completion, cancellation
                    credits, and referral rewards.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 text-sm">
                  ⏳
                </span>
                <div>
                  <p className="font-semibold text-gray-900">Pending Balance</p>
                  <p className="mt-1 text-2xl font-bold text-brand-dark-blue">
                    {formatMoney(data?.pendingBalance)}
                  </p>
                  <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                    Sessions completed or cancelled within the grace period — funds not yet added
                    to Available Credits.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Credits</h2>
            <button
              type="button"
              onClick={goToCheckoutWithCredits}
              className="flex w-full items-center justify-between rounded-lg border-2 border-gray-200 bg-gray-50 px-5 py-4 text-left transition-colors hover:border-brand-medium-blue hover:bg-brand-light-blue/10"
            >
              <span className="font-medium text-gray-800">Available Credits</span>
              <span className="text-2xl font-bold text-brand-dark-blue">
                {formatMoney(data?.availableCredits)}
              </span>
            </button>
            <p className="mt-3 text-sm text-gray-600">
              Credits include amounts from sessions cancelled within the specified grace period and
              referral rewards. Tap Available Credits to book a session and apply your balance at
              checkout.
            </p>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Referrals</h2>
            <p className="text-sm text-gray-700 mb-3">Were you referred to Tutor Scene?</p>
            {data?.referredByApplied ? (
              <p className="text-sm font-medium text-green-700">Referral code already applied.</p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  placeholder="Enter code here"
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm"
                />
                <button
                  type="button"
                  disabled={applying}
                  onClick={handleApplyReferral}
                  className="rounded-lg bg-brand-medium-blue px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark-blue disabled:opacity-50"
                >
                  {applying ? 'Applying…' : 'Apply'}
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Referrals Reward System</h2>
            <div className="rounded-xl border border-brand-light-blue bg-brand-light-blue/25 p-5">
              <h3 className="text-lg font-bold text-brand-dark-blue mb-4">How It Works</h3>
              <ol className="list-decimal list-inside space-y-3 text-sm text-gray-800">
                <li>
                  <span className="font-semibold">Share Your Code: </span>
                  Share your unique referral code or referral link with future learners on social
                  media or anywhere.
                </li>
                <li>
                  <span className="font-semibold">Earn $5 Per Referral: </span>
                  When someone signs up using your code and completes their first session, you
                  receive a $5 reward.
                </li>
                <li>
                  <span className="font-semibold">Rewards equal Credits: </span>
                  Rewards are added to your Available Credits.
                </li>
              </ol>
              <p className="mt-4 text-sm font-semibold text-brand-medium-blue">
                Earn $5 for every referral that completes their first session!
              </p>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Referrals History</h3>
              {history.length > 3 && (
                <button
                  type="button"
                  className="text-sm font-medium text-brand-medium-blue hover:underline"
                  onClick={() =>
                    document.getElementById('referrals-history-table')?.scrollIntoView({
                      behavior: 'smooth',
                    })
                  }
                >
                  View more &gt;
                </button>
              )}
            </div>
            <div id="referrals-history-table" className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-300 text-left text-gray-600">
                    <th className="py-3 pr-4 font-semibold">Date &amp; Time</th>
                    <th className="py-3 pr-4 font-semibold">Subject</th>
                    <th className="py-3 pr-4 font-semibold">Session ID</th>
                    <th className="py-3 pr-4 font-semibold">Learner ID</th>
                    <th className="py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No referrals yet. Share your code to get started.
                      </td>
                    </tr>
                  ) : (
                    history.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-4 pr-4 whitespace-nowrap">{formatDateTime(row.dateTime)}</td>
                        <td className="py-4 pr-4">{row.subject}</td>
                        <td className="py-4 pr-4">{row.sessionId || '—'}</td>
                        <td className="py-4 pr-4">{row.learnerName}</td>
                        <td className="py-4">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <SidebarCard>
            <h3 className="text-lg font-bold mb-4">Share Your Referral Code</h3>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/15 px-4 py-3">
              <span className="text-2xl font-bold tracking-widest text-[#E8B020]">
                {data?.referralCode || '—'}
              </span>
              <button
                type="button"
                onClick={() => copyText(data?.referralCode, 'code')}
                className="rounded-lg p-1.5 text-white/90 hover:bg-white/10"
                title="Copy code"
                aria-label="Copy referral code"
              >
                <CopyIcon />
                {copied === 'code' && (
                  <span className="sr-only">Copied</span>
                )}
              </button>
            </div>
            {copied === 'code' && (
              <p className="mt-1 text-xs text-white/80">Copied!</p>
            )}
            <p className="mt-5 text-sm font-medium text-white/90">Your Referral Link</p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={data?.referralLink || ''}
                className="min-w-0 flex-1 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => copyText(data?.referralLink, 'link')}
                className="shrink-0 text-xs font-semibold underline text-white"
              >
                {copied === 'link' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </SidebarCard>

          <SidebarCard>
            <h3 className="text-lg font-bold mb-4">Referrals History</h3>
            <ul className="space-y-4">
              {summary.length === 0 ? (
                <li className="text-sm text-white/75">No referrals yet.</li>
              ) : (
                summary.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <p className="text-xs text-white/75">{formatDate(r.date)}</p>
                    </div>
                    <span
                      className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-bold ${
                        (r.status || '').toLowerCase() === 'completed'
                          ? 'bg-[#E8B020] text-[#1a1a1a]'
                          : (r.status || '').toLowerCase() === 'in_progress'
                            ? 'bg-amber-300 text-amber-900'
                            : 'bg-green-400 text-green-900'
                      }`}
                    >
                      {(r.status || '').toLowerCase() === 'completed'
                        ? '✓'
                        : (r.status || '').toLowerCase() === 'in_progress'
                          ? '1'
                          : '0'}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
};

export default CreditsReferralsPage;
