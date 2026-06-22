/** Format time as "12:00 PM" for calendar slot labels */
export function formatSlotStartTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatSlotRange(startIso, endIso) {
  return `${formatSlotStartTime(startIso)} – ${formatSlotStartTime(endIso)}`;
}

export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const STATUS_CLASS = {
  available: 'bs-slot-available',
  selected: 'bs-slot-selected',
  pending: 'bs-slot-pending',
  booked: 'bs-slot-booked',
  unavailable: 'bs-slot-unavailable',
};

/** Each calendar day between range start (inclusive) and end (exclusive). */
export function eachDayInRange(rangeStart, rangeEnd) {
  if (!rangeStart || !rangeEnd) return [];
  const days = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(rangeEnd);
  end.setHours(0, 0, 0, 0);
  while (cursor < end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function buildDayUnavailableMarkers(viewType, rangeStart, rangeEnd, daysWithAvailability) {
  if (viewType !== 'timeGridWeek' && viewType !== 'timeGridDay') {
    return [];
  }

  return eachDayInRange(rangeStart, rangeEnd)
    .filter((day) => !daysWithAvailability.has(toDateKey(day)))
    .map((day) => {
      const start = new Date(day);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(1, 0, 0, 0);
      return {
        id: `day-unavailable-${toDateKey(day)}`,
        title: 'Unavailable',
        start,
        end,
        classNames: ['bs-day-unavailable-marker'],
        editable: false,
        extendedProps: {
          status: 'day-unavailable',
          isDayMarker: true,
        },
      };
    });
}

/**
 * @param {Array} slots - API calendar slots
 * @param {object} options
 * @param {string|null} options.selectedSlotId - deprecated, use selectedSlotIds
 * @param {Set<string>} options.selectedSlotIds
 * @param {string} options.viewType - FullCalendar view type
 * @param {Set<string>} options.daysWithAvailability
 * @param {Date|null} options.rangeStart
 * @param {Date|null} options.rangeEnd
 */
export function buildBookSessionEvents(slots, options = {}) {
  const {
    selectedSlotId = null,
    selectedSlotIds = null,
    viewType = 'dayGridMonth',
    daysWithAvailability = new Set(),
    rangeStart = null,
    rangeEnd = null,
  } = options;

  const selectedIds =
    selectedSlotIds instanceof Set
      ? selectedSlotIds
      : selectedSlotId
        ? new Set([selectedSlotId])
        : new Set();

  let list = Array.isArray(slots) ? [...slots] : [];

  if (viewType === 'dayGridMonth') {
    const byDay = new Map();
    for (const slot of list) {
      if (slot.status !== 'available' && slot.status !== 'pending') {
        const key = toDateKey(slot.startTime);
        if (!byDay.has(key)) byDay.set(key, []);
        byDay.get(key).push(slot);
        continue;
      }
      const key = toDateKey(slot.startTime);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(slot);
    }

    list = [];
    for (const [, daySlots] of byDay) {
      const sorted = [...daySlots].sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
      );
      const available = sorted.filter((s) => s.status === 'available');
      const others = sorted.filter((s) => s.status !== 'available');
      if (available.length > 0) {
        list.push(available[0]);
      }
      others.forEach((s) => {
        if (!list.find((x) => x.id === s.id)) list.push(s);
      });
    }
  }

  const events = list.map((slot) => {
    const isSelected = selectedIds.has(slot.id);
    const status = isSelected ? 'selected' : slot.status;
    const classNames = [STATUS_CLASS[status] || STATUS_CLASS.unavailable];

    return {
      id: slot.id,
      title: formatSlotStartTime(slot.startTime),
      start: slot.startTime,
      end: slot.endTime,
      classNames,
      editable: false,
      extendedProps: {
        availabilityId: slot.availabilityId,
        status: slot.status,
        bookingId: slot.bookingId,
        isOwnBooking: slot.isOwnBooking,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    };
  });

  const dayMarkers = buildDayUnavailableMarkers(
    viewType,
    rangeStart,
    rangeEnd,
    daysWithAvailability,
  );

  return [...dayMarkers, ...events];
}

export function getDayCellClassNames(date, daysWithAvailability, selectedDateKey) {
  const key = toDateKey(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cellDate = new Date(date);
  cellDate.setHours(0, 0, 0, 0);

  if (key === selectedDateKey) {
    return ['bs-day-selected'];
  }
  if (daysWithAvailability.has(key)) {
    return ['bs-day-has-availability'];
  }
  if (cellDate < today) {
    return ['bs-day-past'];
  }
  return ['bs-day-unavailable'];
}

export function renderSlotEventContent(eventInfo) {
  const props = eventInfo.event.extendedProps || {};
  const status = props.status;
  const isSelected = eventInfo.event.classNames?.includes('bs-slot-selected');
  const title = eventInfo.event.title || '';
  const isDayMarker = props.isDayMarker;

  if (isDayMarker) {
    return {
      html: `
        <div class="bs-slot-event-inner bs-day-unavailable-inner">
          <span class="bs-slot-lock" aria-hidden="true">🔒</span>
          <span class="bs-slot-time">Unavailable</span>
        </div>
      `,
    };
  }

  const showLock = status === 'booked';
  const showCheck = isSelected;

  return {
    html: `
      <div class="bs-slot-event-inner">
        ${showCheck ? '<span class="bs-slot-check" aria-hidden="true">✓</span>' : ''}
        ${showLock ? '<span class="bs-slot-lock" aria-hidden="true">🔒</span>' : ''}
        <span class="bs-slot-time">${title}</span>
      </div>
    `,
  };
}

export function getTimeGridColClassNames(date, daysWithAvailability, selectedDateKey) {
  const key = toDateKey(date);
  if (key === selectedDateKey) {
    return ['bs-day-selected'];
  }
  if (daysWithAvailability.has(key)) {
    return ['bs-day-has-availability'];
  }
  return ['bs-timegrid-day-unavailable'];
}

export const CALENDAR_LEGEND = [
  { key: 'available', label: 'Available', className: 'bs-legend-available', kind: 'swatch' },
  { key: 'selected', label: 'Selected', className: 'bs-legend-selected', kind: 'selected' },
  { key: 'booked', label: 'Booked', className: 'bs-legend-booked', kind: 'booked' },
  { key: 'unavailable', label: 'Unavailable', className: 'bs-legend-unavailable-lock', kind: 'unavailable-lock' },
  { key: 'pending', label: 'Pending', className: 'bs-legend-pending', kind: 'swatch' },
];
