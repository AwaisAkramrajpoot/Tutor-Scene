import { isTutorApproved } from "./tutorProspectStatus";

export function isVerificationStepComplete(user, prospect) {
  if (user?.verificationCompleted) return true;
  try {
    if (sessionStorage.getItem("tutorVerificationSubmitted") === "1") return true;
  } catch {
    /* ignore */
  }
  if (prospect?.govId) return true;
  return false;
}

export function isInterviewStepComplete(user, virtualData) {
  return !!(virtualData?.completed || user?.interviewCompleted);
}

export function hasCompletedTutorOnboardingFlow(user, options = {}) {
  if (!user || user.role !== "tutor") return false;
  if (isTutorApproved(user)) return true;
  const { virtualData, prospect } = options;
  return (
    isInterviewStepComplete(user, virtualData) &&
    isVerificationStepComplete(user, prospect)
  );
}

export async function refreshTutorSessionOnboardingFlags(apiUrl, token, user) {
  let virtualData = null;
  let prospect = null;

  try {
    const virtualRes = await fetch(`${apiUrl}/api/v1/interviews/virtual/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (virtualRes.ok) {
      virtualData = await virtualRes.json();
    }
  } catch {
    /* ignore */
  }

  try {
    const prospectRes = await fetch(`${apiUrl}/api/v1/onboarding/tutor/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (prospectRes.ok) {
      const data = await prospectRes.json();
      prospect = data?.prospect ?? data?.data?.prospect ?? null;
    }
  } catch {
    /* ignore */
  }

  const interviewCompleted = isInterviewStepComplete(user, virtualData);
  const verificationCompleted = isVerificationStepComplete(user, prospect);

  const nextUser = {
    ...user,
    interviewCompleted,
    verificationCompleted,
  };
  localStorage.setItem("user", JSON.stringify(nextUser));

  return { user: nextUser, virtualData, prospect };
}

export function resolveTutorPostLoginPath({
  prospectStatus,
  publishedStatus,
  hasPendingProfileUpdate,
  paymentOnBoarded,
  interviewCompleted,
  verificationCompleted,
}) {
  const status = String(prospectStatus || "");
  const isApproved =
    status === "active" ||
    publishedStatus === "active" ||
    hasPendingProfileUpdate;

  if (isApproved) {
    if (paymentOnBoarded === false) return "/tutor/wallet";
    return "/tutor-dashboard";
  }

  if (status === "awaiting_interview") {
    if (!interviewCompleted) return "/interviews";
    if (!verificationCompleted) return "/verify-identity";
    return "/ready-to-teach";
  }

  if (status === "pending") {
    if (!interviewCompleted) return "/interviews";
    if (!verificationCompleted) return "/verify-identity";
    return "/ready-to-teach";
  }

  return "/create-profile";
}
