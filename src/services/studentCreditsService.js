import { apiRequest } from '../utils/api';

const BASE = '/api/v1/student-account';

export const getCreditsReferrals = () => apiRequest(`${BASE}/credits-referrals`);

export const applyReferralCode = (code) =>
  apiRequest(`${BASE}/referral-code`, {
    method: 'POST',
    body: JSON.stringify({ code }),
  });

export const getSessionHistory = (params = {}) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.sort) qs.set('sort', params.sort);
  const query = qs.toString();
  return apiRequest(`${BASE}/session-history${query ? `?${query}` : ''}`);
};
