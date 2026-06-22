/** @typedef {{ id: string, learnerLabel: string, start: Date, end: Date, recurring: boolean, slotId?: string, availabilityId?: string }} BookSessionItem */

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function generateTimeOptions() {
  const options = [];
  for (let h = 0; h < 24; h += 1) {
    for (const m of [0, 30]) {
      const d = new Date(2000, 0, 1, h, m, 0, 0);
      options.push({
        value: formatTimeValue(d),
        label: d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
      });
    }
  }
  return options;
}

export function formatTimeValue(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function parseTimeOnDate(dateKey, timeValue) {
  const [h, m] = timeValue.split(':').map(Number);
  const d = new Date(`${dateKey}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

export function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getEndTimeOptions(startTimeValue, maxHours = 8) {
  const all = generateTimeOptions();
  const [sh, sm] = startTimeValue.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const maxMins = startMins + maxHours * 60;
  return all.filter((opt) => {
    const [h, m] = opt.value.split(':').map(Number);
    const mins = h * 60 + m;
    return mins > startMins && mins <= maxMins;
  });
}

export function defaultEndTimeValue(startTimeValue) {
  const [h, m] = startTimeValue.split(':').map(Number);
  let endH = h + 1;
  const endM = m;
  if (endH >= 24) endH = 23;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function toInputDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function formatSessionDateTime(start, end) {
  const startD = start instanceof Date ? start : new Date(start);
  const endD = end instanceof Date ? end : new Date(end);
  const datePart = startD.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const startT = startD.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endT = endD.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${startT} – ${endT}`;
}

export function formatSessionShort(start, end) {
  const startD = start instanceof Date ? start : new Date(start);
  const endD = end instanceof Date ? end : new Date(end);
  const datePart = startD.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const startT = startD.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endT = endD.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart}, ${startT} – ${endT}`;
}

export function sessionDurationHours(start, end) {
  const ms = new Date(end) - new Date(start);
  return Math.max(ms / (1000 * 60 * 60), 0.5);
}

export function sortSessions(sessions) {
  return [...sessions].sort((a, b) => new Date(a.start) - new Date(b.start));
}

export function createSessionId() {
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Expand recurring sessions between start and end date for selected weekdays.
 * @param {object} params
 */
export function expandRecurringSessions({
  learnerLabel,
  startDate,
  startTime,
  endTime,
  recurringEndDate,
  recurringDays,
  slotId,
  availabilityId,
}) {
  const sessions = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${recurringEndDate}T23:59:59`);
  const daySet = new Set(recurringDays);

  while (cursor <= end) {
    if (daySet.has(cursor.getDay())) {
      const start = parseTimeOnDate(toInputDateKey(cursor), startTime);
      const endDt = parseTimeOnDate(toInputDateKey(cursor), endTime);
      if (endDt > start) {
        sessions.push({
          id: createSessionId(),
          learnerLabel,
          start,
          end: endDt,
          recurring: true,
          slotId,
          availabilityId,
        });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return sessions;
}

export { DAY_LABELS };
