import { useState, useEffect } from 'react';
import { getNotifications } from '../../services/notificationsService';

const getTimeLabel = (dateString) => {
  // Parse the date string
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
    // Return formatted date like "Dec 15"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
};



const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        
        // Handle both array response and object with data property
        const notificationsData = Array.isArray(response) ? response : (response.data || []);
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
    <article className="bg-white rounded-2xl border border-black/10 p-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl">🔔</span>
        <h2 className="text-2xl text-[#101727]">Notifications</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight: '500px' }}>
          <ul className="space-y-4">
            {notifications.map((notification, index) => (
              <li key={notification.id} className={`pb-4 ${index < notifications.length - 1 ? "border-b border-black/10" : ""}`}>
                <p className="text-[#101727]">{notification.notification}</p>
                <time className="text-[#697282] text-sm mt-1 block">{getTimeLabel(notification.createdAt)}</time>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

export default NotificationsPanel;
