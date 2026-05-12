import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../Layout';
import { getNotifications } from '../../services/notificationsService';

const getTimeLabel = (dateString) => {
  if (!dateString) return '';
  let date;
  if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('T')) {
    date = new Date(dateString);
  } else {
    date = new Date(`${dateString}Z`);
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StudentNotificationsPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const run = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setError('Not signed in');
          return;
        }
        const user = JSON.parse(userStr);
        const res = await getNotifications(user.id);
        const list = Array.isArray(res) ? res : res?.data || [];
        setItems(list);
        setError(null);
      } catch {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <Link to="/dashboard" className="text-sm text-brand-medium-blue hover:underline">
            Back to Dashboard
          </Link>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Session reminders, booking confirmations, cancellation alerts, messages from tutors, and messages from Tutor Scene Support appear here.
        </p>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-medium-blue" />
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">No notifications yet.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((n) => (
              <li key={n.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-gray-900 text-sm">{n.notification}</p>
                <time className="text-xs text-gray-500 mt-2 block">{getTimeLabel(n.createdAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
};

export default StudentNotificationsPage;
