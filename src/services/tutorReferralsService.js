import { apiRequest } from '../utils/api';

export const getTutorReferralSummary = () =>
  apiRequest('/api/v1/tutor-referrals/summary');

export const getTutorReferralProgram = () =>
  apiRequest('/api/v1/tutor-referrals/program');

export const getReferralProgramContent = () =>
  apiRequest('/api/v1/tutor-referrals/program-content');

export const updateReferralProgramContent = (payload) =>
  apiRequest('/api/v1/tutor-referrals/program-content', 'PATCH', payload);
