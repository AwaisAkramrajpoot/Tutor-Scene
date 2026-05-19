export const TUTOR_ONBOARDING_PATHS = [
  "/create-profile",
  "/interviews",
  "/verify-identity",
  "/profile-under-review",
  "/ready-to-teach",
  "/become-tutor",
];

export const TUTOR_PAYMENT_SETUP_PATHS = [
  "/tutor/wallet",
  "/tutor/onboarding/refresh",
  "/tutor/onboarding/complete",
];

export function isTutorOnboardingPath(pathname) {
  if (!pathname) return false;
  return TUTOR_ONBOARDING_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isTutorPaymentSetupPath(pathname) {
  if (!pathname) return false;
  return TUTOR_PAYMENT_SETUP_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function isPublicMarketingPath(pathname) {
  if (!pathname) return false;
  return (
    pathname === "/" ||
    pathname === "/about" ||
    pathname === "/signin" ||
    pathname === "/signup" ||
    pathname === "/become-tutor"
  );
}

export function isTutorApproved(user) {
  if (!user || user.role !== "tutor") return false;
  if (user.hasPendingProfileUpdate) return true;
  return user.prospectStatus === "active" || user.publishedStatus === "active";
}

export function isTutorInInitialOnboarding(user) {
  if (!user || user.role !== "tutor") return false;
  if (user.hasPendingProfileUpdate) return false;
  const status = String(user.prospectStatus || "");
  if (!status || status === "not_started") return true;
  return status === "pending" || status === "awaiting_interview";
}

export function shouldForcePaymentSetup(user, pathname) {
  if (!user || user.role !== "tutor") return false;
  if (user.hasPendingProfileUpdate) return false;
  if (!isTutorApproved(user)) return false;
  if (isTutorInInitialOnboarding(user)) return false;
  if (user.paymentOnBoarded === true) return false;
  if (isTutorOnboardingPath(pathname)) return false;
  if (isTutorPaymentSetupPath(pathname)) return false;
  if (isPublicMarketingPath(pathname)) return false;
  return true;
}

export function mergeProspectStatusIntoUser(user, statusPayload) {
  if (!user) return user;
  const status = statusPayload?.status ?? statusPayload?.data?.status;
  const publishedStatus = statusPayload?.publishedStatus;
  const hasPendingProfileUpdate = Boolean(statusPayload?.hasPendingProfileUpdate);

  if (hasPendingProfileUpdate && publishedStatus === "active") {
    return {
      ...user,
      prospectStatus: "active",
      publishedStatus: "active",
      hasPendingProfileUpdate: true,
    };
  }

  return {
    ...user,
    prospectStatus: status ?? user.prospectStatus,
    publishedStatus: publishedStatus ?? user.publishedStatus,
    hasPendingProfileUpdate,
  };
}

export function mergeOnboardingSubmitIntoUser(user, submitResponse) {
  if (!user) return user;
  const prospect = submitResponse?.prospect;
  const hasPendingProfileUpdate = Boolean(submitResponse?.hasPendingProfileUpdate);
  const publishedProspectId = submitResponse?.publishedProspectId;

  if (hasPendingProfileUpdate) {
    return {
      ...user,
      prospectStatus: "active",
      publishedStatus: "active",
      hasPendingProfileUpdate: true,
      prospectId:
        publishedProspectId != null
          ? String(publishedProspectId)
          : user.prospectId,
    };
  }

  const next = {
    ...user,
    hasPendingProfileUpdate: false,
  };
  if (prospect?.status != null) {
    next.prospectStatus = String(prospect.status);
    if (prospect.status === "active") {
      next.publishedStatus = "active";
    }
  }
  if (publishedProspectId != null) {
    next.prospectId = String(publishedProspectId);
  } else if (prospect?.id != null) {
    next.prospectId = String(prospect.id);
  }
  return next;
}
