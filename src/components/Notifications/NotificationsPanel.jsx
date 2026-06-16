import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getNotifications } from '../../services/notificationsService';
import { getConversations } from '../../services/messagingService';
import { useNavigate } from 'react-router-dom';
import {
  normalizeNotification,
  NOTIFICATION_EMPTY_STATE_COPY,
  getNotificationsPagePath,
  TYPE_ICON_COLOR,
} from '../../utils/notificationHelpers';

const PANEL_PREVIEW_LIMIT = 5;

const getTimeLabel = (dateString) => {
  let date;
  if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('T')) {
    date = new Date(dateString);
  } else {
    date = new Date(dateString + 'Z');
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const notificationDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notificationDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (notificationDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};

const NotificationsPanel = ({ showStripeButton = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState('student');
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnread = async () => {
      try {
        const conversations = await getConversations();
        const total = conversations.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0
        );
        setUnreadCount(total);
      } catch {
        setUnreadCount(0);
      }
    };
    loadUnread();
    const t = setInterval(loadUnread, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('User not found');
          return;
        }

        const user = JSON.parse(userStr);
        const role = user.role === 'tutor' ? 'tutor' : 'student';
        setUserRole(role);

        const response = await getNotifications(user.id);

        const notificationsData = (Array.isArray(response)
          ? response
          : (response.data || [])
        ).map((n) => normalizeNotification(n, role));

        setNotifications(notificationsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  const notificationsPath = getNotificationsPagePath(userRole);
  const previewItems = notifications.slice(0, PANEL_PREVIEW_LIMIT);
  const emptyStateCopy = NOTIFICATION_EMPTY_STATE_COPY[userRole] || NOTIFICATION_EMPTY_STATE_COPY.student;

  return (
    <div className="space-y-4">

      {/* Messages Card */}
      <div
        onClick={() => navigate('/messages')}
        className="bg-white rounded-xl shadow-md p-4 flex items-center justify-between cursor-pointer hover:shadow-lg transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-100 text-brand-medium-blue">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        </div>

        <div className="relative min-w-[1.5rem] flex justify-end">
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold min-w-[1.25rem] h-6 px-1.5 rounded-full flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>

      {/* Stripe — tutor dashboard only (never shown on learner dashboard) */}
      {showStripeButton && userRole === 'tutor' && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => window.open('https://dashboard.stripe.com/login', '_blank', 'noopener,noreferrer')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition"
          >
            Connect to Stripe
          </button>
          <p className="text-xs text-gray-500 mt-2">
            To receive payouts, sign into your Stripe Connect account.
          </p>
        </div>
      )}

      {/* Notifications */}
      <article className="bg-white rounded-2xl border border-black/10 p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h2 className="text-lg font-semibold text-[#101727]">
              Notifications
            </h2>
          </div>
          {notifications.length > 0 && (
            <Link
              to={notificationsPath}
              className="text-sm font-medium text-brand-medium-blue hover:underline whitespace-nowrap"
            >
              View all
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-6 space-y-3">
            <p className="text-gray-500 text-sm">No notifications yet.</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              {emptyStateCopy}
            </p>
            <Link
              to={notificationsPath}
              className="inline-block text-sm font-medium text-brand-medium-blue hover:underline"
            >
              View notifications page
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto max-h-[400px] pr-1">
              <ul className="space-y-3">
                {previewItems.map((notification, index) => (
                  <li
                    key={notification.id}
                    className={`pb-3 ${
                      index < previewItems.length - 1
                        ? 'border-b border-gray-200'
                        : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                          TYPE_ICON_COLOR[notification.type] || TYPE_ICON_COLOR.general
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-[#101727]">
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                          {notification.preview}
                        </p>
                        <time className="text-xs text-gray-500 mt-1 block">
                          {notification.relativeTime || getTimeLabel(notification.createdAt)}
                        </time>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {notifications.length > PANEL_PREVIEW_LIMIT && (
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <Link
                  to={notificationsPath}
                  className="text-sm font-medium text-brand-medium-blue hover:underline"
                >
                  View all {notifications.length} notifications
                </Link>
              </div>
            )}
          </>
        )}
      </article>

    </div>
  );
};

export default NotificationsPanel;
