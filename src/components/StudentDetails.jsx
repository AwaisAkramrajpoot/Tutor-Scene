import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const StudentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/api/v1/admin/users/${id}`);
      setUser(data);
    } catch (err) {
      setError(err.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUser(); }, [id]);

  const openEdit = () => {
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      gender: user.gender || '',
      status: user.status || '',
      profilePhotoUrl: user.profilePhotoUrl || '',
      availableCredits: user.availableCredits ?? '',
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await apiRequest(`/api/v1/admin/users/${id}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setUser((prev) => ({ ...prev, ...updated }));
      setShowEditModal(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspend = async () => {
    try {
      setSuspending(true);
      await apiRequest(`/api/v1/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'suspended', suspensionReason }),
      });
      setShowSuspendModal(false);
      setSuspensionReason('');
      setSuccessMessage('User suspended successfully!');
      fetchUser();
    } catch (err) {
      setError(err.message || 'Failed to suspend user');
    } finally {
      setSuspending(false);
    }
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-600',
    suspended: 'bg-red-100 text-red-800',
    pending: 'bg-amber-100 text-amber-800',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-brand-medium-blue"></div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-gray-600 mb-6">{error || 'User not found'}</p>
          <button onClick={() => navigate('/admin-dashboard')} className="bg-brand-medium-blue text-white px-6 py-2 rounded-lg">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <button onClick={() => navigate('/admin-dashboard', { state: { activeTab: 'students' } })}
          className="flex items-center text-brand-medium-blue hover:text-brand-dark-blue mb-6 font-medium">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-green-800 font-medium">{successMessage}</span>
            <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">✕</button>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-red-800">{error}</span>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-brand-light-blue flex items-center justify-center border-4 border-brand-gold flex-shrink-0">
              {user.profilePhotoUrl
                ? <img src={user.profilePhotoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                : <span className="text-4xl text-brand-dark-blue font-bold">{user.firstName?.charAt(0)?.toUpperCase() || '?'}</span>
              }
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[user.status] || 'bg-gray-100 text-gray-600'}`}>
                  {user.status?.toUpperCase()}
                </span>
                <span className="text-gray-500 text-sm capitalize">{user.role}</span>
                <span className="text-gray-400 text-sm">ID: {user.id}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['First Name', user.firstName],
                  ['Last Name', user.lastName],
                  ['Email', user.email],
                  ['Phone', user.phoneNumber || '—'],
                  ['Gender', user.gender || '—'],
                  ['Status', user.status],
                  ['Role', user.role],
                  ['Credits', user.availableCredits ?? '0'],
                  ['Email Verified', user.emailVerified ? 'Yes' : 'No'],
                  ['Last Login', user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : '—'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm font-medium text-gray-500">{label}</dt>
                    <dd className="text-gray-900 mt-0.5">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {user.suspensionReason && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <h3 className="font-semibold text-red-800 mb-1">Suspension Reason</h3>
                <p className="text-red-700 text-sm">{user.suspensionReason}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button onClick={openEdit}
                  className="w-full bg-brand-medium-blue hover:bg-brand-dark-blue text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Edit Profile
                </button>
                <button onClick={() => setShowSuspendModal(true)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 my-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
              {[
                { key: 'firstName', label: 'First Name', type: 'text' },
                { key: 'lastName', label: 'Last Name', type: 'text' },
                { key: 'email', label: 'Email', type: 'email' },
                { key: 'phoneNumber', label: 'Phone Number', type: 'text' },
                { key: 'gender', label: 'Gender', type: 'text' },
                { key: 'profilePhotoUrl', label: 'Profile Photo URL', type: 'text' },
                { key: 'availableCredits', label: 'Available Credits', type: 'number' },
              ].map(({ key, label, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input
                    type={type}
                    value={editForm[key] ?? ''}
                    onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue text-sm"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.status ?? ''}
                  onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium-blue text-sm"
                >
                  {['active', 'inactive', 'suspended', 'pending'].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} disabled={saving}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-brand-medium-blue hover:bg-brand-dark-blue text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving && <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Suspend User</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Provide a reason for suspending <strong>{user.firstName} {user.lastName}</strong>.
            </p>
            <textarea
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              rows={4}
              placeholder="e.g., Violated terms of service"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => { setShowSuspendModal(false); setSuspensionReason(''); }} disabled={suspending}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handleSuspend} disabled={suspending || !suspensionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium disabled:opacity-50">
                {suspending ? 'Suspending...' : 'Suspend'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetails;
