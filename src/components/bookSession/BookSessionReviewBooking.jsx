import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  sessionDurationHours,
  sortSessions,
} from '../../utils/bookSessionSessionUtils';

const ADD_LEARNER_VALUE = '__add_learner__';

function formatLearnerLabel(learnerLabel, learnerProfiles) {
  const profile = learnerProfiles.find((l) => l.learnerLabel === learnerLabel);
  const grade = profile?.gradeLevel ? ` — Grade ${profile.gradeLevel}` : '';
  return `${learnerLabel}${grade}`;
}

function sessionMaterialStatus(session) {
  const hasFiles = (session.materials?.files || []).length > 0;
  const hasComments = Boolean(session.materials?.comments?.trim());
  if (hasFiles) return { label: 'Materials Uploaded', ok: true };
  if (hasComments) return { label: 'Comments Added', ok: true };
  return { label: 'No files uploaded yet', ok: false };
}

function formatSessionLine(start, end) {
  const d = new Date(start);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const startT = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const durationMins = Math.round(sessionDurationHours(start, end) * 60);
  return `${datePart} — ${startT} • ${durationMins} minutes`;
}

const SubjectSection = ({
  subjectName,
  sessions,
  hourlyRate,
  serviceFeePerSession,
  collapsed,
  onToggle,
  onEditSessions,
  expandedSessionId,
  onToggleSessionsList,
}) => {
  const subjectTotal = sessions.reduce((sum, s) => {
    const hours = sessionDurationHours(s.start, s.end);
    return sum + hourlyRate * hours + serviceFeePerSession;
  }, 0);

  const sessionCount = sessions.length;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left hover:bg-gray-50"
      >
        <span className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="text-lg" aria-hidden="true">
            {collapsed ? '▸' : '▾'}
          </span>
          {subjectName}
        </span>
        <span className="shrink-0 font-bold text-gray-900">
          ${subjectTotal.toFixed(2)}
        </span>
      </button>

      {!collapsed && (
        <div className="border-t border-gray-100 px-4 pb-4">
          <div className="flex items-center justify-between py-3">
            <button
              type="button"
              onClick={onToggleSessionsList}
              className="text-sm font-medium text-brand-medium-blue hover:underline"
            >
              {sessionCount} Session{sessionCount !== 1 ? 's' : ''} Scheduled
              <span className="ml-1">{expandedSessionId ? '▾' : '▸'}</span>
            </button>
            <button
              type="button"
              onClick={onEditSessions}
              className="rounded-lg border border-brand-medium-blue px-3 py-1.5 text-xs font-semibold text-brand-medium-blue hover:bg-blue-50"
            >
              Edit Sessions
            </button>
          </div>

          {expandedSessionId && (
            <ul className="space-y-3">
              {sessions.map((session) => {
                const status = sessionMaterialStatus(session);
                const hours = sessionDurationHours(session.start, session.end);
                const price = hourlyRate * hours + serviceFeePerSession;
                return (
                  <li
                    key={session.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-gray-800">
                        {formatSessionLine(session.start, session.end)}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${price.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-gray-500">Online</span>
                      {status.ok ? (
                        <span className="font-medium text-green-700">
                          ✓ {status.label}
                        </span>
                      ) : (
                        <span className="text-amber-700">{status.label}</span>
                      )}
                      {session.recurring && (
                        <span className="font-semibold text-brand-medium-blue">
                          (Recurring)
                        </span>
                      )}
                    </div>
                    {(session.materials?.files || []).length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {(session.materials.files || []).map((f) => (
                          <li key={f.id} className="text-xs text-gray-600">
                            📎 {f.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <button
            type="button"
            onClick={onEditSessions}
            className="mt-3 text-sm font-medium text-brand-medium-blue hover:underline"
          >
            + Add Another Session
          </button>
        </div>
      )}
    </div>
  );
};

const BookSessionReviewBooking = ({
  tutorFirstName,
  subjects,
  subjectDisplayLine,
  selectedSubject,
  onSelectSubject,
  selectedSessions,
  learnerProfiles,
  reviewActiveLearner,
  onReviewActiveLearnerChange,
  reviewView,
  onReviewViewChange,
  hourlyRate,
  serviceFeePerSession,
  onEditSessions,
  pricingSummary,
}) => {
  const learnersWithSessions = useMemo(() => {
    const labels = [...new Set(selectedSessions.map((s) => s.learnerLabel))];
    return labels.sort();
  }, [selectedSessions]);

  const activeLearner =
    reviewActiveLearner && learnersWithSessions.includes(reviewActiveLearner)
      ? reviewActiveLearner
      : learnersWithSessions[0] || '';

  const learnerSessions = useMemo(
    () =>
      sortSessions(
        selectedSessions.filter((s) => s.learnerLabel === activeLearner),
      ),
    [selectedSessions, activeLearner],
  );

  const subjectName =
    (selectedSubject && subjects[selectedSubject - 1]) ||
    subjectDisplayLine ||
    'Subject';

  const [collapsedSubjects, setCollapsedSubjects] = useState(new Set());
  const [expandedSessionLists, setExpandedSessionLists] = useState(
    () => new Set([subjectName]),
  );

  const toggleSubject = (key) => {
    setCollapsedSubjects((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSessionList = (key) => {
    setExpandedSessionLists((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLearnerChange = (value) => {
    if (value === ADD_LEARNER_VALUE) {
      onReviewViewChange('choose-subject');
      return;
    }
    onReviewActiveLearnerChange(value);
    onReviewViewChange('review');
  };

  if (reviewView === 'choose-subject' || selectedSessions.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-brand-medium-blue">
              4 Review Your Booking
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a subject to schedule sessions for a learner.
            </p>

            <h3 className="mt-6 mb-3 text-lg font-semibold text-gray-900">
              Choose Your Subject
            </h3>
            {subjects.length === 0 ? (
              <p className="text-sm text-gray-500">No subjects available for this tutor.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {subjects.map((subject, index) => (
                  <button
                    key={subject}
                    type="button"
                    onClick={() => {
                      onSelectSubject(index + 1);
                      onReviewViewChange('review');
                      onEditSessions();
                    }}
                    className={`rounded-xl border-2 px-4 py-4 text-sm font-semibold transition ${
                      selectedSubject === index + 1
                        ? 'border-brand-gold bg-brand-medium-blue text-white'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-brand-medium-blue hover:bg-blue-50'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}

            {selectedSessions.length === 0 && (
              <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No sessions selected. Choose a subject above, then add session times on the
                calendar.
              </p>
            )}
          </div>
        </div>
        <div>{pricingSummary}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gold text-lg font-bold text-white">
              4
            </span>
            <div>
              <h2 className="text-xl font-bold text-brand-medium-blue">
                Review Your Booking
              </h2>
              <p className="text-sm text-gray-500">
                Confirm the session details before submitting your request.
              </p>
            </div>
          </div>

          <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">How payment works</p>
            <p className="mt-1">
              A temporary authorization hold may be placed on your card. You are only charged
              for sessions your tutor confirms. If a session is declined, you will not be
              charged for it.
            </p>
          </div>

          <label className="mb-1 block text-sm font-medium text-gray-700">
            Learner
          </label>
          <select
            value={activeLearner}
            onChange={(e) => handleLearnerChange(e.target.value)}
            className="mb-5 w-full max-w-md rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
          >
            {learnersWithSessions.map((label) => (
              <option key={label} value={label}>
                {formatLearnerLabel(label, learnerProfiles)}
              </option>
            ))}
            {learnerProfiles
              .filter((l) => !learnersWithSessions.includes(l.learnerLabel))
              .map((l) => (
                <option key={l.learnerLabel} value={l.learnerLabel}>
                  {formatLearnerLabel(l.learnerLabel, learnerProfiles)}
                </option>
              ))}
            <option value={ADD_LEARNER_VALUE}>+ Add Learner</option>
          </select>

          {learnerSessions.length > 0 ? (
            <SubjectSection
              subjectName={subjectName}
              sessions={learnerSessions}
              hourlyRate={hourlyRate}
              serviceFeePerSession={serviceFeePerSession}
              collapsed={collapsedSubjects.has(subjectName)}
              onToggle={() => toggleSubject(subjectName)}
              onEditSessions={onEditSessions}
              expandedSessionId={expandedSessionLists.has(subjectName)}
              onToggleSessionsList={() => toggleSessionList(subjectName)}
            />
          ) : (
            <p className="text-sm text-gray-500">
              No sessions for this learner. Use + Add Learner or Edit Sessions to schedule.
            </p>
          )}

          <p className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <span className="text-green-600" aria-hidden="true">
              ✓
            </span>
            You may reschedule or cancel up to 24 hours before the session.
          </p>
        </div>
      </div>

      <div>{pricingSummary}</div>
    </div>
  );
};

export default BookSessionReviewBooking;
export { ADD_LEARNER_VALUE };
