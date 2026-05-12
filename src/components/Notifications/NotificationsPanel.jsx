import { useState, useEffect } from 'react';
import { getNotifications } from '../../services/notificationsService';
import { getConversations } from '../../services/messagingService';
import { useNavigate } from 'react-router-dom';

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

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        const response = await getNotifications(user.id);

        const notificationsData = Array.isArray(response)
          ? response
          : (response.data || []);

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

  return (
    <div className="space-y-4">

      {/* 🔹 Messages Card */}
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

      {/* 🔹 Stripe Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => window.open('https://dashboard.stripe.com/login', '_blank', 'noopener,noreferrer')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          Connect to Stripe
        </button>
        <p className="text-xs text-gray-500 mt-2">
          To setup or update your payment method, please sign into Stripe.
        </p>
      </div>

      {/* 🔹 Notifications */}
      <article className="bg-white rounded-2xl border border-black/10 p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🔔</span>
          <h2 className="text-lg font-semibold text-[#101727]">
            Notifications
          </h2>
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
          <div className="text-center py-6 space-y-2">
            <p className="text-gray-500 text-sm">No notifications yet.</p>
            <p className="text-gray-400 text-xs leading-relaxed">
              You will see session reminders, booking confirmations, cancellation alerts, messages from tutors, and messages from Tutor Scene Support here.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[400px] pr-1">
            <ul className="space-y-3">
              {notifications.map((notification, index) => (
                <li
                  key={notification.id}
                  className={`pb-3 ${
                    index < notifications.length - 1
                      ? 'border-b border-gray-200'
                      : ''
                  }`}
                >
                  <p className="text-sm text-[#101727]">
                    {notification.notification}
                  </p>
                  <time className="text-xs text-gray-500 mt-1 block">
                    {getTimeLabel(notification.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>

    </div>
  );
};

export default NotificationsPanel;