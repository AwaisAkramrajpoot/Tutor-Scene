import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const TutorSessionHistoryPage = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          navigate('/signin');
          return;
        }

        const user = JSON.parse(userStr);
        const tutorId = user.prospectId;
        if (!tutorId) {
          setError('Tutor profile not found.');
          return;
        }

        const data = await apiRequest(
          `/api/v1/bookings/tutor/${tutorId}/sessions?status=completed&limit=50`,
        );
        const rows = Array.isArray(data) ? data : data.data || data.sessions || [];
        setSessions(rows);
      } catch (err) {
        console.error(err);
        setError('Failed to load session history.');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [navigate]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-brand-deep-navy">Session History</h1>
          <p className="mt-2 text-gray-600">Completed sessions with your learners.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/tutor-dashboard')}
          className="rounded-lg border border-brand-medium-blue px-4 py-2 text-brand-medium-blue transition-colors hover:bg-brand-light-blue"
        >
          Back to Dashboard
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[240px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-4 border-brand-medium-blue" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-gray-600">
          No completed sessions yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-brand-light-blue/40">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-brand-deep-navy">Date / Time</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-brand-deep-navy">Session ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-brand-deep-navy">Learner</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-brand-deep-navy">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{formatDateTime(session.startTime)}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{session.referenceNumber || session.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {session.student?.firstName
                      ? `${session.student.firstName} ${session.student.lastName || ''}`.trim()
                      : `Learner #${session.studentProfileId}`}
                  </td>
                  <td className="px-6 py-4 text-sm capitalize text-brand-medium-blue">{session.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
