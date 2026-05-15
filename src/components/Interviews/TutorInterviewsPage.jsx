import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Snackbar } from '@mui/material';
import { apiRequest, uploadOnboardingFile, getCurrentUser, submitTutorOnboarding, resolveApiAssetUrl } from '../../utils/api';
import { getTutorOnboarding } from '../../utils/onboarding';

function normalizeTopicProgress(raw) {
  if (!raw || typeof raw !== 'object') return { selectedQuestion: '', videos: {} };
  const videos = { ...(typeof raw.videos === 'object' && raw.videos ? raw.videos : {}) };
  let sel = raw.selectedQuestion || '';
  if (raw.videoUrl && sel && videos[sel] == null) {
    videos[sel] = raw.videoUrl;
  }
  if (!sel && raw.videoUrl && typeof videos === 'object') {
    const matchKey = Object.keys(videos).find((k) => videos[k] === raw.videoUrl);
    if (matchKey) sel = matchKey;
    else {
      const firstKey = Object.keys(videos).find((k) => videos[k]);
      if (firstKey) sel = firstKey;
    }
  }
  return { selectedQuestion: sel, videos };
}

function VideoCameraIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 3 7.5 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2h-2.5L15 3H9zm3 5c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
  );
}

function shortenText(s, max) {
  const t = String(s || "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function getQuestionSummary(topic, optionKey) {
  const qs = Array.isArray(topic?.questions) ? topic.questions : [];
  const q = qs.find((x) => String(x.optionKey) === String(optionKey));
  if (!q) {
    return optionKey ? `Option ${optionKey}` : "the question you chose";
  }
  const body = shortenText(q.body, 100);
  return `Option ${q.optionKey}${body ? ` — ${body}` : ""}`;
}

function saveAndContinueValidationToast(topics, payload) {
  for (let i = 0; i < topics.length; i++) {
    const t = topics[i];
    const r = payload[t.slug];
    const step = i + 1;
    const topicTitle = t.title || t.slug || "this topic";
    if (!r?.selectedQuestion) {
      return `Step ${step} (${topicTitle}): no question selected. Pick one option, then upload your video and click Save.`;
    }
    if (!r?.videoUrl) {
      const qSummary = getQuestionSummary(t, r.selectedQuestion);
      if (i === 0) {
        return `Step ${step} (${topicTitle}): video missing for ${qSummary}. Upload your introduction video and click Save before continuing.`;
      }
      return `Step ${step} (${topicTitle}): video missing for ${qSummary}. Upload your video and click Save before continuing.`;
    }
  }
  return "Please complete all topics (one question + saved video each) before Save and Continue.";
}

const MAX_INTERVIEW_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_INTERVIEW_VIDEO_DURATION_SEC = 120;

function getVideoFileDurationSeconds(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };
    video.onloadedmetadata = () => {
      const duration = video.duration;
      cleanup();
      if (!Number.isFinite(duration) || duration <= 0) {
        reject(new Error('invalid duration'));
        return;
      }
      resolve(duration);
    };
    video.onerror = () => {
      cleanup();
      reject(new Error('metadata load failed'));
    };
    video.src = url;
  });
}

function formatVideoDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const TutorInterviewsPage = ({ embedded = false }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [topics, setTopics] = useState([]);
  const [responses, setResponses] = useState({});
  const [draftFiles, setDraftFiles] = useState({});
  const [uploadingKey, setUploadingKey] = useState('');
  const [dragOverKey, setDragOverKey] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const showSnackbar = useCallback((message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleSnackbarClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnackbar((s) => ({ ...s, open: false }));
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, progRes] = await Promise.all([
        apiRequest('/api/v1/interviews/virtual/questionnaire'),
        apiRequest('/api/v1/interviews/virtual/me', { method: 'GET' }),
      ]);
      const list = qRes?.topics || qRes?.data?.topics || [];
      const topicsArr = Array.isArray(list) ? list : [];
      setTopics(topicsArr);
      const raw =
        (progRes && progRes.responses) ||
        (progRes && progRes.data && progRes.data.responses) ||
        {};
      const next = {};
      topicsArr.forEach((t) => {
        const slug = t.slug;
        if (!slug) return;
        next[slug] = normalizeTopicProgress(raw[slug]);
      });
      Object.keys(raw).forEach((slug) => {
        if (next[slug] == null) next[slug] = normalizeTopicProgress(raw[slug]);
      });
      setResponses(next);
    } catch (err) {
      console.error(err);
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const setSelectedQuestion = (topicSlug, optionKey) => {
    setResponses((prev) => {
      const base = normalizeTopicProgress(prev[topicSlug]);
      const nextKey = base.selectedQuestion === optionKey ? '' : optionKey;
      return {
        ...prev,
        [topicSlug]: {
          ...base,
          selectedQuestion: nextKey,
          videos: { ...base.videos },
        },
      };
    });
  };

  const draftKey = (slug, opt) => `${slug}::${opt}`;

  const handlePickVideo = async (topicSlug, optionKey, file) => {
    if (!file) return;
    if (responses[topicSlug]?.selectedQuestion !== optionKey) {
      setMessage('Select this question (checkbox) before uploading a video.');
      showSnackbar('Select this question (checkbox) before uploading a video.', 'error');
      return;
    }
    if (!file.type.startsWith('video/')) {
      setMessage('Please upload a valid video file.');
      showSnackbar('Please upload a valid video file.', 'error');
      return;
    }
    if (file.size > MAX_INTERVIEW_VIDEO_BYTES) {
      const msg =
        'File size is too big. Each interview video must be 50MB or less. Please use a shorter recording or compress your file.';
      setMessage(msg);
      showSnackbar(msg, 'error');
      return;
    }
    let durationSec;
    try {
      durationSec = await getVideoFileDurationSeconds(file);
    } catch {
      const msg =
        'Could not verify video length. Please use MP4 or MOV and try again.';
      setMessage(msg);
      showSnackbar(msg, 'error');
      return;
    }
    if (durationSec > MAX_INTERVIEW_VIDEO_DURATION_SEC) {
      const msg = `Video is too long (${formatVideoDuration(durationSec)}). Each interview video must be 2 minutes or less.`;
      setMessage(msg);
      showSnackbar(msg, 'error');
      return;
    }
    setMessage('');
    setUploadingKey(draftKey(topicSlug, optionKey));
    try {
      const res = await uploadOnboardingFile(file);
      const url = res.url || res.Location || res.fileUrl || res.data?.url;
      setDraftFiles((prev) => ({
        ...prev,
        [draftKey(topicSlug, optionKey)]: { name: file.name, url },
      }));
    } catch (err) {
      const msg = err?.message || 'Video upload failed.';
      setMessage(msg);
      showSnackbar(msg, 'error');
    } finally {
      setUploadingKey('');
    }
  };

  const saveQuestion = (topicSlug, optionKey) => {
    const norm = normalizeTopicProgress(responses[topicSlug]);
    if (norm.selectedQuestion !== optionKey) {
      setMessage('Select this question before saving its video.');
      showSnackbar('Select this question before saving its video.', 'error');
      return;
    }
    const draft = draftFiles[draftKey(topicSlug, optionKey)];
    if (!draft?.url) {
      setMessage('Upload a video for this question before Save.');
      showSnackbar('Upload a video for this question before Save.', 'error');
      return;
    }
    setResponses((prev) => {
      const base = normalizeTopicProgress(prev[topicSlug]);
      return {
        ...prev,
        [topicSlug]: {
          selectedQuestion: optionKey,
          videos: { ...base.videos, [optionKey]: draft.url },
        },
      };
    });
    setMessage('Saved for this question.');
    showSnackbar('Saved for this question.', 'success');
  };

  const clearQuestion = (topicSlug, optionKey) => {
    const dk = draftKey(topicSlug, optionKey);
    setDragOverKey((cur) => (cur === dk ? null : cur));
    setResponses((prev) => {
      const base = normalizeTopicProgress(prev[topicSlug]);
      const nextVideos = { ...base.videos };
      delete nextVideos[optionKey];
      let nextSel = base.selectedQuestion;
      if (nextSel === optionKey) nextSel = '';
      return {
        ...prev,
        [topicSlug]: {
          selectedQuestion: nextSel,
          videos: nextVideos,
        },
      };
    });
    setDraftFiles((prev) => {
      const copy = { ...prev };
      delete copy[draftKey(topicSlug, optionKey)];
      return copy;
    });
    setMessage('');
  };

  const buildPayloadResponses = () => {
    const out = {};
    topics.forEach((t) => {
      const slug = t.slug;
      const norm = normalizeTopicProgress(responses[slug]);
      const sel = norm.selectedQuestion;
      const videoUrl = sel && norm.videos[sel] ? norm.videos[sel] : null;
      out[slug] = {
        selectedQuestion: sel || '',
        videoUrl,
        videos: norm.videos,
      };
    });
    return out;
  };

  const persistAll = async (completed) => {
    const payload = buildPayloadResponses();
    const allOk = topics.every((t) => {
      const r = payload[t.slug];
      return r?.selectedQuestion && r?.videoUrl;
    });
    if (completed && !allOk) {
      const detail = saveAndContinueValidationToast(topics, payload);
      setMessage(detail);
      showSnackbar(detail, 'error');
      return;
    }
    setSaving(true);
    try {
      await apiRequest('/api/v1/interviews/virtual/me', {
        method: 'POST',
        body: JSON.stringify({
          responses: payload,
          completed,
        }),
      });

      if (completed) {
        const user = getCurrentUser();
        const userId = user?.id || user?._id || user?.userId;
        const ob = getTutorOnboarding();
        if (userId && ob?.fullName && ob?.dateOfBirth) {
          await submitTutorOnboarding({
            userId,
            fullName: ob.fullName,
            dateOfBirth: ob.dateOfBirth,
            subjects: ob.subjects || '',
            gradeLevels: ob.gradeLevels || '',
            yearsOfExperience: ob.yearsOfExperience || 0,
            teachingPhilosophy: ob.teachingPhilosophy || '',
            cv: ob.cv,
            profilePic: ob.profilePic,
            govId: ob.govId,
          });
        }
        const latestUser = getCurrentUser();
        if (latestUser) {
          localStorage.setItem(
            'user',
            JSON.stringify({
              ...latestUser,
              interviewCompleted: true,
              prospectStatus: 'pending',
              verificationCompleted: false,
            }),
          );
        }
        showSnackbar('Interview details saved successfully.', 'success');
        setTimeout(() => navigate('/verify-identity'), 1600);
      } else {
        setMessage('Progress saved. You can continue later.');
        showSnackbar('Interview details saved successfully.', 'success');
      }
    } catch (err) {
      const msg = err?.message || 'Failed to save interview progress.';
      setMessage(msg);
      showSnackbar(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const clearAll = () => {
    if (!window.confirm('Clear all interview answers on this page?')) return;
    const empty = {};
    topics.forEach((t) => {
      empty[t.slug] = { selectedQuestion: '', videos: {} };
    });
    setResponses(empty);
    setDraftFiles({});
    setMessage('');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!topics.length) {
    return (
      <div className={embedded ? '' : 'min-h-screen bg-[#f2f4f8] py-8'}>
        <div
          className={`${
            embedded ? 'bg-white rounded-xl shadow border border-gray-200 p-6' : 'max-w-6xl mx-auto bg-white rounded-xl shadow border border-gray-200 p-6'
          }`}
        >
          <p className="text-center text-[#64748b]">
            No interview questionnaire is configured yet. Please contact support or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className={embedded ? '' : 'min-h-screen bg-[#f2f4f8] py-8'}>
      <div
        className={`${
          embedded ? 'bg-white rounded-xl shadow border border-gray-200 p-6' : 'max-w-6xl mx-auto bg-white rounded-xl shadow border border-gray-200 p-6'
        }`}
      >
        {message && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {message}
          </div>
        )}

        <div className="space-y-5">
          {topics.map((topic, topicIndex) => {
            const slug = topic.slug;
            const norm = normalizeTopicProgress(responses[slug]);
            const questions = Array.isArray(topic.questions) ? topic.questions : [];
            return (
              <div key={slug} className="border border-[#d9e0ea] rounded-xl overflow-hidden shadow-sm">
                <div className="bg-[#f8fbff] px-4 py-3 border-b border-[#d9e0ea] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-[#2563eb] text-white text-sm font-bold flex items-center justify-center shrink-0">
                    {topicIndex + 1}
                  </div>
                  <div className="text-[#1e3a8a] font-semibold text-base">{topic.title}</div>
                </div>
                <div className="p-4 space-y-4">
                  {questions.map((q) => {
                    const isSelected = norm.selectedQuestion === q.optionKey;
                    const savedUrl = norm.videos[q.optionKey] || null;
                    const dk = draftKey(slug, q.optionKey);
                    const draft = draftFiles[dk];
                    const uploading = uploadingKey === dk;
                    const fileInputId = `iv-vid-${slug}-${q.optionKey}`.replace(/[^a-zA-Z0-9_-]/g, '-');
                    const isDragTarget = dragOverKey === dk && isSelected;
                    return (
                      <div
                        key={q.id || `${slug}-${q.optionKey}`}
                        className={`grid grid-cols-1 lg:grid-cols-[1fr_minmax(300px,340px)] gap-4 items-stretch border rounded-lg p-4 min-h-[220px] ${
                          isSelected ? 'border-[#93c5fd] bg-[#f8fbff]' : 'border-[#e5eaf2] bg-white'
                        }`}
                      >
                        <label className="flex items-start gap-3 cursor-pointer min-h-[180px]">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => setSelectedQuestion(slug, q.optionKey)}
                            className="mt-1.5 shrink-0 rounded border-gray-300 text-[#2563eb]"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-[#1e40af] mb-1">Option {q.optionKey}</p>
                            <p className="text-sm text-[#374151] leading-relaxed">{q.body}</p>
                          </div>
                        </label>
                        <div className="flex min-h-[260px] min-w-0 flex-col overflow-hidden">
                          <div
                            role={isSelected && !uploading ? 'button' : undefined}
                            tabIndex={isSelected && !uploading ? 0 : undefined}
                            onClick={() => {
                              if (!isSelected || uploading) return;
                              document.getElementById(fileInputId)?.click();
                            }}
                            onKeyDown={(e) => {
                              if ((e.key === 'Enter' || e.key === ' ') && isSelected && !uploading) {
                                e.preventDefault();
                                document.getElementById(fileInputId)?.click();
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isSelected && !uploading) setDragOverKey(dk);
                            }}
                            onDragLeave={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) {
                                setDragOverKey((cur) => (cur === dk ? null : cur));
                              }
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDragOverKey(null);
                              const f = e.dataTransfer.files?.[0];
                              if (f) handlePickVideo(slug, q.optionKey, f);
                            }}
                            className={`flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                              !isSelected || uploading
                                ? 'cursor-not-allowed border-[#d1dae6] bg-[#f8fafc] opacity-70'
                                : isDragTarget
                                  ? 'cursor-pointer border-[#2563eb] bg-[#e8f2ff] shadow-inner'
                                  : 'cursor-pointer border-[#9ec5fe] bg-[#f0f7ff] hover:border-[#3b82f6] hover:bg-[#e8f2ff]'
                            }`}
                          >
                            <VideoCameraIcon className="mb-4 h-12 w-12 shrink-0 text-[#2563eb]" />
                            <p className="text-lg font-semibold tracking-tight text-[#1e3a8a]">Upload Video</p>
                            <p className="mt-2 max-w-[280px] text-sm leading-snug text-[#64748b]">
                              Drag and drop or select a file to upload. Maximum length is 2 minutes and 50MB per video.
                            </p>
                            <input
                              id={fileInputId}
                              type="file"
                              accept="video/mp4,video/quicktime,video/x-msvideo,video/*"
                              disabled={!isSelected || uploading}
                              onChange={(e) => {
                                handlePickVideo(slug, q.optionKey, e.target.files?.[0]);
                                e.target.value = '';
                              }}
                              className="sr-only"
                            />
                          </div>
                          <div className="mt-3 flex w-full gap-3">
                            <button
                              type="button"
                              onClick={() => saveQuestion(slug, q.optionKey)}
                              disabled={!isSelected}
                              className="h-11 flex-1 rounded-lg border-2 border-[#5b8fd4] bg-white text-sm font-semibold text-[#1d4ed8] shadow-sm transition-colors hover:bg-[#eff6ff] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => clearQuestion(slug, q.optionKey)}
                              className="h-11 flex-1 rounded-lg border-2 border-[#e57373] bg-white text-sm font-semibold text-[#c62828] shadow-sm transition-colors hover:bg-[#fff5f5]"
                            >
                              Clear
                            </button>
                          </div>
                          <p
                            className="mt-2 min-h-[18px] w-full min-w-0 max-w-full px-1 text-center text-xs text-[#64748b] break-all line-clamp-2"
                            title={
                              uploading
                                ? undefined
                                : draft?.name ||
                                  (savedUrl ? 'Video saved' : isSelected ? 'No file selected' : 'Select question first')
                            }
                          >
                            {uploading
                              ? 'Uploading…'
                              : draft?.name ||
                                (savedUrl ? 'Video saved' : isSelected ? 'No file selected' : 'Select question first')}
                          </p>
                          {savedUrl ? (
                            <video
                              key={String(savedUrl).slice(0, 120)}
                              className="mt-2 w-full max-h-44 rounded-lg border border-[#d1dae6] bg-black object-contain"
                              src={resolveApiAssetUrl(savedUrl)}
                              controls
                              playsInline
                            />
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3">
          <button
            type="button"
            onClick={clearAll}
            disabled={saving}
            className="h-11 px-6 rounded-lg border border-gray-300 bg-white text-[#374151] font-semibold text-sm order-2 sm:order-1 sm:mr-auto"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => persistAll(false)}
            disabled={saving}
            className="h-11 px-6 rounded-lg border border-[#9cb7df] bg-white text-[#2458a6] font-semibold text-sm"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => persistAll(true)}
            disabled={saving}
            className="h-11 px-8 rounded-lg bg-[#2166d1] text-white font-semibold text-sm"
          >
            {saving ? 'Saving…' : 'Save and Continue'}
          </button>
        </div>
      </div>
    </div>
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleSnackbarClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={handleSnackbarClose}
        severity={snackbar.severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
};

export default TutorInterviewsPage;
