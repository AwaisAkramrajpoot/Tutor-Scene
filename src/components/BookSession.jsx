import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { apiRequest } from '../utils/api';
import { getCreditsReferrals } from '../services/studentCreditsService';
import BookSessionStickyHeader from './bookSession/BookSessionStickyHeader';
import BookSessionAddSessionPanel from './bookSession/BookSessionAddSessionPanel';
import BookSessionSelectedSessionsPanel from './bookSession/BookSessionSelectedSessionsPanel';
import BookSessionPricingSummary from './bookSession/BookSessionPricingSummary';
import BookSessionConfirmDialog from './bookSession/BookSessionConfirmDialog';
import BookSessionMaterialsStep from './bookSession/BookSessionMaterialsStep';
import BookSessionReviewBooking from './bookSession/BookSessionReviewBooking';
import BookSessionSubmittedModal from './bookSession/BookSessionSubmittedModal';
import BookSessionCalendarViewSwitch from './bookSession/BookSessionCalendarViewSwitch';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  buildBookSessionEvents,
  getDayCellClassNames,
  getTimeGridColClassNames,
  renderSlotEventContent,
  CALENDAR_LEGEND,
} from '../utils/bookSessionCalendarUtils';
import {
  createSessionId,
  defaultEndTimeValue,
  expandRecurringSessions,
  formatSessionShort,
  formatTimeValue,
  parseTimeOnDate,
  sessionDurationHours,
  sortSessions,
  toInputDateKey,
} from '../utils/bookSessionSessionUtils';
import { tutorFirstName } from '../utils/tutorLearnerDisplay';

const SERVICE_FEE_PER_SESSION = 5;

const emptyMaterials = () => ({ files: [], comments: '' });

function buildSessionNotes(session, globalNotes) {
  const parts = [];
  if (globalNotes?.trim()) parts.push(globalNotes.trim());
  if (session.materials?.comments?.trim()) {
    parts.push(session.materials.comments.trim());
  }
  const fileNames = (session.materials?.files || []).map((f) => f.name).filter(Boolean);
  if (fileNames.length) {
    parts.push(`Attached files: ${fileNames.join(', ')}`);
  }
  return parts.length ? parts.join('\n\n') : undefined;
}

const BookSession = ({ tutorData, bookingData, onClose }) => {
  const calendarRef = useRef(null);
  const [flowStep, setFlowStep] = useState(1);
  const [calendarSlots, setCalendarSlots] = useState([]);
  const [daysWithAvailability, setDaysWithAvailability] = useState(new Set());
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [rangeStart, setRangeStart] = useState(null);
  const [rangeEnd, setRangeEnd] = useState(null);

  const [learnerOptions, setLearnerOptions] = useState([]);
  const [learnerProfiles, setLearnerProfiles] = useState([]);
  const [reviewActiveLearner, setReviewActiveLearner] = useState('');
  const [reviewView, setReviewView] = useState('review');
  const [selectedSessions, setSelectedSessions] = useState([]);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [activeSlotId, setActiveSlotId] = useState(null);
  const [activeAvailabilityId, setActiveAvailabilityId] = useState(null);

  const [formLearner, setFormLearner] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('12:00');
  const [formEndTime, setFormEndTime] = useState('13:00');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formRecurringEndDate, setFormRecurringEndDate] = useState('');
  const [formRecurringDays, setFormRecurringDays] = useState([]);
  const [addError, setAddError] = useState('');

  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [discountCode, setDiscountCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState(null);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  const [availableCredits, setAvailableCredits] = useState(0);
  const [useCredits, setUseCredits] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    variant: 'default',
    onConfirm: null,
  });

  const subjects = bookingData?.subjects
    ? bookingData.subjects.split(',').map((s) => s.trim())
    : [];

  const studentId = useMemo(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      const user = JSON.parse(userStr);
      return user.id || user._id || user.userId || null;
    } catch {
      return null;
    }
  }, []);

  const subjectDisplayLine =
    bookingData?.subjectDisplayLine && String(bookingData.subjectDisplayLine).trim()
      ? bookingData.subjectDisplayLine
      : subjects.join(' | ');

  useEffect(() => {
    const loadCredits = async () => {
      try {
        const data = await getCreditsReferrals();
        const balance = Number(data?.availableCredits ?? 0);
        setAvailableCredits(balance);
        if (
          sessionStorage.getItem('applyAvailableCredits') === 'true' &&
          balance > 0
        ) {
          setUseCredits(true);
        }
      } catch {
        setAvailableCredits(0);
      }
    };
    loadCredits();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest('/api/v1/learner-assessment/completed', {
          method: 'GET',
        });
        if (cancelled) return;
        const labels = (res.learners || []).map((l) => l.learnerLabel).filter(Boolean);
        setLearnerProfiles(res.learners || []);
        if (labels.length > 0) {
          setLearnerOptions(labels);
          setFormLearner(labels[0]);
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const name =
              `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Account holder';
            setLearnerOptions([name]);
            setFormLearner(name);
          }
        }
      } catch {
        if (!cancelled) {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              const name =
                `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Account holder';
              setLearnerOptions([name]);
              setFormLearner(name);
            } catch {
              setLearnerOptions(['Account holder']);
              setFormLearner('Account holder');
            }
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedSlotIds = useMemo(() => {
    const ids = new Set();
    selectedSessions.forEach((s) => {
      if (s.slotId) ids.add(s.slotId);
    });
    if (activeSlotId) ids.add(activeSlotId);
    return ids;
  }, [selectedSessions, activeSlotId]);

  const selectedDateKey = formStartDate || null;

  const calendarEvents = useMemo(
    () =>
      buildBookSessionEvents(calendarSlots, {
        selectedSlotIds,
        viewType: calendarView,
        daysWithAvailability,
        rangeStart,
        rangeEnd,
      }),
    [calendarSlots, selectedSlotIds, calendarView, daysWithAvailability, rangeStart, rangeEnd],
  );

  const isTimeGridView =
    calendarView === 'timeGridWeek' || calendarView === 'timeGridDay';

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    end.setHours(0, 0, 0, 0);
    setRangeStart(start);
    setRangeEnd(end);
  }, []);

  const fetchCalendarSlots = useCallback(async () => {
    if (!bookingData?.userId) {
      setBookingError('Tutor information is missing. Please go back and try again.');
      setLoadingAvailability(false);
      return;
    }

    try {
      setLoadingAvailability(true);
      const params = new URLSearchParams();
      if (bookingData.tutorProfileId) {
        params.set('tutorProspectId', String(bookingData.tutorProfileId));
      }
      if (studentId) {
        params.set('studentId', String(studentId));
      }
      if (rangeStart) params.set('start', rangeStart.toISOString());
      if (rangeEnd) params.set('end', rangeEnd.toISOString());

      const qs = params.toString();
      const response = await apiRequest(
        `/api/v1/availability/tutor/${bookingData.userId}/calendar-slots${qs ? `?${qs}` : ''}`,
        'GET',
      );

      setCalendarSlots(response?.slots || []);
      setDaysWithAvailability(new Set(response?.daysWithAvailability || []));
      setBookingError(null);
    } catch (error) {
      console.error('Error fetching calendar slots:', error);
      setBookingError('Failed to load tutor availability');
      setCalendarSlots([]);
      setDaysWithAvailability(new Set());
    } finally {
      setLoadingAvailability(false);
    }
  }, [bookingData?.userId, bookingData?.tutorProfileId, studentId, rangeStart, rangeEnd]);

  useEffect(() => {
    if (rangeStart && rangeEnd) {
      fetchCalendarSlots();
    }
  }, [fetchCalendarSlots, rangeStart, rangeEnd]);

  const pricing = useMemo(() => {
    const totalHours = selectedSessions.reduce(
      (sum, s) => sum + sessionDurationHours(s.start, s.end),
      0,
    );
    const sessionCost = tutorData.rate * totalHours;
    const serviceFee = SERVICE_FEE_PER_SESSION * selectedSessions.length;
    const subtotal = sessionCost + serviceFee;
    const creditApplied = useCredits
      ? Math.min(availableCredits, Math.max(subtotal - appliedDiscount, 0))
      : 0;
    const total = Math.max(subtotal - appliedDiscount - creditApplied, 0);
    const learnerCount = new Set(selectedSessions.map((s) => s.learnerLabel)).size;
    return {
      totalHours,
      sessionCost,
      serviceFee,
      subtotal,
      creditApplied,
      total,
      learnerCount,
    };
  }, [selectedSessions, tutorData.rate, appliedDiscount, useCredits, availableCredits]);

  const resetForm = () => {
    setEditingSessionId(null);
    setActiveSlotId(null);
    setActiveAvailabilityId(null);
    setAddError('');
    setFormRecurring(false);
    setFormRecurringEndDate('');
    setFormRecurringDays([]);
  };

  const handleDatesSet = (dateInfo) => {
    setCalendarView(dateInfo.view.type);
    setRangeStart(dateInfo.start);
    setRangeEnd(dateInfo.end);
  };

  const handleCalendarViewChange = (viewId) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      api.changeView(viewId);
    }
    setCalendarView(viewId);
  };

  const handleEventClick = (info) => {
    if (info.event.extendedProps?.isDayMarker) return;
    if (info.event.extendedProps?.status !== 'available') return;

    const event = info.event;
    const start = event.start;
    const dateKey = toInputDateKey(start);
    const startTime = formatTimeValue(start);
    const endTime = defaultEndTimeValue(startTime);

    setActiveSlotId(event.id);
    setActiveAvailabilityId(event.extendedProps.availabilityId);
    setFormStartDate(dateKey);
    setFormStartTime(startTime);
    setFormEndTime(endTime);
    setAddError('');
  };

  const buildSessionsFromForm = () => {
    if (!formStartDate) {
      setAddError('Select a date on the calendar first.');
      return null;
    }
    if (!formLearner) {
      setAddError('Select a learner.');
      return null;
    }
    if (formRecurring) {
      if (!formRecurringEndDate) {
        setAddError('Select an end date for recurring sessions.');
        return null;
      }
      if (formRecurringDays.length === 0) {
        setAddError('Select at least one day for recurring sessions.');
        return null;
      }
      return expandRecurringSessions({
        learnerLabel: formLearner,
        startDate: formStartDate,
        startTime: formStartTime,
        endTime: formEndTime,
        recurringEndDate: formRecurringEndDate,
        recurringDays: formRecurringDays,
        slotId: activeSlotId,
        availabilityId: activeAvailabilityId,
      });
    }

    const start = parseTimeOnDate(formStartDate, formStartTime);
    const end = parseTimeOnDate(formStartDate, formEndTime);
    if (end <= start) {
      setAddError('End time must be after start time.');
      return null;
    }

    return [
      {
        id: editingSessionId || createSessionId(),
        learnerLabel: formLearner,
        start,
        end,
        recurring: false,
        slotId: activeSlotId,
        availabilityId: activeAvailabilityId,
      },
    ];
  };

  const applySessions = (newSessions) => {
    const normalized = newSessions.map((session) => {
      if (editingSessionId) {
        const existing = selectedSessions.find((s) => s.id === editingSessionId);
        return {
          ...session,
          materials: existing?.materials || emptyMaterials(),
        };
      }
      return {
        ...session,
        materials: session.materials || emptyMaterials(),
      };
    });

    if (editingSessionId) {
      setSelectedSessions((prev) => {
        const without = prev.filter((s) => s.id !== editingSessionId);
        return sortSessions([...without, ...normalized]);
      });
    } else {
      setSelectedSessions((prev) => sortSessions([...prev, ...normalized]));
    }
    resetForm();
    setFormStartDate('');
  };

  const updateSessionMaterials = (sessionId, materials) => {
    setSelectedSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, materials } : s)),
    );
  };

  const applyFilesToSessions = (sourceSessionId, targetIds) => {
    const source = selectedSessions.find((s) => s.id === sourceSessionId);
    if (!source?.materials?.files?.length) return;

    const fileCopies = source.materials.files.map((f) => ({
      ...f,
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    }));

    setSelectedSessions((prev) =>
      prev.map((s) => {
        if (!targetIds.includes(s.id)) return s;
        return {
          ...s,
          materials: {
            files: fileCopies.map((f) => ({ ...f })),
            comments: source.materials.comments || s.materials?.comments || '',
          },
        };
      }),
    );
  };

  const handleAddSession = () => {
    const sessions = buildSessionsFromForm();
    if (!sessions?.length) return;

    if (editingSessionId) {
      setConfirmDialog({
        open: true,
        title: 'Confirm session changes',
        message: 'Update this session with the new date, time, or learner details?',
        variant: 'default',
        onConfirm: () => {
          applySessions(sessions);
          setConfirmDialog((d) => ({ ...d, open: false }));
        },
      });
      return;
    }

    applySessions(sessions);
  };

  const handleSelectSession = (session) => {
    setEditingSessionId(session.id);
    setActiveSlotId(session.slotId || null);
    setActiveAvailabilityId(session.availabilityId || null);
    setFormLearner(session.learnerLabel);
    setFormStartDate(toInputDateKey(session.start));
    setFormStartTime(formatTimeValue(new Date(session.start)));
    setFormEndTime(formatTimeValue(new Date(session.end)));
    setFormRecurring(Boolean(session.recurring));
    setAddError('');
  };

  const handleRemoveSession = (session) => {
    setConfirmDialog({
      open: true,
      title: 'Cancel this session?',
      message: `Remove ${session.learnerLabel} — ${formatSessionShort(session.start, session.end)} from your selections?`,
      variant: 'danger',
      onConfirm: () => {
        setSelectedSessions((prev) => prev.filter((s) => s.id !== session.id));
        if (editingSessionId === session.id) {
          resetForm();
          setFormStartDate('');
        }
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  };

  useEffect(() => {
    if (flowStep === 4 && selectedSessions.length > 0) {
      const labels = [...new Set(selectedSessions.map((s) => s.learnerLabel))];
      if (!reviewActiveLearner || !labels.includes(reviewActiveLearner)) {
        setReviewActiveLearner(labels[0]);
      }
      if (reviewView !== 'choose-subject') {
        setReviewView('review');
      }
    }
  }, [flowStep, selectedSessions, reviewActiveLearner, reviewView]);

  const handleCancelAll = () => {
    if (selectedSessions.length === 0) return;
    setConfirmDialog({
      open: true,
      title: 'Cancel all selections?',
      message:
        'All of your selections will be deleted. Are you sure you want to continue?',
      variant: 'danger',
      confirmLabel: 'Confirm',
      cancelLabel: 'Exit',
      onConfirm: () => {
        setSelectedSessions([]);
        resetForm();
        setFormStartDate('');
        setReviewView('choose-subject');
        if (flowStep !== 4) {
          setFlowStep(1);
        }
        setConfirmDialog((d) => ({ ...d, open: false }));
      },
    });
  };

  const handleValidateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setCodeValidation({ valid: false, message: 'Please enter a discount code' });
      return;
    }

    setValidatingCode(true);
    setCodeValidation(null);

    try {
      const response = await apiRequest(
        `/api/v1/promo-codes/validate?code=${encodeURIComponent(discountCode.trim())}&amount=${pricing.subtotal}`,
        'GET',
      );

      if (response.valid) {
        setCodeValidation({
          valid: true,
          message: 'Promo code applied successfully!',
          discount: response.discount || 0,
        });
        setAppliedDiscount(response.discount || 0);
      } else {
        setCodeValidation({
          valid: false,
          message: response.message || 'Invalid promo code',
        });
        setAppliedDiscount(0);
      }
    } catch (err) {
      setCodeValidation({
        valid: false,
        message: err.message || 'Failed to validate promo code',
      });
      setAppliedDiscount(0);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSubject) {
      setBookingError('Please select a subject');
      return;
    }
    if (selectedSessions.length === 0) {
      setBookingError('Please add at least one session');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setBookingError('User not authenticated. Please log in again.');
        setIsBooking(false);
        return;
      }

      const user = JSON.parse(userStr);
      const studentProfileId = user.id || user._id || user.userId;
      if (!studentProfileId) {
        setBookingError('Unable to identify user. Please log in again.');
        setIsBooking(false);
        return;
      }

      const perSessionPrice =
        tutorData.rate + SERVICE_FEE_PER_SESSION;

      if (pricing.creditApplied > 0) {
        sessionStorage.setItem(
          'pendingCreditApplication',
          String(pricing.creditApplied),
        );
      }

      for (const session of selectedSessions) {
        const payload = {
          studentProfileId: parseInt(studentProfileId, 10),
          tutorProfileId: bookingData.tutorProfileId,
          subjectId: selectedSubject,
          startTime: new Date(session.start).toISOString(),
          endTime: new Date(session.end).toISOString(),
          totalPrice: perSessionPrice,
          notes: buildSessionNotes(session, notes),
          learnerLabel: session.learnerLabel,
          discountCode: codeValidation?.valid ? discountCode.trim() : undefined,
        };

        await apiRequest('/api/v1/bookings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      sessionStorage.removeItem('applyAvailableCredits');
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  const renderCalendar = () => (
    <div className="book-session-calendar-card overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {flowStep === 1 ? '1. Select Your Date and Time' : 'Session Calendar'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-500">
              Select a date and available time slot. You can book one session or multiple
              sessions across different dates.
            </p>
          </div>
          <BookSessionCalendarViewSwitch
            activeView={calendarView}
            onChange={handleCalendarViewChange}
          />
        </div>

        <div className="bs-calendar-legend mt-4" aria-label="Calendar legend">
          {CALENDAR_LEGEND.map((item) => (
            <span key={item.key} className="bs-calendar-legend-item">
              {item.kind === 'selected' && (
                <span
                  className="bs-legend-swatch bs-legend-selected bs-legend-selected-check"
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
              {item.kind === 'booked' && (
                <span
                  className="bs-legend-swatch bs-legend-booked bs-legend-booked-lock"
                  aria-hidden="true"
                >
                  🔒
                </span>
              )}
              {item.kind === 'unavailable-lock' && (
                <span className="bs-legend-swatch bs-legend-unavailable-lock" aria-hidden="true">
                  🔒
                </span>
              )}
              {item.kind === 'swatch' && (
                <span className={`bs-legend-swatch ${item.className}`} aria-hidden="true" />
              )}
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className="book-session-calendar-wrap min-w-0 px-2 pb-4 sm:px-4">
        <FullCalendar
          ref={calendarRef}
          className="book-session-calendar"
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'today',
          }}
          buttonText={{
            today: 'Today',
          }}
          titleFormat={{ year: 'numeric', month: 'long' }}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotDuration="00:30:00"
          slotLabelInterval="01:00:00"
          selectable={false}
          dayMaxEvents={4}
          weekends
          allDaySlot={false}
          height={isTimeGridView ? 640 : 'auto'}
          expandRows={isTimeGridView}
          views={{
            timeGridWeek: { slotMinHeight: 44 },
            timeGridDay: { slotMinHeight: 44 },
          }}
          nowIndicator
          displayEventTime={false}
          events={calendarEvents}
          eventClick={flowStep === 1 ? handleEventClick : undefined}
          datesSet={handleDatesSet}
          eventContent={renderSlotEventContent}
          dayCellClassNames={(arg) =>
            getDayCellClassNames(arg.date, daysWithAvailability, selectedDateKey)
          }
          slotLaneClassNames={(arg) =>
            getTimeGridColClassNames(arg.date, daysWithAvailability, selectedDateKey)
          }
          dayHeaderClassNames={(arg) =>
            getTimeGridColClassNames(arg.date, daysWithAvailability, selectedDateKey)
          }
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-[#f5f7fa]">
      {showConfirmationModal && (
        <BookSessionSubmittedModal
          open={showConfirmationModal}
          tutorName={tutorFirstName(tutorData.name)}
          onClose={() => {
            setShowConfirmationModal(false);
            onClose();
          }}
        />
      )}

      <BookSessionConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        cancelLabel={confirmDialog.cancelLabel}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((d) => ({ ...d, open: false }))}
      />

      <BookSessionStickyHeader
        tutorName={tutorData.name}
        profilePhotoUrl={tutorData.profilePhotoUrl}
        subjectDisplayLine={subjectDisplayLine}
        currentStep={flowStep}
        onBack={onClose}
      />

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        {flowStep === 1 && (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="relative min-w-0 xl:col-span-7">
              {loadingAvailability && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/80">
                  <div className="flex items-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-medium-blue" />
                    <span className="ml-3 text-gray-600">Loading availability...</span>
                  </div>
                </div>
              )}
              {renderCalendar()}
              {bookingError && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {bookingError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4 xl:col-span-5">
              <BookSessionAddSessionPanel
                learnerOptions={learnerOptions}
                learnerLabel={formLearner}
                onLearnerChange={setFormLearner}
                startDate={formStartDate}
                startTime={formStartTime}
                endTime={formEndTime}
                onStartTimeChange={setFormStartTime}
                onEndTimeChange={setFormEndTime}
                recurring={formRecurring}
                onRecurringChange={setFormRecurring}
                recurringEndDate={formRecurringEndDate}
                onRecurringEndDateChange={setFormRecurringEndDate}
                recurringDays={formRecurringDays}
                onRecurringDaysChange={setFormRecurringDays}
                onAdd={handleAddSession}
                onCancel={resetForm}
                isEditing={Boolean(editingSessionId)}
                addError={addError}
              />
              <BookSessionSelectedSessionsPanel
                sessions={selectedSessions}
                subjectLine={subjects[selectedSubject - 1] || subjectDisplayLine}
                activeSessionId={editingSessionId}
                onSelectSession={handleSelectSession}
                onRemoveSession={handleRemoveSession}
                onConfirmSelections={() => {
                  if (selectedSessions.length === 0) {
                    setBookingError('Add at least one session before continuing.');
                    return;
                  }
                  if (!selectedSubject && subjects.length === 1) {
                    setSelectedSubject(1);
                  }
                  setBookingError(null);
                  setFlowStep(2);
                }}
              />
              <BookSessionPricingSummary
                sessionCount={selectedSessions.length}
                learnerCount={pricing.learnerCount}
                totalHours={pricing.totalHours}
                sessionCost={pricing.sessionCost}
                serviceFee={pricing.serviceFee}
                promoDiscount={appliedDiscount}
                creditApplied={0}
                total={pricing.subtotal - appliedDiscount}
              />
            </div>
          </div>
        )}

        {flowStep === 2 && (
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-2 text-xl font-bold text-gray-900">2 Review Selections</h2>
              <p className="mb-6 text-sm text-gray-500">
                Review your selected sessions. Click a session to edit, or continue to confirm booking.
              </p>

              <BookSessionSelectedSessionsPanel
                sessions={selectedSessions}
                subjectLine={subjects[selectedSubject - 1] || subjectDisplayLine}
                activeSessionId={editingSessionId}
                onSelectSession={(s) => {
                  handleSelectSession(s);
                  setFlowStep(1);
                }}
                onRemoveSession={handleRemoveSession}
                showConfirmButton={false}
              />

              {subjects.length > 0 && (
                <div className="mt-6 border-t border-gray-100 pt-6">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">Select Subject</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject, index) => (
                      <button
                        key={subject}
                        type="button"
                        onClick={() => setSelectedSubject(index + 1)}
                        className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                          selectedSubject === index + 1
                            ? 'border-brand-gold bg-brand-medium-blue text-white shadow'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-brand-light-blue'
                        }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setFlowStep(1)}
                  className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Back to Calendar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedSubject && subjects.length > 0) {
                      setBookingError('Please select a subject.');
                      return;
                    }
                    setBookingError(null);
                    setFlowStep(3);
                  }}
                  disabled={selectedSessions.length === 0}
                  className="rounded-lg bg-brand-medium-blue px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-dark-blue disabled:bg-gray-300"
                >
                  Continue to Upload Materials
                </button>
              </div>
            </div>

            <BookSessionPricingSummary
              sessionCount={selectedSessions.length}
              learnerCount={pricing.learnerCount}
              totalHours={pricing.totalHours}
              sessionCost={pricing.sessionCost}
              serviceFee={pricing.serviceFee}
              promoDiscount={appliedDiscount}
              total={pricing.subtotal - appliedDiscount}
            />
          </div>
        )}

        {flowStep === 3 && (
          <>
            <button
              type="button"
              onClick={() => setFlowStep(2)}
              className="mb-4 text-sm font-medium text-brand-medium-blue hover:underline"
            >
              ← Back to Review Selections
            </button>
            <BookSessionMaterialsStep
            sessions={selectedSessions}
            subjectLine={subjects[selectedSubject - 1] || subjectDisplayLine}
            onUpdateSessionMaterials={updateSessionMaterials}
            onApplyFilesToSessions={applyFilesToSessions}
            onSaveContinue={() => setFlowStep(4)}
            onSkip={() => setFlowStep(4)}
            pricingSummary={
              <BookSessionPricingSummary
                sessionCount={selectedSessions.length}
                learnerCount={pricing.learnerCount}
                totalHours={pricing.totalHours}
                sessionCost={pricing.sessionCost}
                serviceFee={pricing.serviceFee}
                promoDiscount={appliedDiscount}
                total={pricing.subtotal - appliedDiscount}
              />
            }
          />
          </>
        )}

        {flowStep === 4 && (
          <>
            <button
              type="button"
              onClick={() => setFlowStep(3)}
              className="mb-4 text-sm font-medium text-brand-medium-blue hover:underline"
            >
              ← Back to Upload Materials
            </button>
            {bookingError && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {bookingError}
              </p>
            )}
            <BookSessionReviewBooking
            tutorFirstName={tutorFirstName(tutorData.name)}
            subjects={subjects}
            subjectDisplayLine={subjectDisplayLine}
            selectedSubject={selectedSubject}
            onSelectSubject={setSelectedSubject}
            selectedSessions={selectedSessions}
            learnerProfiles={learnerProfiles}
            reviewActiveLearner={reviewActiveLearner}
            onReviewActiveLearnerChange={setReviewActiveLearner}
            reviewView={reviewView}
            onReviewViewChange={setReviewView}
            hourlyRate={tutorData.rate}
            serviceFeePerSession={SERVICE_FEE_PER_SESSION}
            onEditSessions={() => setFlowStep(1)}
            pricingSummary={
              <BookSessionPricingSummary
                sessionCount={selectedSessions.length}
                learnerCount={pricing.learnerCount}
                totalHours={pricing.totalHours}
                sessionCost={pricing.sessionCost}
                serviceFee={pricing.serviceFee}
                promoDiscount={appliedDiscount}
                creditApplied={pricing.creditApplied}
                total={pricing.total}
                discountCode={discountCode}
                onDiscountCodeChange={(v) => {
                  setDiscountCode(v);
                  setCodeValidation(null);
                }}
                onApplyPromo={handleValidateDiscountCode}
                validatingCode={validatingCode}
                codeValidation={codeValidation}
                showActions
                onPayNow={handleConfirmBooking}
                onAddToCart={() =>
                  setBookingError('Cart checkout coming soon. Use Pay Now to submit.')
                }
                onCancelAll={handleCancelAll}
                isSubmitting={isBooking}
              />
            }
            />
          </>
        )}

        {calendarSlots.length === 0 && !loadingAvailability && flowStep === 1 && (
          <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              This tutor has no available time slots at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookSession;
