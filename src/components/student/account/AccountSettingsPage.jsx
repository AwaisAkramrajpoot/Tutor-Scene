import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser } from '../../../utils/api';
import {
  fetchAccountSettings,
  updateAccountPhone,
  updateNotificationPreferences,
  changePassword,
  setTwoFactor,
} from '../../../services/studentAccountService';

const NOTIFICATION_GROUPS = [
  { key: 'sessionReminders', label: 'Session reminders' },
  { key: 'bookingConfirmations', label: 'Booking confirmations' },
  { key: 'cancellationAlerts', label: 'Cancellation alerts' },
  { key: 'messagesFromTutors', label: 'Messages from tutors' },
  { key: 'messagesFromSupport', label: 'Messages from Tutor Scene Support' },
];

const CHANNELS = ['email', 'sms', 'push'];

const AccountSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdMsg, setPwdMsg] = useState('');
  const [prefs, setPrefs] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccountSettings();
      setSettings(data);
      setPhone(data?.profile?.phoneNumber || '');
      setPrefs(data?.notificationPreferences || {});
    } catch {
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePhoneSave = async () => {
    setSavingPhone(true);
    try {
      const data = await updateAccountPhone(phone);
      setSettings(data);
      const u = getCurrentUser();
      if (u) {
        localStorage.setItem(
          'user',
          JSON.stringify({ ...u, phoneNumber: phone }),
        );
      }
    } finally {
      setSavingPhone(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwdMsg('');
    if (pwd.next !== pwd.confirm) {
      setPwdMsg('New passwords do not match.');
      return;
    }
    try {
      await changePassword(pwd.current, pwd.next);
      setPwdMsg('Password updated. A confirmation email was sent.');
      setPwd({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwdMsg(err?.message || 'Could not change password.');
    }
  };

  const togglePref = async (groupKey, channel) => {
    const next = {
      ...prefs,
      [groupKey]: {
        ...(prefs[groupKey] || {}),
        [channel]: !prefs?.[groupKey]?.[channel],
      },
    };
    setPrefs(next);
    try {
      await updateNotificationPreferences(next);
    } catch {
      setPrefs(prefs);
    }
  };

  const handle2FA = async () => {
    const enabled = !settings?.security?.twoFactorEnabled;
    try {
      await setTwoFactor(enabled);
      await load();
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-500">
        Loading account settings…
      </div>
    );
  }

  const profile = settings?.profile || {};

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-brand-dark-blue mb-2">Account Settings</h1>
        <p className="text-gray-600 mb-8">
          Manage security and notifications. Edit your profile photo and learners on the{' '}
          <Link to="/profile" className="text-brand-medium-blue font-medium hover:underline">
            Profile
          </Link>{' '}
          page.
        </p>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-1">1. Profile Information</h2>
          <p className="text-sm text-gray-500 mb-4">Read-only here. Edit on Profile page.</p>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">First name</dt>
              <dd className="font-medium">{profile.firstName}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Last name</dt>
              <dd className="font-medium text-gray-400 italic">Admin view only on site</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium flex items-center gap-2">
                {profile.email}
                {profile.emailVerified && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone number</dt>
              <dd>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  onClick={handlePhoneSave}
                  disabled={savingPhone}
                  className="mt-2 text-sm bg-brand-medium-blue text-white px-4 py-1.5 rounded-lg hover:bg-brand-dark-blue disabled:opacity-50"
                >
                  {savingPhone ? 'Saving…' : 'Save phone'}
                </button>
              </dd>
            </div>
          </dl>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4">2. Security</h2>
          <form onSubmit={handlePassword} className="space-y-3 max-w-md mb-6">
            <p className="text-sm font-medium text-gray-700">Change password</p>
            <input
              type="password"
              placeholder="Current password"
              value={pwd.current}
              onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="New password"
              value={pwd.next}
              onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
              minLength={8}
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              required
            />
            {pwdMsg && <p className="text-sm text-gray-600">{pwdMsg}</p>}
            <button
              type="submit"
              className="bg-brand-medium-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark-blue"
            >
              Update password
            </button>
          </form>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Email verification</p>
              <p className="text-sm text-gray-600">
                {profile.emailVerified ? 'Verified' : 'Not verified — check your inbox'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium">Two-factor authentication</p>
                <p className="text-xs text-gray-500">Recommended minimum</p>
              </div>
              <button
                type="button"
                onClick={handle2FA}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  settings?.security?.twoFactorEnabled
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {settings?.security?.twoFactorEnabled ? 'Enabled' : 'Enable'}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-brand-dark-blue mb-4">3. Notification Preferences</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Type</th>
                  {CHANNELS.map((c) => (
                    <th key={c} className="py-2 px-2 capitalize">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_GROUPS.map(({ key, label }) => (
                  <tr key={key} className="border-b border-gray-100">
                    <td className="py-3 pr-4 font-medium">{label}</td>
                    {CHANNELS.map((ch) => (
                      <td key={ch} className="py-3 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={Boolean(prefs?.[key]?.[ch])}
                          onChange={() => togglePref(key, ch)}
                          className="rounded text-brand-medium-blue"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
