export function isTutorApproved(user) {
  if (!user || user.role !== "tutor") return false;
  return user.prospectStatus === "active" || user.publishedStatus === "active";
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
