import { getCurrentUser, submitTutorOnboarding } from "./api";
import { mergeOnboardingSubmitIntoUser } from "./tutorProspectStatus";
import { getTutorOnboarding, clearTutorOnboarding } from "./onboarding";

export const BACKGROUND_CHECK_PROVIDER_URL =
  process.env.REACT_APP_BACKGROUND_CHECK_URL || "https://www.checkr.com";

export function getPostBackgroundCheckPath() {
  return "/ready-to-teach";
}

export function markVerificationStarted() {
  const userStr = localStorage.getItem("user");
  if (userStr) {
    const u = JSON.parse(userStr);
    localStorage.setItem("user", JSON.stringify({ ...u, verificationCompleted: true }));
  }
}

export async function runTutorVerificationSubmit() {
  markVerificationStarted();
  const user = getCurrentUser();
  const userId = user?.id || user?._id || user?.userId;
  if (!userId) throw new Error("User not found in local storage");
  const ob = getTutorOnboarding();
  const payload = {
    userId,
    fullName: ob.fullName,
    dateOfBirth: ob.dateOfBirth,
    subjects: ob.subjects || "",
    gradeLevels: ob.gradeLevels || "",
    yearsOfExperience: ob.yearsOfExperience || 0,
    teachingPhilosophy: ob.teachingPhilosophy || "",
    cv: ob.cv,
    profilePic: ob.profilePic,
  };
  const submitResponse = await submitTutorOnboarding(payload);
  clearTutorOnboarding();
  const nextUser = mergeOnboardingSubmitIntoUser(user, submitResponse);
  localStorage.setItem(
    "user",
    JSON.stringify({
      ...nextUser,
      interviewCompleted: true,
      verificationCompleted: true,
    }),
  );
  window.open(BACKGROUND_CHECK_PROVIDER_URL, "_blank", "noopener,noreferrer");
  sessionStorage.setItem("tutorVerificationSubmitted", "1");
}
