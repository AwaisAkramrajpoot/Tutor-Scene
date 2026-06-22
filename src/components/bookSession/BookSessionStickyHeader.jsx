import { resolveApiAssetUrl } from '../../utils/api';
import { tutorFirstName } from '../../utils/tutorLearnerDisplay';

const NAVBAR_OFFSET = '4.25rem';
const RIBBON_HEIGHT = '4rem';

const ArrowLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export const BOOKING_STEPS = [
  { id: 1, label: 'Select Dates & Times', shortLabel: 'Dates' },
  { id: 2, label: 'Review Selections', shortLabel: 'Review' },
  { id: 3, label: 'Upload Materials', shortLabel: 'Materials' },
  { id: 4, label: 'Review Your Booking', shortLabel: 'Confirm' },
];

export const BookSessionStickyRibbon = ({ onBack }) => (
  <>
    <div
      className="fixed left-0 right-0 z-40 bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white shadow-md"
      style={{ top: NAVBAR_OFFSET, height: RIBBON_HEIGHT }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center border-0 bg-transparent p-0 text-base font-medium text-white transition-colors hover:text-brand-gold"
        >
          <ArrowLeftIcon className="mr-2 shrink-0" />
          Back to Search
        </button>
      </div>
    </div>
    <div aria-hidden style={{ height: RIBBON_HEIGHT }} className="shrink-0" />
  </>
);

export const BookSessionBookingHero = ({
  tutorName,
  profilePhotoUrl,
  subjectDisplayLine,
  currentStep = 1,
}) => {
  const displayFirst = tutorFirstName(tutorName);

  return (
    <div className="relative bg-[#f5f7fa]">
      <div
        className="relative w-full bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue"
        style={{ height: '136px' }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-0 right-0 bg-[#f5f7fa]"
        style={{
          top: '92px',
          height: '120px',
          borderTopLeftRadius: '50% 100px',
          borderTopRightRadius: '50% 100px',
        }}
        aria-hidden
      />

      <div
        className="relative z-10 flex justify-center"
        style={{ marginTop: '-80px', paddingBottom: '12px' }}
      >
        <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
          <img
            src={
              resolveApiAssetUrl(profilePhotoUrl) ||
              'https://placehold.co/144x144/E0E0E0/333333?text=Tutor'
            }
            alt={displayFirst}
            className="h-32 w-32 rounded-full object-cover"
          />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-3 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{displayFirst}</h1>
        {subjectDisplayLine ? (
          <p className="mx-auto mt-1 max-w-3xl text-sm font-medium leading-snug text-brand-medium-blue sm:text-base">
            {subjectDisplayLine}
          </p>
        ) : null}
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 pb-6">
        <nav
          className="flex items-stretch justify-between gap-0.5 rounded-2xl border border-white/10 bg-[#1e3a8a] p-1.5 shadow-lg sm:gap-1 sm:p-2"
          aria-label="Booking progress"
        >
          {BOOKING_STEPS.map((step) => {
            const isActive = step.id === currentStep;
            const isPast = step.id < currentStep;
            return (
              <div
                key={step.id}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 sm:flex-row sm:gap-2 sm:px-2 ${
                  isActive ? 'bg-white/10' : ''
                } ${isActive ? '' : 'opacity-70'}`}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm ${
                    isActive
                      ? 'bg-white text-[#1e3a8a]'
                      : isPast
                        ? 'bg-white/35 text-white'
                        : 'bg-white/20 text-white/90'
                  }`}
                >
                  {step.id}
                </span>
                <span
                  className={`min-w-0 text-center text-[10px] font-semibold leading-tight sm:text-left sm:text-xs ${
                    isActive ? 'text-white' : 'text-white/85'
                  }`}
                >
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden truncate sm:inline">{step.label}</span>
                </span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

const BookSessionStickyHeader = (props) => (
  <>
    <BookSessionStickyRibbon onBack={props.onBack} />
    <BookSessionBookingHero
      tutorName={props.tutorName}
      profilePhotoUrl={props.profilePhotoUrl}
      subjectDisplayLine={props.subjectDisplayLine}
      currentStep={props.currentStep}
    />
  </>
);

export default BookSessionStickyHeader;
