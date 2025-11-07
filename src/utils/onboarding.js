// Local storage helpers for tutor onboarding multi-step flow

const KEY = 'tutorOnboarding';

export const getTutorOnboarding = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const setTutorOnboarding = (patch) => {
  const current = getTutorOnboarding();
  const next = { ...current, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

export const clearTutorOnboarding = () => {
  localStorage.removeItem(KEY);
};