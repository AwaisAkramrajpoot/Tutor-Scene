import { formatSessionShort, sortSessions } from '../../utils/bookSessionSessionUtils';

const GoldCheck = () => (
  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-white">
    ✓
  </span>
);

const BookSessionSelectedSessionsPanel = ({
  sessions,
  subjectLine,
  activeSessionId,
  onSelectSession,
  onRemoveSession,
  onConfirmSelections,
  showConfirmButton = true,
  compact = false,
}) => {
  const sorted = sortSessions(sessions);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      {subjectLine && (
        <p className="mb-2 line-clamp-2 text-xs font-medium leading-snug text-brand-medium-blue">
          {subjectLine}
        </p>
      )}
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Selected Sessions</h3>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">
          Select a time on the calendar, then add session details.
        </p>
      ) : (
        <ul className={`space-y-2 ${compact ? '' : 'mb-4'}`}>
          {sorted.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <li key={session.id}>
                <div
                  className={`flex items-start gap-2 rounded-lg border p-3 transition ${
                    isActive
                      ? 'border-brand-gold bg-amber-50'
                      : 'border-gray-200 bg-white hover:border-brand-light-blue hover:bg-blue-50/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(session)}
                    className="flex min-w-0 flex-1 items-start gap-2 border-0 bg-transparent p-0 text-left"
                  >
                    <GoldCheck />
                    <span className="text-sm text-gray-800">
                      <span className="font-medium">{session.learnerLabel}</span>
                      {' — '}
                      {formatSessionShort(session.start, session.end)}
                      {session.recurring ? (
                        <span className="ml-1 font-semibold text-brand-medium-blue">
                          (Recurring)
                        </span>
                      ) : null}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSession(session);
                    }}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white hover:bg-red-600"
                    aria-label="Remove session"
                    title="Remove session"
                  >
                    ×
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showConfirmButton && sorted.length > 0 && (
        <button
          type="button"
          onClick={onConfirmSelections}
          className="mt-2 w-full rounded-lg bg-brand-medium-blue px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-dark-blue"
        >
          Confirm Selections
        </button>
      )}
    </div>
  );
};

export default BookSessionSelectedSessionsPanel;
