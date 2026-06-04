import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress,
} from "@mui/material";
import { apiRequest } from "../../utils/api";
import { useSystemMessage } from "../../hooks/useSystemMessage";
import {
  LEARNER_ASSESSMENT_MODAL_SUBTITLE,
  LEARNER_ASSESSMENT_QUESTIONS,
} from "../../data/learnerAssessmentQuestions";
import { buildLearnerProfilePayload } from "../../data/learnerProfileDefaults";

const TOTAL = 8;

const emptyAnswers = () => {
  const o = {};
  for (let i = 1; i <= TOTAL; i += 1) o[String(i)] = "";
  return o;
};

const LearnerAssessmentModal = ({
  open,
  onClose,
  learnerLabel,
  learnerChoices,
  onLearnerLabelChange,
  user,
  onPersisted,
}) => {
  const { showMessage } = useSystemMessage();
  const [answers, setAnswers] = useState(emptyAnswers());
  const [baselineAnswers, setBaselineAnswers] = useState(emptyAnswers);
  const [baselineLearner, setBaselineLearner] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exitConfirmOpen, setExitConfirmOpen] = useState(false);

  const showToast = (message, severity = "success") => {
    showMessage({ message, type: severity });
  };

  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((v) => v && String(v).length > 0).length,
    [answers],
  );

  const isDirty = useMemo(() => {
    if (!learnerLabel) return false;
    if (learnerLabel !== baselineLearner) return true;
    for (let i = 1; i <= TOTAL; i += 1) {
      const key = String(i);
      if ((answers[key] || "") !== (baselineAnswers[key] || "")) return true;
    }
    return false;
  }, [answers, baselineAnswers, learnerLabel, baselineLearner]);

  const markClean = (nextAnswers, label) => {
    const snap = { ...nextAnswers };
    setBaselineAnswers(snap);
    setBaselineLearner(label || "");
  };

  useEffect(() => {
    if (!open || !learnerLabel) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const q = encodeURIComponent(learnerLabel);
        const res = await apiRequest(
          `/api/v1/learner-assessment?learnerLabel=${q}`,
          { method: "GET" },
        );
        if (cancelled) return;
        if (res?.answers && typeof res.answers === "object") {
          const next = emptyAnswers();
          Object.keys(next).forEach((k) => {
            if (res.answers[k]) next[k] = res.answers[k];
          });
          setAnswers(next);
          if (!cancelled) markClean(next, learnerLabel);
        } else {
          const next = emptyAnswers();
          setAnswers(next);
          if (!cancelled) markClean(next, learnerLabel);
        }
      } catch {
        if (!cancelled) {
          const next = emptyAnswers();
          setAnswers(next);
          markClean(next, learnerLabel);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, learnerLabel]);

  const setAnswer = (questionId, key) => {
    setAnswers((prev) => ({ ...prev, [String(questionId)]: key }));
  };

  const persist = async (status) => {
    if (!learnerLabel) return;
    setSaving(true);
    try {
      const payload = {
        learnerLabel,
        answers,
        status,
      };
      if (status === "completed" && user) {
        Object.assign(payload, buildLearnerProfilePayload(learnerLabel, user));
      }
      await apiRequest("/api/v1/learner-assessment", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (status === "completed" && onPersisted) onPersisted();
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (!isDirty) {
      onClose();
      return;
    }
    setExitConfirmOpen(true);
  };

  const handleDiscardAndClose = () => {
    setExitConfirmOpen(false);
    onClose();
  };

  const handleSaveAndExit = async () => {
    try {
      await persist("draft");
      setExitConfirmOpen(false);
      onClose();
    } catch {
      showToast("Failed to save progress. Please try again.", "error");
    }
  };

  const handleSave = async () => {
    try {
      await persist("draft");
      markClean(answers, learnerLabel);
      showToast("Progress saved successfully.", "success");
    } catch {
      showToast("Failed to save progress. Please try again.", "error");
    }
  };

  const handleSaveLater = async () => {
    try {
      await persist("draft");
      showToast(
        "Progress saved. You can complete the assessment later.",
        "info",
      );
      onClose();
    } catch {
      showToast("Failed to save progress. Please try again.", "error");
    }
  };

  const handleComplete = async () => {
    if (answeredCount < TOTAL) {
      showToast("Please answer all 8 questions before completing.", "warning");
      return;
    }
    try {
      await persist("completed");
      showToast("Assessment completed and saved successfully!", "success");
      onClose();
    } catch {
      showToast("Failed to submit assessment. Please try again.", "error");
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={requestClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{
          sx: { maxHeight: "92vh", display: "flex", flexDirection: "column" },
        }}
      >
        <div className="relative bg-gradient-to-r from-brand-dark-blue to-teal-600 text-white px-5 pt-5 pb-4 shrink-0">
          <button
            type="button"
            onClick={requestClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-white/90 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Close learner assessment"
          >
            <span className="text-2xl leading-none" aria-hidden>
              ×
            </span>
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pr-10">
            <div className="min-w-0 pr-2">
              <h2 className="text-xl font-bold leading-tight">
                Learner Assessment
              </h2>
              <p className="text-sm text-white/90 mt-2 leading-snug">
                {LEARNER_ASSESSMENT_MODAL_SUBTITLE}
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-52">
              <label className="block text-[10px] font-semibold tracking-widest text-white/80 uppercase mb-1">
                Select Learner
              </label>
              <select
                className="w-full rounded-md border border-white/40 bg-white/10 px-2 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/60"
                value={learnerLabel || ""}
                onChange={(e) => onLearnerLabelChange(e.target.value)}
              >
                <option value="" disabled className="text-gray-900">
                  Choose learner
                </option>
                {(learnerChoices || []).map((name) => (
                  <option key={name} value={name} className="text-gray-900">
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between shrink-0 bg-gray-50">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <LinearProgress
              variant="determinate"
              value={(answeredCount / TOTAL) * 100}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 1,
                maxWidth: 220,
                bgcolor: "grey.300",
                "& .MuiLinearProgress-bar": { borderRadius: 1 },
              }}
            />
            <span className="text-sm text-gray-700 whitespace-nowrap">
              {TOTAL} questions
            </span>
          </div>
          <p className="text-xs text-gray-600 sm:text-right">
            Select one response per question.
          </p>
        </div>

        <DialogContent
          dividers
          sx={{ flex: 1, overflowY: "auto", py: 2, px: { xs: 2, sm: 3 } }}
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-medium-blue border-t-transparent" />
            </div>
          ) : (
            <div className="space-y-6">
              {LEARNER_ASSESSMENT_QUESTIONS.map((q) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-medium-blue text-sm font-bold text-white">
                      {q.id}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 leading-snug">
                        {q.prompt}
                      </p>
                      <div className="mt-3 space-y-2">
                        {q.options.map((opt) => (
                          <label
                            key={opt.key}
                            className="flex cursor-pointer gap-2 rounded-lg border border-gray-100 p-2 hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              className="mt-1"
                              name={`learner-q-${q.id}`}
                              checked={answers[String(q.id)] === opt.key}
                              onChange={() => setAnswer(q.id, opt.key)}
                            />
                            <span className="text-sm text-gray-800 leading-snug">
                              <span className="font-semibold uppercase">
                                {opt.key}.
                              </span>{" "}
                              {opt.text}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 2,
            px: 2,
            py: 2,
            flexShrink: 0,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <p className="text-xs text-gray-600 text-left order-2 sm:order-1">
            Your progress can be saved and completed later.
          </p>
          <div className="flex flex-wrap justify-end gap-2 order-1 sm:order-2">
            <Button
              variant="outlined"
              color="primary"
              disabled={saving || !learnerLabel}
              onClick={handleSave}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              color="primary"
              disabled={saving || !learnerLabel}
              onClick={handleSaveLater}
            >
              Save & Complete Later
            </Button>
            <Button
              variant="contained"
              color="primary"
              disabled={saving || !learnerLabel}
              onClick={handleComplete}
            >
              Complete
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exitConfirmOpen}
        onClose={() => setExitConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <div className="px-5 pt-5 pb-2">
          <h3 className="text-lg font-bold text-gray-900">Unsaved changes</h3>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">
            You have unsaved changes. Do you want to save before exiting?
          </p>
        </div>
        <DialogActions sx={{ px: 2, pb: 2, gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => setExitConfirmOpen(false)} color="inherit">
            Stay
          </Button>
          <Button onClick={handleDiscardAndClose} color="inherit">
            Exit without saving
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={saving || !learnerLabel}
            onClick={handleSaveAndExit}
          >
            Save & exit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LearnerAssessmentModal;
