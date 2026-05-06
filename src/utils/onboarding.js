const LEGACY_KEY = 'tutorOnboarding';

const scopedKey = (userId) => `tutorOnboarding:${userId}`;

const parseStoredUserId = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u?.userId != null) return String(u.userId);
    if (u?.id != null) return String(u.id);
    return null;
  } catch {
    return null;
  }
};

const resolveNextUserId = (nextUser) => {
  if (!nextUser || typeof nextUser !== 'object') return null;
  if (nextUser.userId != null) return String(nextUser.userId);
  if (nextUser.id != null) return String(nextUser.id);
  return null;
};

export const applyTutorOnboardingStorageForAuthenticatedUser = (nextUser) => {
  const nextId = resolveNextUserId(nextUser);
  if (!nextId) return;
  const prevId = parseStoredUserId();
  if (!prevId || prevId !== nextId) {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {}
  }
};

export const migrateUnscopedTutorOnboardingForCurrentUser = () => {
  const userId = parseStoredUserId();
  if (!userId) return;
  const sk = scopedKey(userId);
  if (localStorage.getItem(sk)) return;
  let legacyRaw;
  try {
    legacyRaw = localStorage.getItem(LEGACY_KEY);
  } catch {
    return;
  }
  if (!legacyRaw) return;
  let parsed;
  try {
    parsed = JSON.parse(legacyRaw);
  } catch {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {}
    return;
  }
  if (!parsed || typeof parsed !== 'object') {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {}
    return;
  }
  if (parsed.ownerUserId != null && String(parsed.ownerUserId) !== userId) {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch (_) {}
    return;
  }
  try {
    localStorage.setItem(sk, JSON.stringify({ ...parsed, ownerUserId: userId }));
    localStorage.removeItem(LEGACY_KEY);
  } catch (_) {}
};

export const getTutorOnboarding = () => {
  const userId = parseStoredUserId();
  if (!userId) return {};
  const sk = scopedKey(userId);
  try {
    const scoped = localStorage.getItem(sk);
    if (!scoped) return {};
    const parsed = JSON.parse(scoped);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

export const setTutorOnboarding = (patch) => {
  const userId = parseStoredUserId();
  if (!userId) return {};
  const key = scopedKey(userId);
  let current = {};
  try {
    const scoped = localStorage.getItem(key);
    if (scoped) current = JSON.parse(scoped);
    if (!current || typeof current !== 'object') current = {};
  } catch {
    current = {};
  }
  const next = { ...current, ...patch, ownerUserId: userId };
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch (_) {}
  return next;
};

export const clearTutorOnboarding = () => {
  const userId = parseStoredUserId();
  if (userId) {
    try {
      localStorage.removeItem(scopedKey(userId));
    } catch (_) {}
  }
};
