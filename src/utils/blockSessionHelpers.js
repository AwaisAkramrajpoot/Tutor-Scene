import { apiRequest } from "./api";

function formatBlockSessionWhen(startTime, endTime) {
  if (!startTime) return "Upcoming session";
  const start = new Date(startTime);
  const end = endTime ? new Date(endTime) : null;
  const weekday = start.toLocaleDateString("en-US", { weekday: "short" });
  const month = start.getMonth() + 1;
  const day = start.getDate();
  const startLabel = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const endLabel = end
    ? end.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
    : "";
  return endLabel
    ? `${weekday}, ${month}.${day} ${startLabel} - ${endLabel}`
    : `${weekday}, ${month}.${day} ${startLabel}`;
}

function rawSessionMatchesCounterparty(session, otherUser, tutorProspectId, currentUserRole) {
  if (!otherUser?.id) return false;

  if (currentUserRole === "student") {
    const tutorUserId = session.tutor?.userId;
    const tutorProfileId = session.tutorProfileId || session.tutor?.id;
    if (tutorUserId && String(tutorUserId) === String(otherUser.id)) return true;
    if (tutorProspectId && tutorProfileId && String(tutorProfileId) === String(tutorProspectId)) {
      return true;
    }
    return false;
  }

  if (currentUserRole === "tutor") {
    const studentId = session.studentProfileId || session.student?.id;
    return Boolean(studentId && String(studentId) === String(otherUser.id));
  }

  return false;
}

function mapBookingToBlockSession(session) {
  const student = session.student || {};
  const studentFirstName = student.firstName || "";
  const studentLastName = student.lastName || "";
  const studentName = [studentFirstName, studentLastName].filter(Boolean).join(" ") || "Student";
  const gradeLevel = student.gradeLevel || student.grade || session.gradeLevel || "";
  const gradeLabel = gradeLevel
    ? `${gradeLevel}${String(gradeLevel).toLowerCase().includes("grade") ? "" : " Grade"} Student`
    : "Student";

  return {
    id: session.id,
    whenLabel: formatBlockSessionWhen(session.startTime, session.endTime),
    subjectLabel: session.subject?.name || session.subjectName || session.subject || "Session",
    studentName,
    studentFirstName: studentFirstName || studentName.split(/\s+/)[0] || "Student",
    studentGradeLabel: gradeLabel,
    studentPhotoUrl: student.profilePhotoUrl || student.profilePic || null,
    sessionIdLabel: session.referenceNumber || String(session.id),
    startTime: session.startTime,
  };
}

async function fetchPaginatedSessions(url) {
  let page = 1;
  let totalPages = 1;
  const all = [];

  while (page <= totalPages) {
    const separator = url.includes("?") ? "&" : "?";
    const response = await apiRequest(`${url}${separator}page=${page}&limit=50`);
    const list = response.data || response.sessions || [];
    if (Array.isArray(list)) all.push(...list);
    totalPages = response.totalPages || 1;
    page += 1;
  }

  return all;
}

export async function fetchUpcomingSessionsForBlock({
  currentUser,
  otherUser,
  tutorProspectId = null,
}) {
  if (!currentUser?.id || !otherUser?.id) return [];

  try {
    let sessions = [];

    if (currentUser.role === "student") {
      sessions = await fetchPaginatedSessions(
        `/api/v1/bookings/student/${currentUser.id}/sessions?status=upcoming`,
      );
    } else if (currentUser.role === "tutor" && (currentUser.prospectId || tutorProspectId)) {
      const tutorId = currentUser.prospectId || tutorProspectId;
      sessions = await fetchPaginatedSessions(
        `/api/v1/bookings/tutor/${tutorId}/sessions?status=upcoming`,
      );
    }

    return sessions
      .filter((session) =>
        rawSessionMatchesCounterparty(session, otherUser, tutorProspectId, currentUser.role),
      )
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map(mapBookingToBlockSession);
  } catch {
    return [];
  }
}

export async function cancelSessionsForBlock(sessions) {
  const results = await Promise.allSettled(
    (sessions || []).map((session) =>
      apiRequest(`/api/v1/bookings/${session.id}/cancel`, { method: "PATCH" }),
    ),
  );
  return results.filter((result) => result.status === "rejected");
}
