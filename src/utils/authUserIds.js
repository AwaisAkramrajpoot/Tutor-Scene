import { fetchMyTutorProspect } from './api';

/** Resolve the logged-in learner's user id from localStorage. */
export function getStudentProfileId() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user.id ?? user.userId ?? user._id;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Resolve the logged-in tutor's prospect id from localStorage. */
export function getTutorProspectId() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user.prospectId;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Tutor user id — backend resolves prospect id when this is passed. */
export function getTutorUserId() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const user = JSON.parse(raw);
    const id = user.id ?? user.userId;
    if (id == null || id === '') return null;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Resolve tutor prospect id, fetching from API and persisting to localStorage if missing.
 */
export async function resolveTutorProspectId() {
  const cached = getTutorProspectId();
  if (cached) return cached;

  try {
    const prospect = await fetchMyTutorProspect();
    const id = prospect?.id ?? prospect?.data?.id;
    if (id == null) return null;

    const n = Number(id);
    if (!Number.isFinite(n)) return null;

    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      localStorage.setItem(
        'user',
        JSON.stringify({ ...user, prospectId: n }),
      );
    }
    return n;
  } catch {
    return getTutorUserId();
  }
}
