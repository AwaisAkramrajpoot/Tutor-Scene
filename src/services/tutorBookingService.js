import { apiRequest } from '../utils/api';

export const getTutorBookingSettings = (prospectId) =>
  apiRequest(`/api/v1/bookings/tutor/${prospectId}/booking-settings`);

export const updateTutorBookingSettings = (prospectId, autoAcceptBookingRequests) =>
  apiRequest(`/api/v1/bookings/tutor/${prospectId}/booking-settings`, {
    method: 'PATCH',
    body: JSON.stringify({ autoAcceptBookingRequests }),
  });

export const getBookingRequestDetail = (bookingId, prospectId) =>
  apiRequest(`/api/v1/bookings/${bookingId}/detail?prospectId=${prospectId}`);
