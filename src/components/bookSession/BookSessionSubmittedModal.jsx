const BookSessionSubmittedModal = ({ open, tutorName, onClose }) => {
  if (!open) return null;

  const displayTutor = tutorName || 'your tutor';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-submitted-title"
      >
        <div className="bg-brand-medium-blue px-6 py-4">
          <h2
            id="booking-submitted-title"
            className="text-lg font-bold text-white"
          >
            Request Submitted — Pending Tutor Approval
          </h2>
        </div>
        <div className="space-y-4 px-6 py-5 text-sm text-gray-700">
          <p>
            Your booking request has been sent to <strong>{displayTutor}</strong> and to
            you via email.
          </p>
          <div>
            <p className="font-semibold text-gray-900">Here&apos;s what happens next:</p>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                <strong>No charge yet.</strong> Your payment will only be processed after
                the tutor accepts your requested session(s).
              </li>
              <li>
                <strong>Tutor review.</strong> The tutor will review your selections and
                follow up if needed.
              </li>
            </ol>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-lg bg-brand-medium-blue py-3 text-sm font-semibold text-white hover:bg-brand-dark-blue"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookSessionSubmittedModal;
