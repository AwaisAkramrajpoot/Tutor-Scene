import { apiRequest } from '../utils/api';

export const getTutorEarningsHistory = (userId, params = {}) => {
  const qs = new URLSearchParams();
  if (params.sort) qs.set('sort', params.sort);
  if (params.status) qs.set('status', params.status);
  if (params.paymentStatus) qs.set('paymentStatus', params.paymentStatus);
  const query = qs.toString();
  return apiRequest(
    `/api/v1/bookings/tutor-user/${userId}/earnings-history${query ? `?${query}` : ''}`,
  );
};

export const getStripeDashboardLink = (userId) =>
  apiRequest(`/api/v1/onboarding/stripe-dashboard-link/${userId}`);

export const getStripeOnboardingLink = (userId) =>
  apiRequest(`/api/v1/onboarding/stripe-onboarding-link/${userId}`);
