import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTutorReferralProgram } from '../../../services/tutorReferralsService';

const CopyIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CopyButton = ({ value, label, copied, onCopy }) => {
  const isCopied = copied;

  return (
    <button
      type="button"
      onClick={() => onCopy(value)}
      className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 transition-all duration-200 ${
        isCopied
          ? 'bg-brand-gold/15 text-brand-gold'
          : 'text-brand-medium-blue hover:bg-brand-light-blue/40 hover:text-brand-dark-blue'
      }`}
      aria-label={isCopied ? `${label} copied` : `Copy ${label}`}
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
      <span className={`text-xs font-semibold ${isCopied ? 'opacity-100' : 'sr-only'}`}>
        Copied!
      </span>
    </button>
  );
};

const StatBar = ({ label, count, tone }) => {
  const toneClass =
    tone === 'completed'
      ? 'bg-brand-gold text-white'
      : tone === 'inProgress'
        ? 'bg-brand-medium-blue text-white'
        : 'bg-brand-light-blue text-brand-deep-navy';

  return (
    <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${toneClass}`}>
      <div className="flex items-center gap-2">
        {tone === 'completed' ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <span className="font-medium">{count}</span>
        <span>{label}</span>
      </div>
    </div>
  );
};

const copyToClipboard = async (value) => {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch (_) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
};

export const TutorReferralsModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (!open) {
      setCopiedField(null);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const response = await getTutorReferralProgram();
        setData(response);
      } catch (error) {
        console.error('Failed to load referral program:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open]);

  useEffect(() => {
    if (!copiedField) return undefined;
    const timer = setTimeout(() => setCopiedField(null), 2000);
    return () => clearTimeout(timer);
  }, [copiedField]);

  const handleCopy = async (field, value) => {
    const success = await copyToClipboard(value);
    if (success) {
      setCopiedField(field);
    }
  };

  if (!open) return null;

  const content = data?.content || {};
  const counts = data?.counts || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-2xl font-semibold text-brand-deep-navy">Tutor Scene Referrals Program</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-brand-medium-blue" />
          </div>
        ) : (
          <div className="grid gap-6 p-6 lg:grid-cols-3">
            <div className="space-y-6">
              <section className="rounded-xl border-2 border-brand-gold p-5">
                <h3 className="text-xl font-semibold text-brand-deep-navy">{content.howItWorksTitle}</h3>
                <p className="mt-2 font-medium text-brand-medium-blue">{content.howItWorksSubtitle}</p>
                <p className="mt-3 text-sm italic text-gray-700">{content.howItWorksBody}</p>
              </section>

              <section className="rounded-xl border-2 border-brand-gold p-5">
                <h3 className="text-xl font-semibold text-brand-deep-navy">{content.earnTitle}</h3>
                <p className="mt-3 text-sm italic text-gray-700">{content.earnBody}</p>
              </section>
            </div>

            <section className="rounded-xl border-2 border-brand-gold p-5">
              <h3 className="text-xl font-semibold text-brand-deep-navy">{content.referralsTitle}</h3>
              <p className="mt-1 text-sm text-brand-medium-blue">{content.referralsSubtitle}</p>

              <div className="mt-6 rounded-xl bg-gray-100 p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-medium-blue">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-semibold text-brand-deep-navy">{counts.totalReferrals ?? 0}</div>
                <div className="text-sm text-gray-600">Total Referrals</div>
              </div>

              <div className="mt-4 space-y-3">
                <StatBar label="Pending" count={counts.pending ?? 0} tone="pending" />
                <StatBar label="In Progress" count={counts.inProgress ?? 0} tone="inProgress" />
                <StatBar label="Completed" count={counts.completed ?? 0} tone="completed" />
              </div>
            </section>

            <section className="rounded-xl border-2 border-brand-gold p-5">
              <h3 className="text-xl font-semibold text-brand-deep-navy">{content.referralCodeTitle}</h3>

              <div
                className={`mt-4 flex items-center justify-between rounded-lg border bg-gray-50 px-4 py-3 transition-colors duration-200 ${
                  copiedField === 'code' ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-200'
                }`}
              >
                <span className="text-2xl font-semibold tracking-wide text-brand-gold">{data?.referralCode || '—'}</span>
                <CopyButton
                  value={data?.referralCode || ''}
                  label="referral code"
                  copied={copiedField === 'code'}
                  onCopy={(value) => handleCopy('code', value)}
                />
              </div>

              <p className="mt-5 text-sm font-medium text-brand-deep-navy">{content.referralLinkTitle}</p>
              <div
                className={`mt-2 flex items-center justify-between gap-2 rounded-lg border bg-gray-50 px-3 py-3 transition-colors duration-200 ${
                  copiedField === 'link' ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-200'
                }`}
              >
                <span className="truncate text-sm text-brand-medium-blue">{data?.referralLink || ''}</span>
                <CopyButton
                  value={data?.referralLink || ''}
                  label="referral link"
                  copied={copiedField === 'link'}
                  onCopy={(value) => handleCopy('link', value)}
                />
              </div>

              <p className="mt-4 text-sm italic text-gray-600">{content.referralShareHint}</p>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(content.termsUrl || '/referrals');
                }}
                className="mt-6 w-full rounded-lg bg-brand-medium-blue px-4 py-3 font-medium text-white transition-colors hover:bg-brand-dark-blue"
              >
                Referrals Terms &amp; Conditions
              </button>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
