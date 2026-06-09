import { useMemo, useState, useEffect } from 'react';
import LearnerAssessmentModal from './LearnerAssessmentModal';
import { showSystemMessage } from '../../utils/systemMessage';

const ChevronDownIcon = ({ collapsed }) => (
  <svg
    className={`w-5 h-5 text-white transition-transform duration-300 ${
      collapsed ? 'rotate-180' : ''
    }`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);

const STEP_CARDS = [
  {
    title: 'Complete Assessment',
    desc: 'Take a quick survey to help find your match',
  },
  {
    title: 'Check Availability',
    desc: 'View tutor calendars and compare times',
  },
  {
    title: 'Get Scheduled',
    desc: 'Request a date and time to secure your session',
  },
];

const STATEMENT =
  'Take the guesswork out of finding the perfect Tutor. Our custom survey matches you with a tutor whose expertise and teaching style align with your goals.';

const POPUP_WARNING =
  'Please ensure pop-up blockers are turned off before launching the Learner Assessment.';

const SECTION_TITLE = 'Get Matched in 3 Easy Steps';

const BookSessionStepsSection = ({ embedded = false }) => {
  const [bookSessionStepsOpen, setBookSessionStepsOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedLearnerLabel, setSelectedLearnerLabel] = useState('');
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const learnerChoices = useMemo(() => {
    if (!user) return [];
    const n = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const account = n || 'Account holder';
    return [account, 'Emma', 'Jack', 'Sarah', 'Michael'];
  }, [user]);

  const inner = (
    <>
      {bookSessionStepsOpen ? (
        <>
          <button
            type="button"
            className="mb-4 flex w-full cursor-pointer items-center justify-center gap-3 text-left select-none"
            onClick={() => setBookSessionStepsOpen(false)}
          >
            <div className="min-w-[1rem] flex-1 border-t border-white/40" />
            <h2 className="shrink-0 px-2 text-center text-xl font-semibold text-white sm:text-2xl">
              {SECTION_TITLE}
            </h2>
            <ChevronDownIcon collapsed={bookSessionStepsOpen} />
            <div className="min-w-[1rem] flex-1 border-t border-white/40" />
          </button>

          <div className="mb-6 rounded-lg bg-black/15 px-4 py-3 sm:px-5">
            <p className="text-center text-sm leading-relaxed text-white sm:text-base">
              {STATEMENT}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {STEP_CARDS.map((step, i) => (
              <div
                key={step.title}
                className="relative rounded-xl bg-white p-8 pt-9 text-center shadow-md sm:p-10"
              >
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white font-bold text-brand-medium-blue shadow">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-base font-bold text-brand-dark-blue sm:text-lg">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-snug text-gray-600 sm:text-base">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setBookSessionStepsOpen(true)}
          aria-label={`Expand ${SECTION_TITLE}`}
          className="flex w-full items-center justify-center rounded-lg bg-white/10 py-2 text-white transition-colors hover:bg-white/20"
        >
          <span className="inline-block -rotate-90">
            <ChevronDownIcon collapsed={false} />
          </span>
        </button>
      )}

      <>
        <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-950 sm:text-sm">
          {POPUP_WARNING}
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-md sm:p-6">
          <h3 className="text-lg font-bold text-brand-dark-blue">
            {SECTION_TITLE}
          </h3>
            <p className="mt-2 text-sm text-gray-600">
              Start the assessment to match the learner with tutors based on
              subject needs and learning style.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-800">
                  Select Learner:
                </label>
                <select
                  className="w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                  value={selectedLearnerLabel}
                  onChange={(e) => setSelectedLearnerLabel(e.target.value)}
                >
                  <option value="">Choose learner</option>
                  {learnerChoices.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!selectedLearnerLabel) {
                    showSystemMessage({ message: 'Please select a learner before starting.', type: 'warning' });
                    return;
                  }
                  setAssessmentOpen(true);
                }}
                className="shrink-0 rounded-lg bg-brand-medium-blue px-6 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-dark-blue"
              >
                Launch Assessment
              </button>
            </div>
          </div>
      </>

      <LearnerAssessmentModal
        open={assessmentOpen}
        onClose={() => setAssessmentOpen(false)}
        learnerLabel={selectedLearnerLabel}
        learnerChoices={learnerChoices}
        onLearnerLabelChange={setSelectedLearnerLabel}
      />
    </>
  );

  if (embedded) {
    return <div className="max-w-[980px] mx-auto px-4 sm:px-6 lg:px-8 pb-10">{inner}</div>;
  }

  return (
    <div className="w-full bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white">
      <div className="max-w-5xl mx-auto px-4 pb-10 pt-8 sm:px-6 lg:px-8">{inner}</div>
    </div>
  );
};

export default BookSessionStepsSection;
