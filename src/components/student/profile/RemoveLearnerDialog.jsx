import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';

const SmileyHeader = () => (
  <div className="flex justify-center mb-2">
    <div
      className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl shadow-inner"
      aria-hidden
    >
      😊
    </div>
  </div>
);

function formatSessionWhen(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const day = start.toLocaleDateString('en-US', { weekday: 'short' });
  const datePart = start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
  const t1 = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const t2 = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${datePart} ${t1} – ${t2}`;
}

function learnerGradeLine(learner, session) {
  const name = [learner?.learnerFirstName, learner?.learnerLastName]
    .filter(Boolean)
    .join(' ');
  const grade = learner?.gradeLevel || session?.gradeLevel;
  if (name && grade) return `${name}, ${grade} Grade Student`;
  if (name) return name;
  return grade ? `${grade} Grade Student` : 'Student';
}

const RemoveLearnerDialog = ({
  open,
  learner,
  preview,
  loading,
  removing,
  onClose,
  onConfirm,
}) => {
  const firstName = learner?.learnerFirstName || 'Learner';
  const hasSessions =
    Boolean(preview?.hasUpcomingSessions) && (preview?.sessions?.length ?? 0) > 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle className="text-center pb-0">
        <SmileyHeader />
        <span className="block text-xl font-bold text-brand-dark-blue">
          {hasSessions ? `Remove ${firstName}?` : `Remove ${firstName}`}
        </span>
      </DialogTitle>
      <DialogContent className="pt-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <CircularProgress size={32} />
          </div>
        ) : hasSessions ? (
          <>
            <p className="text-sm text-gray-700 text-center mb-4">
              Removing {firstName} will cancel the sessions listed below. Are you sure you want
              to remove this learner?
            </p>
            <ul className="space-y-3 mb-4 max-h-[280px] overflow-y-auto pr-1">
              {preview.sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex gap-3 border border-gray-200 rounded-lg p-3 bg-white shadow-sm"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-light-blue/40 flex items-center justify-center text-lg shrink-0">
                    📚
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold text-brand-dark-blue">
                      {formatSessionWhen(s.startTime, s.endTime)}
                    </p>
                    <p className="font-medium text-gray-800 mt-0.5">{s.subjectName}</p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {learnerGradeLine(learner, s)}
                    </p>
                    {(s.referenceNumber || s.id) && (
                      <p className="text-gray-400 text-xs mt-1">
                        Session ID: {s.referenceNumber || `TUT${String(s.id).padStart(3, '0')}`}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span className="text-lg shrink-0" aria-hidden>
                ⚠️
              </span>
              <p>
                Removal will cancel the above session(s) immediately. Cancellations will be
                subject to Tutor Scene&apos;s cancellation policy.
              </p>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-700 text-center py-2">
            Remove this learner? {firstName} will not be able to complete any sessions on Tutor
            Scene.
          </p>
        )}
      </DialogContent>
      {!loading && (
        <DialogActions className="px-6 pb-4 gap-2">
          <Button
            onClick={onClose}
            disabled={removing}
            variant="outlined"
            sx={{
              color: 'text.secondary',
              borderColor: 'grey.400',
              minWidth: 100,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={removing}
            onClick={() => onConfirm(hasSessions)}
            sx={{
              minWidth: hasSessions ? 160 : 100,
              bgcolor: hasSessions ? 'error.main' : 'primary.main',
              '&:hover': {
                bgcolor: hasSessions ? 'error.dark' : 'primary.dark',
              },
            }}
          >
            {removing ? 'Removing…' : hasSessions ? 'Confirm & Remove' : 'Remove'}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default RemoveLearnerDialog;
