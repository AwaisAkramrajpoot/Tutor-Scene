import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../Layout';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNonSystemNotifications,
  notifyNotificationsUpdated,
} from '../../services/notificationsService';
import {
  normalizeNotification,
  TYPE_ICON_COLOR,
} from '../../utils/notificationHelpers';
import BookingRequestDetailModal from './BookingRequestDetailModal';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'Sessions', label: 'Sessions' },
  { id: 'Messages', label: 'Messages' },
  { id: 'Support', label: 'Support' },
];

const FILTER_OPTIONS = [
  { id: 'all', label: 'All notifications' },
  { id: 'unread', label: 'Unread only' },
  { id: 'Sessions', label: 'Sessions' },
  { id: 'Messages', label: 'Messages' },
  { id: 'Support', label: 'Support' },
];

const SESSION_TYPES = ['booking_confirmation', 'booking_request', 'cancellation', 'session_reminder'];

const formatDetailDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const datePart = d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const timePart = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${datePart} • ${timePart}`;
};

const SwipeableNotificationRow = ({ item, isSelected, onSelect, onDelete, children }) => {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);

  const onTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e) => {
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) setOffset(Math.min(diff, 88));
  };

  const onTouchEnd = () => {
    if (offset > 44) setOffset(88);
    else setOffset(0);
  };

  return (
    <div className="relative overflow-hidden border-b border-gray-100">
      <div className="absolute inset-y-0 right-0 flex w-[88px] items-center justify-center bg-red-500">
        <button
          type="button"
          onClick={() => {
            onDelete(item);
            setOffset(0);
          }}
          disabled={item.isSystem}
          className="text-sm font-semibold text-white disabled:opacity-40"
        >
          Delete
        </button>
      </div>
      <div
        className={`relative transition-transform ${isSelected ? 'bg-blue-50' : 'bg-white'}`}
        style={{ transform: `translateX(-${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <button type="button" onClick={() => onSelect(item)} className="w-full text-left">
          {children}
        </button>
      </div>
    </div>
  );
};

const TutorNotificationsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterValue, setFilterValue] = useState('all');
  const [busy, setBusy] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState(null);
  const [prospectId, setProspectId] = useState(null);
  const userIdRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setError('Not signed in');
        return;
      }
      const user = JSON.parse(userStr);
      userIdRef.current = user.id;
      setProspectId(user.prospectId || null);
      const res = await getNotifications(user.id);
      const list = (Array.isArray(res) ? res : res?.data || []).map((n) =>
        normalizeNotification(n, 'tutor'),
      );
      setItems(list);
      setError(null);
      setSelected((prev) => {
        if (prev) return list.find((n) => n.id === prev.id) || list[0] || null;
        return list[0] || null;
      });
    } catch {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((n) => {
    const tab = filterValue !== 'all' ? filterValue : activeTab;
    if (tab === 'unread') return !n.isRead;
    if (tab === 'all') return true;
    return n.category === tab;
  });

  const markItemRead = async (item) => {
    if (!item || item.isRead || !userIdRef.current) return item;
    await markNotificationAsRead(userIdRef.current, item.id);
    const updated = { ...item, isRead: true };
    setItems((prev) =>
      prev.map((n) => (n.id === item.id ? updated : n)),
    );
    setSelected((prev) => (prev?.id === item.id ? updated : prev));
    notifyNotificationsUpdated();
    return updated;
  };

  const handleSelect = async (item) => {
    setSelected(item);
    await markItemRead(item);
  };

  const handleDelete = async (item) => {
    if (item.isSystem || !userIdRef.current) return;
    try {
      await deleteNotification(userIdRef.current, item.id);
      const next = items.filter((n) => n.id !== item.id);
      setItems(next);
      if (selected?.id === item.id) setSelected(next[0] || null);
    } catch {
      setError('Could not delete notification');
    }
  };

  const handleMarkAllRead = async () => {
    if (!userIdRef.current) return;
    setBusy(true);
    await markAllNotificationsAsRead(userIdRef.current);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (selected) setSelected({ ...selected, isRead: true });
    notifyNotificationsUpdated();
    setBusy(false);
  };

  const handleDeleteAll = async () => {
    if (!userIdRef.current || !window.confirm('Delete all notifications except Tutor Scene system messages?')) {
      return;
    }
    setBusy(true);
    await deleteAllNonSystemNotifications(userIdRef.current);
    const remaining = items.filter((n) => n.isSystem);
    setItems(remaining);
    setSelected(remaining[0] || null);
    setBusy(false);
  };

  const openMessages = async () => {
    if (!selected) return;
    await markItemRead(selected);

    const conversationId = selected.metadata?.conversationId;
    if (conversationId) {
      navigate(`/messages?conversation=${conversationId}`);
      return;
    }

    const messageRequestId = selected.metadata?.messageRequestId;
    if (messageRequestId) {
      navigate(`/messages?request=${messageRequestId}`);
      return;
    }

    navigate('/messages');
  };

  const sessionLink = '/tutor/session-history';

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-brand-dark-blue">Notifications</h1>
          <p className="mt-2 text-gray-600">
            Review session reminders, booking confirmations, cancellation alerts, messages from
            learners, and support notices in one place.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-brand-dark-blue">All Notifications</h2>
              <p className="text-sm text-gray-500">
                Select a notification on the left to view full details on the right.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterOpen((o) => !o)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Filter ▾
                </button>
                {filterOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {FILTER_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setFilterValue(opt.id);
                          setActiveTab(opt.id);
                          setFilterOpen(false);
                        }}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleMarkAllRead}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Mark all as read
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={handleDeleteAll}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                Delete All*
              </button>
            </div>
          </div>
          <p className="px-6 pb-2 text-xs text-gray-500">*Except Tutor Scene system messages.</p>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-brand-medium-blue" />
            </div>
          ) : error ? (
            <p className="px-6 py-8 text-red-600">{error}</p>
          ) : (
            <div className="flex min-h-[520px] flex-col lg:flex-row">
              <div className="lg:w-[42%] border-b lg:border-b-0 lg:border-r border-gray-200">
                <div className="flex gap-2 overflow-x-auto px-4 py-3 border-b border-gray-100">
                  {FILTER_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        setFilterValue(tab.id);
                      }}
                      className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                        activeTab === tab.id
                          ? 'bg-brand-medium-blue text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="max-h-[480px] overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="px-4 py-8 text-sm text-gray-500">No notifications in this view.</p>
                  ) : (
                    filtered.map((n) => (
                      <SwipeableNotificationRow
                        key={n.id}
                        item={n}
                        isSelected={selected?.id === n.id}
                        onSelect={handleSelect}
                        onDelete={handleDelete}
                      >
                        <div className="flex items-start gap-3 px-4 py-4">
                          <div
                            className={`mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full ${
                              TYPE_ICON_COLOR[n.type] || TYPE_ICON_COLOR.general
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {n.relativeTime}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-1">{n.preview}</p>
                          </div>
                          {!n.isRead && (
                            <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                          )}
                        </div>
                      </SwipeableNotificationRow>
                    ))
                  )}
                </div>
              </div>

              <div className="flex-1 p-6">
                {!selected ? (
                  <p className="text-gray-500 text-sm">Select a notification to view details.</p>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-brand-dark-blue">{selected.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {formatDetailDate(selected.createdAt)}
                          {selected.relativeTime ? ` • ${selected.relativeTime}` : ''}
                        </p>
                      </div>
                      {!selected.isRead && (
                        <span className="h-2.5 w-2.5 rounded-full bg-red-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                      <p className="font-semibold text-gray-900 mb-2">
                        {selected.type === 'booking_confirmation'
                          ? 'A session has been confirmed'
                          : selected.type === 'booking_request'
                            ? 'A learner sent a booking request'
                            : selected.title}
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selected.notification || selected.preview}
                      </p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      {selected.type === 'booking_request' && selected.metadata?.bookingId && (
                        <button
                          type="button"
                          onClick={() => setDetailBookingId(selected.metadata.bookingId)}
                          className="rounded-lg bg-brand-medium-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark-blue"
                        >
                          View Request Details
                        </button>
                      )}
                      {SESSION_TYPES.includes(selected.type) && selected.type !== 'booking_request' && (
                        <Link
                          to={sessionLink}
                          className="rounded-lg bg-brand-medium-blue px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark-blue"
                        >
                          View Session
                        </Link>
                      )}
                      {selected.type === 'message' && (
                        <button
                          type="button"
                          onClick={openMessages}
                          className="rounded-lg border-2 border-brand-medium-blue px-5 py-2.5 text-sm font-medium text-brand-medium-blue hover:bg-brand-light-blue/20"
                        >
                          Open Message
                        </button>
                      )}
                    </div>
                    <p className="mt-8 text-xs text-gray-500">
                      System messages from Tutor Scene cannot be deleted. Unread notifications are
                      marked with a red dot. Swipe left on a notification to delete it.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <BookingRequestDetailModal
        open={Boolean(detailBookingId)}
        bookingId={detailBookingId}
        prospectId={prospectId}
        onClose={() => setDetailBookingId(null)}
      />
    </Layout>
  );
};

export default TutorNotificationsPage;
