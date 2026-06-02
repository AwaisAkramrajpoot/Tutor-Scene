const STORAGE_KEY = "tutorSceneConversationControls";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeStore(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function conversationKey(conversationId) {
  return String(conversationId);
}

export function getConversationSettings(conversationId) {
  const store = readStore();
  return store.conversations?.[conversationKey(conversationId)] || {};
}

export function getBlockedUsers(currentUserId) {
  const store = readStore();
  return store.blocks?.[String(currentUserId)] || {};
}

export function isConversationMuted(conversationId) {
  const settings = getConversationSettings(conversationId);
  if (!settings.mutedUntil) return false;
  if (settings.mutedUntil === "until_off") return true;
  return Date.now() < Number(settings.mutedUntil);
}

export function getConversationMuteOption(conversationId) {
  if (!isConversationMuted(conversationId)) return null;
  const settings = getConversationSettings(conversationId);
  if (settings.muteOption) return settings.muteOption;
  if (settings.mutedUntil === "until_off") return "until_off";
  return "until_off";
}

export function clearConversationMute(conversationId) {
  return setConversationMute(conversationId, null);
}

export function isConversationRestricted(conversationId) {
  return Boolean(getConversationSettings(conversationId).restricted);
}

export function isUserBlocked(currentUserId, otherUserId) {
  const blocks = getBlockedUsers(currentUserId);
  return Boolean(blocks[String(otherUserId)]);
}

export function setConversationMute(conversationId, option) {
  const store = readStore();
  if (!store.conversations) store.conversations = {};
  const key = conversationKey(conversationId);
  const current = store.conversations[key] || {};

  if (!option) {
    delete current.mutedUntil;
    delete current.muteOption;
  } else if (option === "8h") {
    current.mutedUntil = Date.now() + 8 * 60 * 60 * 1000;
    current.muteOption = "8h";
  } else if (option === "24h") {
    current.mutedUntil = Date.now() + 24 * 60 * 60 * 1000;
    current.muteOption = "24h";
  } else if (option === "until_off") {
    current.mutedUntil = "until_off";
    current.muteOption = "until_off";
  }

  store.conversations[key] = current;
  writeStore(store);
  window.dispatchEvent(new CustomEvent("conversation-controls-changed"));
  return current;
}

export function setConversationRestricted(conversationId, restricted) {
  const store = readStore();
  if (!store.conversations) store.conversations = {};
  const key = conversationKey(conversationId);
  const current = store.conversations[key] || {};

  if (restricted) {
    current.restricted = true;
    if (!current.mutedUntil) {
      current.mutedUntil = "until_off";
      current.muteOption = "until_off";
    }
  } else {
    delete current.restricted;
  }

  if (!Object.keys(current).length) {
    delete store.conversations[key];
  } else {
    store.conversations[key] = current;
  }

  writeStore(store);
  window.dispatchEvent(new CustomEvent("conversation-controls-changed"));
  return current;
}

export function clearConversationRestriction(conversationId) {
  return setConversationRestricted(conversationId, false);
}

export function setUserBlocked(currentUserId, otherUserId, blocked) {
  const store = readStore();
  if (!store.blocks) store.blocks = {};
  const userKey = String(currentUserId);
  if (!store.blocks[userKey]) store.blocks[userKey] = {};
  if (blocked) {
    store.blocks[userKey][String(otherUserId)] = true;
  } else {
    delete store.blocks[userKey][String(otherUserId)];
  }
  writeStore(store);
  window.dispatchEvent(new CustomEvent("conversation-controls-changed"));
}

export function clearUserBlock(currentUserId, otherUserId) {
  return setUserBlocked(currentUserId, otherUserId, false);
}

export function saveConversationReport(payload) {
  const store = readStore();
  if (!store.reports) store.reports = [];
  store.reports.push({
    id: `report-${Date.now()}`,
    status: "pending",
    ...payload,
    createdAt: new Date().toISOString(),
  });
  writeStore(store);
  window.dispatchEvent(new CustomEvent("conversation-report-submitted"));
}

export function getConversationReports() {
  const store = readStore();
  return store.reports || [];
}

export function buildMessageSnippetsForReport(messages, limit = 5) {
  return (messages || [])
    .slice(-limit)
    .map((message) => ({
      id: message.id,
      content: String(message.content || "").slice(0, 500),
      senderId: message.senderId,
      createdAt: message.createdAt,
    }))
    .filter((message) => message.content);
}

export function formatTutorSubjectsLabel(subjects) {
  if (!subjects) return "Tutor";
  const list = String(subjects)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!list.length) return "Tutor";
  const names = list.slice(0, 3).map((item) => {
    const dash = item.indexOf(" - ");
    return dash > 0 ? item.slice(dash + 3).trim() : item;
  });
  return `${names.join(", ")} Tutor`;
}

export function searchMessagesInConversation(messages, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return [];
  return (messages || [])
    .filter((m) => {
      const content = String(m.content || "").trim();
      return content && content.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getSearchMatchIndexes(text, query) {
  const source = String(text || "");
  const q = String(query || "").trim();
  if (!q) return [];
  const lower = source.toLowerCase();
  const needle = q.toLowerCase();
  const indexes = [];
  let start = 0;
  while (start < lower.length) {
    const idx = lower.indexOf(needle, start);
    if (idx === -1) break;
    indexes.push(idx);
    start = idx + needle.length;
  }
  return indexes;
}
