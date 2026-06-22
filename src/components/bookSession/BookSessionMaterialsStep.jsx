import { useCallback, useMemo, useRef, useState } from 'react';
import { sortSessions } from '../../utils/bookSessionSessionUtils';

function learnerInitial(name) {
  const trimmed = String(name || '').trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : '?';
}

function formatSessionCardDate(start) {
  const d = new Date(start);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatSessionCardTime(start, end) {
  const fmt = (date) =>
    new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  return `${fmt(start)} – ${fmt(end)}`;
}

function sessionHasMaterials(session) {
  const files = session.materials?.files || [];
  const comments = (session.materials?.comments || '').trim();
  return files.length > 0 || comments.length > 0;
}

function fileIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['doc', 'docx'].includes(ext)) return '📝';
  return '📎';
}

const SessionMaterialsCard = ({
  session,
  subjectLine,
  onUpdateMaterials,
  onApplyToOtherSessions,
  siblingSessionIds,
}) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const files = session.materials?.files || [];
  const comments = session.materials?.comments || '';
  const hasMaterials = sessionHasMaterials(session);

  const addFiles = useCallback(
    (fileList) => {
      if (!fileList?.length) return;
      const next = [...files];
      Array.from(fileList).forEach((file) => {
        next.push({
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          file,
        });
      });
      onUpdateMaterials(session.id, { files: next, comments });
    },
    [files, comments, onUpdateMaterials, session.id],
  );

  const removeFile = (fileId) => {
    onUpdateMaterials(session.id, {
      files: files.filter((f) => f.id !== fileId),
      comments,
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-medium-blue text-sm font-bold text-white">
            {learnerInitial(session.learnerLabel)}
          </span>
          <div>
            <p className="font-semibold text-gray-900">
              {session.learnerLabel}
              {subjectLine ? ` — ${subjectLine}` : ''}
            </p>
            <p className="text-sm text-gray-600">
              {formatSessionCardDate(session.start)} —{' '}
              {formatSessionCardTime(session.start, session.end)}
            </p>
            {session.recurring && (
              <span className="mt-0.5 inline-block text-xs font-semibold text-brand-medium-blue">
                (Recurring)
              </span>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            hasMaterials
              ? 'bg-green-100 text-green-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {hasMaterials ? '✓ Materials Added' : 'No Files Uploaded Yet'}
        </span>
      </div>

      <div
        role="button"
        tabIndex={0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        className={`mb-3 cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? 'border-brand-medium-blue bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-brand-light-blue hover:bg-blue-50/50'
        }`}
      >
        <p className="text-sm font-medium text-gray-700">
          Drag &amp; Drop Files or{' '}
          <span className="text-brand-medium-blue underline">Browse Files</span>
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {files.length > 0 && (
        <ul className="mb-3 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm text-gray-800">
                <span aria-hidden="true">{fileIcon(f.name)}</span>
                <span className="truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-green-600" aria-label="Uploaded">
                  ✓
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600"
                aria-label={`Remove ${f.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <textarea
        value={comments}
        onChange={(e) =>
          onUpdateMaterials(session.id, { files, comments: e.target.value })
        }
        placeholder="Add Comments for Tutor (optional)"
        rows={2}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
      />

      {files.length > 0 && siblingSessionIds.length > 0 && (
        <button
          type="button"
          onClick={() => onApplyToOtherSessions(session.id, siblingSessionIds)}
          className="mt-3 text-sm font-medium text-brand-medium-blue hover:underline"
        >
          ↑ Apply these files to other sessions
        </button>
      )}
    </div>
  );
};

const BookSessionMaterialsStep = ({
  sessions,
  subjectLine,
  onUpdateSessionMaterials,
  onApplyFilesToSessions,
  onSaveContinue,
  onSkip,
  pricingSummary,
}) => {
  const groups = useMemo(() => {
    const map = new Map();
    sortSessions(sessions).forEach((s) => {
      if (!map.has(s.learnerLabel)) map.set(s.learnerLabel, []);
      map.get(s.learnerLabel).push(s);
    });
    return Array.from(map.entries()).map(([learnerLabel, learnerSessions]) => ({
      learnerLabel,
      sessions: learnerSessions,
    }));
  }, [sessions]);

  const [activeTab, setActiveTab] = useState(null);

  const currentTab = activeTab ?? groups[0]?.learnerLabel ?? '';

  const activeGroup = groups.find((g) => g.learnerLabel === currentTab) || groups[0];

  const progress = useMemo(() => {
    return groups.map((g) => {
      const completed = g.sessions.filter(sessionHasMaterials).length;
      return {
        learnerLabel: g.learnerLabel,
        total: g.sessions.length,
        completed,
      };
    });
  }, [groups]);

  const totalReady = sessions.filter(sessionHasMaterials).length;

  const handleUpdateMaterials = (sessionId, materials) => {
    onUpdateSessionMaterials(sessionId, materials);
  };

  const handleApplyToOthers = (sourceSessionId, targetIds) => {
    const source = sessions.find((s) => s.id === sourceSessionId);
    if (!source?.materials?.files?.length) return;
    onApplyFilesToSessions(sourceSessionId, targetIds);
  };

  if (!groups.length) {
    return (
      <p className="text-sm text-gray-500">No sessions selected. Go back to add sessions.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-brand-medium-blue">
            Upload Your Materials or Enter Comments
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Optional, but highly recommended for a better session.
          </p>

          <div className="mt-5 flex flex-wrap gap-2 border-b border-gray-200 pb-0">
            {groups.map((g) => (
              <button
                key={g.learnerLabel}
                type="button"
                onClick={() => setActiveTab(g.learnerLabel)}
                className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold transition ${
                  currentTab === g.learnerLabel
                    ? 'border border-b-0 border-gray-200 bg-white text-brand-medium-blue'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {g.learnerLabel} ({g.sessions.length} Session
                {g.sessions.length !== 1 ? 's' : ''})
              </button>
            ))}
          </div>

          <div className="space-y-4 border border-t-0 border-gray-200 bg-white p-4">
            {activeGroup?.sessions.map((session) => {
              const siblingIds = activeGroup.sessions
                .filter((s) => s.id !== session.id)
                .map((s) => s.id);
              return (
                <SessionMaterialsCard
                  key={session.id}
                  session={session}
                  subjectLine={subjectLine}
                  onUpdateMaterials={handleUpdateMaterials}
                  onApplyToOtherSessions={handleApplyToOthers}
                  siblingSessionIds={siblingIds}
                />
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onSkip}
              className="rounded-lg border-2 border-brand-medium-blue bg-white px-6 py-2.5 text-sm font-semibold text-brand-medium-blue hover:bg-blue-50"
            >
              Skip for Now
            </button>
            <button
              type="button"
              onClick={onSaveContinue}
              className="rounded-lg bg-brand-medium-blue px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-dark-blue"
            >
              Save &amp; Continue
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-700">
            Upload Progress Summary
          </h3>
          <ul className="space-y-3">
            {progress.map((p) => (
              <li key={p.learnerLabel} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800">{p.learnerLabel}</span>
                <span className="flex items-center gap-2 text-gray-600">
                  {p.total} Session{p.total !== 1 ? 's' : ''}, {p.completed} Completed
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      p.completed > 0
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                    aria-hidden="true"
                  >
                    {p.completed > 0 ? '✓' : ''}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-gray-100 pt-3 text-sm text-gray-600">
            Total Materials Uploaded:{' '}
            <strong className="text-gray-900">
              {totalReady} Session{totalReady !== 1 ? 's' : ''} Ready
            </strong>
          </p>
        </div>

        {pricingSummary}
      </div>
    </div>
  );
};

export default BookSessionMaterialsStep;
