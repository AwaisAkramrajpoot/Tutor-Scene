import { useEffect, useState } from 'react';
import { getReferralProgramContent } from '../services/tutorReferralsService';

export const ReferralsPage = () => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getReferralProgramContent();
        setContent(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-brand-medium-blue" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-brand-deep-navy">Referrals Terms &amp; Conditions</h1>
      <p className="mt-4 text-gray-700">
        The full referrals webpage design will be added here. Until then, tutors can review the program details in the dashboard referrals pop-up.
      </p>

      {content && (
        <div className="mt-8 space-y-6 rounded-xl border border-brand-gold bg-white p-6 shadow-sm">
          <section>
            <h2 className="text-xl font-semibold text-brand-deep-navy">{content.howItWorksTitle}</h2>
            <p className="mt-2 text-gray-700">{content.howItWorksBody}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-brand-deep-navy">{content.earnTitle}</h2>
            <p className="mt-2 text-gray-700">{content.earnBody}</p>
          </section>
        </div>
      )}
    </div>
  );
};
