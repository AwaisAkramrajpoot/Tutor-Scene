import { apiRequest } from '../utils/api';

const BASE = '/api/v1/student-account';

export const fetchAccountSettings = () =>
  apiRequest(`${BASE}/settings`, { method: 'GET' });

export const updateAccountPhone = (phoneNumber) =>
  apiRequest(`${BASE}/account`, {
    method: 'PATCH',
    body: JSON.stringify({ phoneNumber }),
  });

export const updateProfile = (payload) =>
  apiRequest(`${BASE}/profile`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const updateNotificationPreferences = (prefs) =>
  apiRequest(`${BASE}/notification-preferences`, {
    method: 'PATCH',
    body: JSON.stringify(prefs),
  });

export const changePassword = (currentPassword, newPassword) =>
  apiRequest(`${BASE}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });

export const setTwoFactor = (enabled) =>
  apiRequest(`${BASE}/two-factor`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });

export const fetchLearners = () =>
  apiRequest(`${BASE}/learners`, { method: 'GET' });

export const upsertLearner = (payload) =>
  apiRequest(`${BASE}/learners`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchRemovalPreview = (learnerLabel) =>
  apiRequest(
    `${BASE}/learners/${encodeURIComponent(learnerLabel)}/removal-preview`,
    { method: 'GET' },
  );

export const removeLearner = (learnerLabel, cancelSessions = false) =>
  apiRequest(
    `${BASE}/learners/${encodeURIComponent(learnerLabel)}?cancelSessions=${cancelSessions}`,
    { method: 'DELETE' },
  );
