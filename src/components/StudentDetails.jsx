import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  pending: 'bg-amber-100 text-amber-800',
  suspended: 'bg-red-100 text-red-800',
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiRequest(`/api/v1/users/students/${id}`);
        setStudent(data.student || data);
        setLearners(Array.isArray(data.learners) ? data.learners : []);
      } catch (err) {
        console.error('Failed to fetch student:', err);
        setError(err.message || 'Failed to load student details');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  const handleSuspendStudent = async () => {
    if (!student?.id) {
      setError('Invalid student data');
      return;
    }

    try {
      setSuspending(true);
      setError(null);

      await apiRequest(`/api/v1/users/${student.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'suspended',
          suspensionReason,
        }),
      });

      setSuccessMessage('Student suspended successfully.');
      setShowSuspendModal(false);
      setSuspensionReason('');
      setStudent((prev) =>
        prev
          ? { ...prev, status: 'suspended', suspensionReason }
          : prev,
      );
    } catch (err) {
      console.error('Failed to suspend student:', err);
      setError(err.message || 'Failed to suspend student');
    } finally {
      setSuspending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-medium-blue mx-auto" />
          <p className="mt-4 text-gray-600 text-lg">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Student
          </h2>
          <p className="text-gray-600 mb-6">{error || 'Student not found'}</p>
          <button
            type="button"
            onClick={() =>
              navigate('/admin-dashboard', { state: { activeTab: 'students' } })
            }
            className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 py-2 rounded-lg font-medium shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const fullName =
    student.fullName ||
    `${student.firstName || ''} ${student.lastName || ''}`.trim() ||
    'Student';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() =>
            navigate('/admin-dashboard', { state: { activeTab: 'students' } })
          }
          className="flex items-center text-brand-medium-blue hover:text-brand-dark-blue mb-6 font-medium"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-green-800 font-medium">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0">
              {student.profilePhotoUrl ? (
                <img
                  src={student.profilePhotoUrl}
                  alt={fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-brand-gold"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-brand-light-blue flex items-center justify-center border-4 border-brand-gold text-5xl">
                  {student.avatarIcon || fullName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <p className="text-sm font-medium text-brand-medium-blue uppercase tracking-wide mb-1">
                Guardian / Account Holder
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    STATUS_COLORS[student.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {(student.status || 'unknown').replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-gray-500 text-sm">User ID: {student.id}</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Joined:</strong> {formatDate(student.createdAt)}
                </p>
                <p>
                  <strong>Last login:</strong> {formatDateTime(student.lastLoginAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Account Information
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="font-medium text-gray-500">Email</dt>
                  <dd className="text-gray-900 mt-1">{student.email || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Phone</dt>
                  <dd className="text-gray-900 mt-1">{student.phoneNumber || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Gender</dt>
                  <dd className="text-gray-900 mt-1">{student.gender || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Email verified</dt>
                  <dd className="text-gray-900 mt-1">
                    {student.emailVerified ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Registers self as learner</dt>
                  <dd className="text-gray-900 mt-1">
                    {student.registersSelfAsLearner ? 'Yes' : 'No'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-500">Available credits</dt>
                  <dd className="text-gray-900 mt-1">
                    ${Number(student.availableCredits || 0).toFixed(2)}
                  </dd>
                </div>
                {student.referralCode && (
                  <div>
                    <dt className="font-medium text-gray-500">Referral code</dt>
                    <dd className="text-gray-900 mt-1">{student.referralCode}</dd>
                  </div>
                )}
                {student.suspensionReason && (
                  <div className="sm:col-span-2">
                    <dt className="font-medium text-gray-500">Suspension reason</dt>
                    <dd className="text-gray-900 mt-1">{student.suspensionReason}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Learners ({learners.length})
              </h2>
              {learners.length === 0 ? (
                <p className="text-gray-500 text-sm">No learner profiles on file.</p>
              ) : (
                <div className="space-y-4">
                  {learners.map((learner) => {
                    const learnerName = [
                      learner.learnerFirstName,
                      learner.learnerLastName,
                    ]
                      .filter(Boolean)
                      .join(' ')
                      .trim();

                    return (
                      <div
                        key={learner.learnerLabel || learner.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl" aria-hidden="true">
                            {learner.avatarIcon || '👤'}
                          </span>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">
                              {learnerName || learner.learnerLabel}
                              {learner.isSelf ? (
                                <span className="ml-2 text-xs font-medium text-brand-medium-blue">
                                  (Self)
                                </span>
                              ) : null}
                            </p>
                            <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <div>
                                <span className="font-medium text-gray-500">
                                  Relationship:{' '}
                                </span>
                                {learner.relationshipToLearner || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">
                                  Grade level:{' '}
                                </span>
                                {learner.gradeLevel || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">
                                  Gender:{' '}
                                </span>
                                {learner.gender || 'N/A'}
                              </div>
                              <div>
                                <span className="font-medium text-gray-500">
                                  Profile status:{' '}
                                </span>
                                {learner.profileStatus || learner.status || 'N/A'}
                              </div>
                            </dl>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <button
                type="button"
                onClick={() => setShowSuspendModal(true)}
                disabled={student.status === 'suspended'}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                Suspend Student
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Suspend Student</h3>
            <p className="text-gray-600 mb-4">
              You are about to suspend <strong>{fullName}</strong>. Please provide a reason.
            </p>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
              placeholder="e.g., Violated terms of service"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none mb-6"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspensionReason('');
                }}
                disabled={suspending}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSuspendStudent}
                disabled={suspending || !suspensionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50"
              >
                {suspending ? 'Suspending...' : 'Suspend Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
