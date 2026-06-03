import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BACKGROUND_CHECK_PROVIDER_URL,
  runTutorVerificationSubmit,
  skipVerificationAndContinue,
} from "../../utils/tutorVerificationSubmit";
import { VerificationPageFooter } from "./VerificationPageFooter";
import { showSystemMessage } from '../../utils/systemMessage';

export function VerificationStatusPage() {
  const navigate = useNavigate();
  const [termsOk, setTermsOk] = useState(false);
  const [busy, setBusy] = useState(false);

  const refreshFlags = useCallback(() => {
    setTermsOk(sessionStorage.getItem("tutorBgCheckTermsAccepted") === "1");
  }, []);

  useEffect(() => {
    refreshFlags();
  }, [refreshFlags]);

  const handleStartBackgroundCheck = async () => {
    if (!termsOk) return;
    try {
      setBusy(true);
      if (sessionStorage.getItem("tutorVerificationSubmitted") === "1") {
        window.open(BACKGROUND_CHECK_PROVIDER_URL, "_blank", "noopener,noreferrer");
        return;
      }
      await runTutorVerificationSubmit();
    } catch (err) {
      console.error(err);
      showSystemMessage({ message: err.message || "Failed to start background check", type: "error" });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveAndContinue = () => {
    const path = skipVerificationAndContinue();
    navigate(path);
  };

  const rowClass =
    "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5eaf2] bg-white px-4 py-4 shadow-sm";

  return (
    <div className="w-full min-h-screen bg-[#f5f7fa] pb-16">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <h1 className="mb-6 text-3xl font-semibold text-[#101727]">
              Identification Verification Status
            </h1>

            <button
              type="button"
              onClick={handleStartBackgroundCheck}
              disabled={!termsOk || busy}
              className={`mb-8 h-14 w-full rounded-xl text-xl font-normal shadow transition-opacity ${
                termsOk && !busy
                  ? "bg-[#C99700] text-white hover:opacity-95"
                  : "cursor-not-allowed bg-[#e8eaed] text-[#9a7b1a]"
              }`}
            >
              {busy ? "Starting…" : "Start Background Check"}
            </button>

            <div className="space-y-4">
              <div className={rowClass}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="text-2xl text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  <div>
                    <p className="font-semibold text-[#101727]">Identity Verification</p>
                    <p className="text-sm text-[#697282]">Government ID required.</p>
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Pending
                </span>
              </div>

              <div className={rowClass}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="text-2xl text-amber-600" aria-hidden>
                    ⏳
                  </span>
                  <div>
                    <p className="font-semibold text-[#101727]">Background Check</p>
                    <p className="text-sm text-[#697282]">Automated security screening.</p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Waiting
                </span>
              </div>

              <div className={rowClass}>
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="text-2xl text-[#2563eb]" aria-hidden>
                    👁
                  </span>
                  <div>
                    <p className="font-semibold text-[#101727]">Final Review</p>
                    <p className="text-sm text-[#697282]">
                      Team verification (within 7 business days).
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  Waiting
                </span>
              </div>
            </div>

            <div className="mt-8 rounded-xl border border-[#93c5fd] bg-[#eff6ff] px-4 py-4 text-sm leading-relaxed text-[#1e3a8a]">
              Note: All verifications and background checks are processed securely through our trusted
              partner platforms. Most are completed within 7 business days.
            </div>

            <button
              type="button"
              onClick={handleSaveAndContinue}
              className="mt-8 h-12 w-full rounded-xl bg-[#2A66B8] text-lg font-semibold text-white shadow hover:opacity-95"
            >
              Save and Continue
            </button>
          </div>

          <div className="rounded-2xl border border-[#d9e0ea] bg-gradient-to-b from-[#f8fbff] to-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-semibold text-[#101727]">What Happens Next?</h2>
            <ol className="list-none space-y-6 p-0 m-0">
              <li className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-bold text-white">
                  1
                </span>
                <div>
                  <p className="font-semibold text-[#101727]">Document Review</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#495565]">
                    Our trusted partner will securely verify your ID.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-bold text-white">
                  2
                </span>
                <div>
                  <p className="font-semibold text-[#101727]">Background Screening</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#495565]">
                    Automated security check runs in the background.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-sm font-bold text-white">
                  3
                </span>
                <div>
                  <p className="font-semibold text-[#101727]">Verification Complete</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#495565]">
                    You will receive an email when the review of your application is complete.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <VerificationPageFooter />
      </div>
    </div>
  );
}
