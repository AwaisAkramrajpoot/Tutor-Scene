import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { getBookingRequestDetail } from '../../services/tutorBookingService';

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

const STATUS_LABELS = {
  pending: 'Awaiting learner payment',
  confirmed: 'Confirmed',
  tutor_review: 'Pending your review',
};

const TutorSessionDetailModal = ({
  open,
  bookingId,
  prospectId,
  onClose,
  onCancelSession,
}) => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !bookingId || !prospectId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBookingRequestDetail(bookingId, prospectId);
        setBooking(data);
      } catch {
        setError('Could not load session details.');
        setBooking(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, bookingId, prospectId]);

  const subjectName =
    typeof booking?.subject === 'object' && booking?.subject?.name
      ? booking.subject.name
      : booking?.subject || '—';

  const handleManageAvailability = () => {
    onClose();
    navigate('/tutor/availability');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-gray-900">Session Details</span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue" />
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm py-4">{error}</p>
        ) : booking ? (
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-gray-700">Learner</dt>
              <dd className="text-gray-900 mt-1">{booking.student?.firstName || '—'}</dd>
            </div>
            {booking.status && (
              <div>
                <dt className="font-semibold text-gray-700">Status</dt>
                <dd className="text-gray-900 mt-1">
                  {STATUS_LABELS[booking.status] || booking.status}
                </dd>
              </div>
            )}
            {booking.learnerLabel && (
              <div>
                <dt className="font-semibold text-gray-700">Learner profile</dt>
                <dd className="text-gray-900 mt-1">{booking.learnerLabel}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-gray-700">Subject</dt>
              <dd className="text-gray-900 mt-1">{subjectName}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Date</dt>
              <dd className="text-gray-900 mt-1">{formatDate(booking.startTime)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-gray-700">Session time</dt>
              <dd className="text-gray-900 mt-1">
                {formatTime(booking.startTime)} – {formatTime(booking.endTime)}
              </dd>
            </div>
            {booking.referenceNumber && (
              <div>
                <dt className="font-semibold text-gray-700">Reference</dt>
                <dd className="text-gray-900 mt-1">{booking.referenceNumber}</dd>
              </div>
            )}
            {booking.finalPrice != null && (
              <div>
                <dt className="font-semibold text-gray-700">Session price</dt>
                <dd className="text-gray-900 mt-1">${Number(booking.finalPrice).toFixed(2)}</dd>
              </div>
            )}
            {booking.notes && (
              <div>
                <dt className="font-semibold text-gray-700">Notes from learner</dt>
                <dd className="text-gray-900 mt-1 whitespace-pre-wrap">{booking.notes}</dd>
              </div>
            )}
            <p className="text-xs text-gray-500 pt-2">
              To adjust your schedule, update your availability. Contact the learner through
              Messages if you need to coordinate changes.
            </p>
          </dl>
        ) : null}
      </DialogContent>
      <DialogActions className="px-6 pb-4 flex-wrap gap-2">
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        <Button onClick={handleManageAvailability} variant="outlined">
          Manage Availability
        </Button>
        {booking?.status === 'confirmed' && onCancelSession && (
          <Button onClick={() => onCancelSession(booking)} color="error" variant="contained">
            Cancel Session
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TutorSessionDetailModal;
