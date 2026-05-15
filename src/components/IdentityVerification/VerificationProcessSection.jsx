import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { markVerificationStarted, runTutorVerificationSubmit } from "../../utils/tutorVerificationSubmit";
import { VerificationPageFooter } from "./VerificationPageFooter";

const identityVerificationUrl =
  process.env.REACT_APP_IDENTITY_VERIFICATION_URL || "https://withpersona.com";

const TERMS_SESSION_KEY = "tutorBgCheckTermsAccepted";

export const VerificationProcessSection = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [ackChecked, setAckChecked] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(TERMS_SESSION_KEY) === "1") {
      setTermsAccepted(true);
    }
  }, []);

  const verificationReasons = [
    "Build trust with learners who rely on our platform.",
    "Maintain the highest safety standards in online education.",
  ];

  const handleStartBackgroundCheck = async () => {
    if (!termsAccepted) return;
    try {
      setSubmitting(true);
      await runTutorVerificationSubmit();
      navigate("/verify-identity/status");
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to start background check");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="relative grid w-full grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center text-2xl text-blue-600">🛡️</div>
            <h2 className="text-4xl font-normal text-[#101727]">Identity Verification</h2>
          </div>

          <p className="mb-4 text-base leading-relaxed text-[#495565]">
            To maintain a safe and trusted platform, all tutors must complete identity verification. This
            process is quick, secure, and confidential.
          </p>
          <p className="mb-8 text-base leading-relaxed text-[#495565]">
            Tutor Scene uses a secure third-party to conduct this service.
          </p>

          <button
            type="button"
            onClick={() => {
              markVerificationStarted();
              window.open(identityVerificationUrl, "_blank", "noopener,noreferrer");
            }}
            className="mb-8 h-14 w-full rounded-xl bg-[#C99700] text-2xl font-normal text-white shadow transition-opacity hover:opacity-95"
          >
            Get Verified
          </button>

          <div className="border-t border-gray-200 pt-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <h3 className="text-3xl font-normal text-[#353E4C]">Background Check</h3>
            </div>
            <p className="mb-3 text-sm leading-relaxed text-[#495565]">
              All tutors are required to undergo a comprehensive background check, performed by a trusted
              third-party service that specializes in background screenings.
            </p>
            <p className="mb-2 text-sm text-[#495565]">
              Please take a moment to review and accept the{" "}
              <button
                type="button"
                onClick={() => {
                  setAckChecked(false);
                  setTermsOpen(true);
                }}
                className="text-[#1F57A2] underline"
              >
                Background Check Requirement & Refund Credit Terms
              </button>
              .
            </p>
            <p className="mb-6 text-xs text-[#697282]">
              NOTE: There is a small fee associated with this service.
            </p>

            <button
              type="button"
              onClick={handleStartBackgroundCheck}
              disabled={!termsAccepted || submitting}
              className={`h-14 w-full rounded-xl text-2xl font-normal shadow-sm transition-opacity ${
                termsAccepted && !submitting
                  ? "bg-[#C99700] text-white hover:opacity-95"
                  : "cursor-not-allowed bg-[#e8eaed] text-[#9a7b1a]"
              }`}
            >
              {submitting ? "Starting…" : "Start Background Check"}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="h-96 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=600&fit=crop"
              alt="Professional tutor"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.innerHTML =
                  '<div class="w-full h-full flex items-center justify-center text-6xl text-gray-400">👨‍🏫</div>';
              }}
            />
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] p-8">
            <h3 className="mb-6 text-2xl font-normal text-white">Why We Verify Tutors</h3>
            <ul className="m-0 list-none space-y-5 p-0">
              {verificationReasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
                    <span className="text-lg font-medium text-[#2A66B8]">✓</span>
                  </div>
                  <p className="pt-2 text-base leading-relaxed text-white/90">{reason}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <VerificationPageFooter />

      {termsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-xl border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3">
              <h3 className="text-xl font-semibold text-[#364152]">
                Background Check Requirement & Refund Credit Terms.
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTermsOpen(false);
                  setAckChecked(false);
                }}
                className="text-2xl leading-none text-gray-500 hover:text-gray-800"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-5">
              <p className="mb-8 text-base leading-relaxed text-[#353E4C]">
                I acknowledge that a background check is mandatory to tutor on the platform and that I am
                responsible for paying the background check fee upfront. I understand that the platform may,
                in its discretion, issue a refund equivalent as an account credit to my available balance
                only if I (i) complete five (5) or more tutoring hours (verified by the platform) within
                thirty (30) days of becoming an active member, and (ii) remain in good standing and fully
                compliant with all platform policies and requirements. I understand that the credit is not
                cash, is non-transferable, and may be withheld or reversed if hours are found to be invalid,
                disputed, or obtained in violation of platform rules.
              </p>

              <label className="mb-6 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={ackChecked}
                  onChange={(e) => setAckChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2563eb]"
                />
                <span className="text-lg font-semibold text-[#353E4C]">
                  I acknowledge and accept the Background Check Requirement & Refund Credit Terms.
                </span>
              </label>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setTermsOpen(false);
                    setAckChecked(false);
                  }}
                  className="h-10 rounded-md border-2 border-[#e57373] bg-white px-6 text-[#c62828]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!ackChecked}
                  onClick={() => {
                    setTermsAccepted(true);
                    sessionStorage.setItem(TERMS_SESSION_KEY, "1");
                    setTermsOpen(false);
                  }}
                  className={`h-10 rounded-md px-8 text-white ${
                    ackChecked ? "bg-[#2A66B8] hover:opacity-95" : "cursor-not-allowed bg-gray-300 text-gray-500"
                  }`}
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
