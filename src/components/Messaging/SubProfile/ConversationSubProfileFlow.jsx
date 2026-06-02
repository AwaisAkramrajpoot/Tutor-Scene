import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  BellOff,
  CheckCircle2,
  ChevronRight,
  CircleSlash,
  Hand,
  Search,
  ShieldAlert,
  TriangleAlert,
  User,
  X,
} from "lucide-react";
import UserAvatar from "../UserAvatar";
import { apiRequest } from "../../../utils/api";
import {
  cancelSessionsForBlock,
  fetchUpcomingSessionsForBlock,
} from "../../../utils/blockSessionHelpers";
import {
  formatTutorSubjectsLabel,
  getConversationMuteOption,
  isConversationMuted,
  isConversationRestricted,
  isUserBlocked,
  saveConversationReport,
  buildMessageSnippetsForReport,
  setConversationMute,
  setConversationRestricted,
  setUserBlocked,
} from "../../../utils/conversationControls";
import { useConversationControlsVersion } from "../../../hooks/useConversationControls";

const MuteNotificationsModal = ({ open, onClose, otherUser, conversationId, onMuted }) => {
  const [selected, setSelected] = useState("until_off");
  const [currentlyMuted, setCurrentlyMuted] = useState(false);

  useEffect(() => {
    if (!open || !conversationId) return;
    const muted = isConversationMuted(conversationId);
    setCurrentlyMuted(muted);
    setSelected(getConversationMuteOption(conversationId) || "until_off");
  }, [open, conversationId]);

  if (!open) return null;

  const options = [
    { id: "8h", label: "Mute for 8 hours" },
    { id: "24h", label: "Mute for 24 hours" },
    { id: "until_off", label: "Mute until turned back on" },
  ];

  const handleUnmute = () => {
    setConversationMute(conversationId, null);
    onMuted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-brand-gold bg-white shadow-xl">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex justify-center">
            <UserAvatar user={otherUser} size="xl" />
          </div>
          <h3 className="text-xl font-semibold text-brand-dark-blue">Mute Notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            For the conversation with {otherUser?.firstName || "this user"}
          </p>
        </div>
        <div className="px-4 pb-2">
          {options.map((option) => {
            const isSelected = selected === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelected(option.id)}
                className={`mb-2 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                  isSelected
                    ? "border-brand-medium-blue bg-blue-50"
                    : "border-gray-200"
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-medium-blue" />
                ) : (
                  <Bell className="h-5 w-5 text-brand-medium-blue" />
                )}
                <span className="flex-1 text-sm font-medium text-gray-800">{option.label}</span>
                {isSelected ? (
                  <span className="text-brand-medium-blue">✓</span>
                ) : null}
              </button>
            );
          })}
          {currentlyMuted ? (
            <button
              type="button"
              onClick={handleUnmute}
              className="mb-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-brand-medium-blue hover:bg-gray-50"
            >
              Turn notifications back on
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setConversationMute(conversationId, selected);
              onMuted?.();
              onClose();
            }}
            className="rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white"
          >
            {currentlyMuted ? "Update mute" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
};

const RestrictUserModal = ({ open, onClose, otherUser, conversationId, isRestricted, onRestricted }) => {
  if (!open) return null;

  const firstName = otherUser?.firstName || "User";

  const handleRestrict = () => {
    setConversationRestricted(conversationId, true);
    onRestricted?.();
    onClose();
  };

  const handleUnrestrict = () => {
    setConversationRestricted(conversationId, false);
    onRestricted?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border-2 border-brand-gold bg-white shadow-xl">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex justify-center">
            <UserAvatar user={otherUser} size="xl" />
          </div>
          <h3 className="text-xl font-semibold text-brand-dark-blue">Restrict {firstName}</h3>
        </div>
        <div className="px-6 pb-2 text-sm leading-relaxed text-gray-700">
          {isRestricted ? (
            <>
              <p className="font-medium text-gray-900">
                This conversation is in General. Notifications are turned off, but you can still
                read messages and search this thread.
              </p>
              <p className="mt-4 text-gray-600">
                Move it back to your main inbox to restore its usual place in Messages.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-gray-900">
                Restrict this conversation? It will move out of your main inbox and notifications
                will be turned off.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5">
                <li>{firstName} will only be able to send you limited messages.</li>
              </ul>
              <p className="mt-4 text-gray-600">
                {firstName} will not be notified of this action. You may still view their profile
                and report or fully block them at any time.
              </p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          {isRestricted ? (
            <button
              type="button"
              onClick={handleUnrestrict}
              className="rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white"
            >
              Move to Primary
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRestrict}
              className="rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white"
            >
              Restrict User
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const BlockSessionCard = ({ session }) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
    <p className="font-medium text-gray-900">{session.whenLabel}</p>
    <p className="text-brand-medium-blue">{session.subjectLabel}</p>
    <div className="mt-3 flex items-center gap-3">
      <div className="h-9 w-9 overflow-hidden rounded-full bg-gray-200">
        {session.studentPhotoUrl ? (
          <img
            src={session.studentPhotoUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-600">
            {session.studentFirstName?.[0] || "S"}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{session.studentName}</p>
        <p className="text-xs text-gray-500">{session.studentGradeLabel}</p>
        <p className="text-xs text-gray-400">Session ID: {session.sessionIdLabel}</p>
      </div>
    </div>
  </div>
);

const BlockUserModal = ({
  open,
  onClose,
  otherUser,
  currentUser,
  conversationId,
  upcomingSessions,
  sessionsLoading = false,
  isBlocked = false,
  onBlocked,
}) => {
  const hasUpcoming = !isBlocked && upcomingSessions.length > 0;
  const firstName = otherUser?.firstName || "User";
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleBlock = async () => {
    setSubmitting(true);
    try {
      if (hasUpcoming) {
        await cancelSessionsForBlock(upcomingSessions);
      }
      setUserBlocked(currentUser.id, otherUser.id, true);
      setConversationMute(conversationId, "until_off");
      onBlocked?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnblock = () => {
    setUserBlocked(currentUser.id, otherUser.id, false);
    onBlocked?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border-2 border-brand-gold bg-white shadow-xl">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex justify-center">
            <UserAvatar user={otherUser} size="xl" />
          </div>
          <h3 className="flex items-center justify-center gap-2 text-xl font-semibold text-red-600">
            <Hand className="h-5 w-5" />
            {isBlocked ? `Unblock ${firstName}?` : `Block ${firstName}?`}
          </h3>
        </div>
        <div className="min-h-[160px] max-h-[50vh] overflow-y-auto px-6 pb-2 text-sm leading-relaxed text-gray-700">
          {isBlocked ? (
            <>
              <p>
                Unblock this user? {firstName} will be able to message you through Tutor Scene again.
              </p>
              <p className="mt-3 font-medium text-amber-700">You can block them again at any time.</p>
            </>
          ) : hasUpcoming ? (
            <>
              <p>
                Blocking {firstName} will cancel the sessions listed below. Are you sure you want to
                block this user?
              </p>
              <p className="mt-3 font-medium text-amber-700">
                These sessions will be canceled immediately if you block {firstName}.
              </p>
              <p className="mt-3 text-sm text-amber-700">
                This conversation is tied to upcoming session
                {upcomingSessions.length > 1 ? "s" : ""}. Blocking will affect communication for all
                listed learners.
              </p>
              <div className="mt-4 space-y-3">
                {upcomingSessions.map((session) => (
                  <BlockSessionCard key={session.id} session={session} />
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 text-xs text-amber-700">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Blocking will cancel the above session(s) immediately. Cancellations will be
                  subject to Tutor Scene&apos;s cancellation policy.
                </p>
              </div>
            </>
          ) : sessionsLoading ? (
            <p className="text-gray-500">Checking for upcoming sessions...</p>
          ) : (
            <>
              <p>
                Block this user? {firstName} will no longer be able to message you through Tutor
                Scene.
              </p>
              <p className="mt-3 font-medium text-amber-700">This action can be undone.</p>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          {isBlocked ? (
            <button
              type="button"
              onClick={handleUnblock}
              className="rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white"
            >
              Unblock User
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBlock}
              disabled={submitting || sessionsLoading}
              className="rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting
                ? "Blocking..."
                : hasUpcoming
                  ? "Confirm & Block"
                  : "Block User"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const REPORT_REASONS = [
  "Harassment",
  "Spam",
  "Inappropriate language",
  "Safety concern",
  "Misleading behavior",
  "Other",
];

const ReportUserModal = ({
  open,
  onClose,
  otherUser,
  currentUser,
  conversationId,
  recentMessages = [],
  onReported,
}) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setReason("");
      setDetails("");
      setSubmitted(false);
    }
  }, [open]);

  if (!open) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl border-2 border-brand-gold bg-white px-6 py-8 text-center shadow-xl">
          <h3 className="text-xl font-semibold text-brand-dark-blue">Report submitted</h3>
          <p className="mt-3 text-sm text-gray-600">
            Your report has been submitted.
          </p>
          <button
            type="button"
            onClick={() => {
              onReported?.();
              onClose();
            }}
            className="mt-6 w-full rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border-2 border-brand-gold bg-white shadow-xl">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex justify-center">
            <UserAvatar user={otherUser} size="xl" />
          </div>
          <h3 className="text-xl font-semibold text-brand-dark-blue">
            Report {otherUser?.firstName || "User"}
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Please select a reason and provide any additional details to report this user to Tutor
            Scene.
          </p>
        </div>
        <div className="px-6 pb-2">
          <p className="mb-3 text-sm font-medium text-gray-800">What would you like to report?</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REPORT_REASONS.map((item) => (
              <label
                key={item}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  reason === item ? "border-brand-medium-blue bg-blue-50" : "border-gray-200"
                }`}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={item}
                  checked={reason === item}
                  onChange={() => setReason(item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Additional details (optional)"
            className="mt-4 min-h-[96px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-gray-500">
            Submitting a report will alert Tutor Scene&apos;s support team. Reporting does not
            automatically block the user.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason || submitting}
            onClick={() => {
              if (!reason || submitting) return;
              setSubmitting(true);
              saveConversationReport({
                reason,
                details: details.trim(),
                conversationId,
                reportedUserId: otherUser?.id,
                reportedUserName: otherUser?.firstName || null,
                reportingUserId: currentUser?.id,
                reportingUserName: currentUser?.firstName || null,
                messageSnippets: buildMessageSnippetsForReport(recentMessages),
              });
              setSubmitting(false);
              setSubmitted(true);
            }}
            className="rounded-xl bg-brand-medium-blue py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ConversationSubProfileModal = ({
  open,
  onClose,
  otherUser,
  currentUser,
  conversation,
  subjectsLabel,
  prospectId,
  profileLoading,
  onViewProfile,
  onSearchConversations,
  onOpenMute,
  onOpenRestrict,
  onOpenBlock,
  onOpenReport,
  isMuted = false,
  isRestricted = false,
}) => {
  if (!open || !otherUser) return null;

  const isStudent = currentUser?.role === "student";

  const menuItems = [
    isStudent
      ? {
          key: "profile",
          label: profileLoading ? "View Profile..." : "View Profile",
          icon: User,
          onClick: onViewProfile,
          disabled: profileLoading || !prospectId,
        }
      : null,
    {
      key: "search",
      label: "Search Conversations",
      icon: Search,
      onClick: onSearchConversations,
    },
    {
      key: "mute",
      label: isMuted ? "Notifications muted" : "Mute Notifications",
      icon: isMuted ? BellOff : Bell,
      onClick: onOpenMute,
    },
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="relative px-6 pt-6 pb-4 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mx-auto mb-3 flex justify-center">
            <UserAvatar user={otherUser} size="xl" />
          </div>
          <h3 className="text-2xl font-semibold text-brand-dark-blue">{otherUser.firstName}</h3>
          <p className="mt-1 text-sm text-gray-500">{subjectsLabel}</p>
        </div>

        <div className="border-t border-gray-100">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.disabled ? undefined : item.onClick}
                disabled={item.disabled}
                className={`flex w-full items-center gap-3 border-b border-gray-100 px-6 py-4 text-left ${
                  item.disabled
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <Icon className="h-5 w-5 text-brand-medium-blue" />
                <span className="flex-1 text-sm font-medium text-gray-800">{item.label}</span>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-3 px-4 py-4">
          <button
            type="button"
            onClick={onOpenRestrict}
            className={`rounded-xl border px-2 py-3 text-xs font-medium ${
              isRestricted
                ? "border-brand-medium-blue bg-blue-50 text-brand-medium-blue"
                : "border-gray-200 text-gray-700"
            }`}
          >
            <CircleSlash
              className={`mx-auto mb-1 h-4 w-4 ${
                isRestricted ? "text-brand-medium-blue" : "text-gray-500"
              }`}
            />
            {isRestricted ? "Restricted" : "Restrict"}
          </button>
          <button
            type="button"
            onClick={onOpenBlock}
            className="rounded-xl border border-gray-200 px-2 py-3 text-xs font-semibold text-red-600"
          >
            <CircleSlash className="mx-auto mb-1 h-4 w-4 text-red-600" />
            Block
          </button>
          <button
            type="button"
            onClick={onOpenReport}
            className="rounded-xl border border-brand-gold px-2 py-3 text-xs font-medium text-amber-700"
          >
            <ShieldAlert className="mx-auto mb-1 h-4 w-4 text-amber-600" />
            Report
          </button>
        </div>

        <div className="px-4 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gray-100 py-3 text-sm font-medium text-gray-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const ConversationSubProfileFlow = ({
  open,
  onClose,
  otherUser,
  currentUser,
  conversation,
  onSearchConversations,
  onViewProfile,
  onControlsChanged,
  recentMessages = [],
}) => {
  const controlsVersion = useConversationControlsVersion();
  const [subjectsLabel, setSubjectsLabel] = useState("Tutor");
  const [prospectId, setProspectId] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [muteOpen, setMuteOpen] = useState(false);
  const [restrictOpen, setRestrictOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (!open || !otherUser || !currentUser) return;

    const loadMeta = async () => {
      if (currentUser.role !== "student") {
        setSubjectsLabel("Learner");
        setProspectId(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProspectId(null);

      try {
        const data = await apiRequest(
          `/api/v1/conversations/student/${currentUser.id}/recent-tutors`,
        );
        const list = Array.isArray(data) ? data : data.data || [];
        const match = list.find(
          (item) =>
            item.conversationId === conversation?.id ||
            String(item.tutorId) === String(otherUser.id) ||
            String(item.tutor?.id) === String(otherUser.id),
        );
        const subjects = match?.prospectInfo?.subjects || match?.subjects;
        setSubjectsLabel(formatTutorSubjectsLabel(subjects));
        setProspectId(match?.prospectInfo?.id || null);
      } catch {
        setSubjectsLabel("Tutor");
        setProspectId(null);
      } finally {
        setProfileLoading(false);
      }
    };

    loadMeta();
  }, [open, otherUser?.id, currentUser?.id, currentUser?.role, conversation?.id]);

  useEffect(() => {
    if (!blockOpen) {
      setUpcomingSessions([]);
      setSessionsLoading(false);
      return;
    }
    if (!currentUser?.id || !otherUser?.id) return;

    let cancelled = false;

    const loadSessions = async () => {
      setSessionsLoading(true);
      try {
        const sessions = await fetchUpcomingSessionsForBlock({
          currentUser,
          otherUser,
          tutorProspectId: prospectId,
        });
        if (!cancelled) setUpcomingSessions(sessions);
      } catch {
        if (!cancelled) setUpcomingSessions([]);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    };

    loadSessions();
    return () => {
      cancelled = true;
    };
  }, [blockOpen, currentUser?.id, otherUser?.id, prospectId]);

  const handleViewProfile = () => {
    if (!prospectId) return;
    onClose();
    onViewProfile?.(prospectId);
  };

  const handleSearch = () => {
    onClose();
    onSearchConversations?.();
  };

  const notifyChanged = () => {
    onControlsChanged?.();
  };

  const blocked = useMemo(
    () => isUserBlocked(currentUser?.id, otherUser?.id),
    [currentUser?.id, otherUser?.id, controlsVersion],
  );

  const isMuted = useMemo(
    () => isConversationMuted(conversation?.id),
    [conversation?.id, controlsVersion],
  );

  const isRestricted = useMemo(
    () => isConversationRestricted(conversation?.id),
    [conversation?.id, controlsVersion],
  );

  if (blocked) {
    return (
      <BlockUserModal
        open={open}
        onClose={onClose}
        otherUser={otherUser}
        currentUser={currentUser}
        conversationId={conversation?.id}
        upcomingSessions={[]}
        isBlocked
        onBlocked={notifyChanged}
      />
    );
  }

  return (
    <>
      <ConversationSubProfileModal
        open={open}
        onClose={onClose}
        otherUser={otherUser}
        currentUser={currentUser}
        conversation={conversation}
        subjectsLabel={subjectsLabel}
        prospectId={prospectId}
        profileLoading={profileLoading}
        onViewProfile={handleViewProfile}
        onSearchConversations={handleSearch}
        onOpenMute={() => {
          onClose();
          setMuteOpen(true);
        }}
        onOpenRestrict={() => {
          onClose();
          setRestrictOpen(true);
        }}
        onOpenBlock={() => {
          onClose();
          setBlockOpen(true);
        }}
        onOpenReport={() => {
          onClose();
          setReportOpen(true);
        }}
        isMuted={isMuted}
        isRestricted={isRestricted}
      />
      <MuteNotificationsModal
        open={muteOpen}
        onClose={() => setMuteOpen(false)}
        otherUser={otherUser}
        conversationId={conversation?.id}
        onMuted={notifyChanged}
      />
      <RestrictUserModal
        open={restrictOpen}
        onClose={() => setRestrictOpen(false)}
        otherUser={otherUser}
        conversationId={conversation?.id}
        isRestricted={isRestricted}
        onRestricted={notifyChanged}
      />
      <BlockUserModal
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        otherUser={otherUser}
        currentUser={currentUser}
        conversationId={conversation?.id}
        upcomingSessions={upcomingSessions}
        sessionsLoading={sessionsLoading}
        onBlocked={notifyChanged}
      />
      <ReportUserModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        otherUser={otherUser}
        currentUser={currentUser}
        conversationId={conversation?.id}
        recentMessages={recentMessages}
        onReported={notifyChanged}
      />
    </>
  );
};

export default ConversationSubProfileFlow;
