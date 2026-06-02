import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import UserAvatar from "../UserAvatar";
import { searchMessagesInConversation } from "../../../utils/conversationControls";
import { formatMessageDate, formatMessageTime } from "../../../utils/messagingHelpers";

function highlightText(text, query) {
  const source = String(text || "");
  const q = String(query || "").trim();
  if (!q) return source;
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = source.split(new RegExp(`(${escaped})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === q.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="bg-yellow-200 px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const ConversationSearchOverlay = ({
  open,
  onClose,
  query,
  onQueryChange,
  messages,
  otherUser,
  currentUser,
  loading = false,
  onSelectResult,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () => searchMessagesInConversation(messages, query),
    [messages, query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  if (!open) return null;

  const current = results[activeIndex] || null;

  const getMessageSender = (message) =>
    message.senderId === currentUser?.id ? currentUser : otherUser;

  const handleJumpTo = (message) => {
    if (!message) return;
    onSelectResult?.(message);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-start justify-center bg-black/40 p-4 pt-16 md:justify-end md:pr-8 md:pt-24">
      <div className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search in conversation..."
              className="min-w-0 flex-1 text-sm outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange("")}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          {query ? (
            <span className="shrink-0 text-xs text-gray-500">
              {results.length ? `${activeIndex + 1} / ${results.length}` : "0 / 0"}
            </span>
          ) : null}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              disabled={!results.length || activeIndex <= 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              aria-label="Previous result"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={!results.length || activeIndex >= results.length - 1}
              onClick={() => setActiveIndex((i) => Math.min(results.length - 1, i + 1))}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              aria-label="Next result"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-500 hover:bg-gray-100"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-y-auto">
          <div className="border-b border-gray-100 px-4 py-2 text-sm font-medium text-gray-700">
            Search Results in Conversation
          </div>
          {loading ? (
            <p className="px-4 py-6 text-sm text-gray-500">Loading conversation history...</p>
          ) : !query ? (
            <p className="px-4 py-6 text-sm text-gray-500">Type to search within this conversation.</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-gray-500">No messages found for &quot;{query}&quot;.</p>
          ) : (
            results.map((message, index) => {
              const sender = getMessageSender(message);
              const isActive = index === activeIndex;

              return (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(index);
                    handleJumpTo(message);
                  }}
                  className={`flex w-full items-start gap-3 border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 ${
                    isActive ? "bg-blue-50" : ""
                  }`}
                >
                  <UserAvatar user={sender} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {sender?.firstName || "User"}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {formatMessageDate(message.createdAt)}{" "}
                          {formatMessageTime(message.createdAt)}
                        </span>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${
                            isActive ? "bg-brand-medium-blue" : "bg-gray-300"
                          }`}
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      {highlightText(message.content, query)}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {query && results.length > 0 ? (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              {results.length} result{results.length === 1 ? "" : "s"} for &quot;
              <mark className="bg-yellow-200 px-0.5 rounded">{query}</mark>&quot;
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleJumpTo(current)}
                className="text-brand-medium-blue hover:text-brand-dark-blue"
              >
                Jump to result
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded p-1 text-gray-400 hover:bg-gray-100"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ConversationSearchOverlay;
