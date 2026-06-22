import {
  generateTimeOptions,
  getEndTimeOptions,
  defaultEndTimeValue,
  DAY_LABELS,
} from '../../utils/bookSessionSessionUtils';

const BookSessionAddSessionPanel = ({
  learnerOptions,
  learnerLabel,
  onLearnerChange,
  startDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  recurring,
  onRecurringChange,
  recurringEndDate,
  onRecurringEndDateChange,
  recurringDays,
  onRecurringDaysChange,
  onAdd,
  onCancel,
  isEditing,
  addError,
}) => {
  const timeOptions = generateTimeOptions();
  const endOptions = getEndTimeOptions(startTime);

  const toggleDay = (dayIndex) => {
    if (recurringDays.includes(dayIndex)) {
      onRecurringDaysChange(recurringDays.filter((d) => d !== dayIndex));
    } else {
      onRecurringDaysChange([...recurringDays, dayIndex].sort());
    }
  };

  const handleStartTimeChange = (value) => {
    onStartTimeChange(value);
    const ends = getEndTimeOptions(value);
    if (!ends.some((o) => o.value === endTime)) {
      onEndTimeChange(defaultEndTimeValue(value));
    }
  };

  const formattedDate = startDate
    ? new Date(`${startDate}T12:00:00`).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      })
    : '—';

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 border-b border-gray-100 pb-3">
        <h3 className="text-lg font-semibold text-gray-900">Add Session</h3>
        <p className="mt-0.5 text-xs text-gray-500">
          Choose learner, time, and optional recurring schedule.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Select Learner
          </label>
          <select
            value={learnerLabel}
            onChange={(e) => onLearnerChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
          >
            {learnerOptions.length === 0 ? (
              <option value="">Account holder</option>
            ) : (
              learnerOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="text"
            readOnly
            value={formattedDate}
            className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
            aria-label="Start date (select on calendar)"
          />
          <p className="mt-1 text-xs text-gray-500">
            Select a date on the calendar to change.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <select
              value={startTime}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
            >
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              End Time
            </label>
            <select
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
            >
              {endOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => onRecurringChange(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-brand-medium-blue focus:ring-brand-medium-blue"
            />
            <span className="text-sm font-medium text-gray-800">
              Recurring availability
            </span>
          </label>

          {recurring && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <input
                  type="date"
                  value={recurringEndDate}
                  min={startDate}
                  onChange={(e) => onRecurringEndDateChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Select Days</p>
                <div className="grid grid-cols-2 gap-2">
                  {DAY_LABELS.map((label, idx) => (
                    <label key={label} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={recurringDays.includes(idx)}
                        onChange={() => toggleDay(idx)}
                        className="h-4 w-4 rounded border-gray-300 text-brand-medium-blue focus:ring-brand-medium-blue"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {addError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{addError}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onAdd}
            disabled={!startDate}
            className="flex-1 rounded-lg bg-brand-medium-blue px-4 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-dark-blue disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isEditing ? 'Update Session' : 'Add'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookSessionAddSessionPanel;
