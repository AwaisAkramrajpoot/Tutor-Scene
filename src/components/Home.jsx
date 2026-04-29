import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { apiRequest } from "../utils/api";

const LEARNERS_GUIDE_PDF = "/documents/learners-guide.pdf";
const COMING_SOON_COUNTDOWN_START =
  24 * 24 * 60 * 60 + 10 * 60 * 60 + 38 * 60 + 21;

const Home = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);
  const [learnersGuideOpen, setLearnersGuideOpen] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState(
    COMING_SOON_COUNTDOWN_START
  );
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewEmail, setReviewEmail] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");

  const goFindTutor = () => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      navigate("/signup");
      return;
    }
    navigate("/find-tutors");
  };

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        const data = await apiRequest("/api/v1/testimonials", {
          method: "GET",
        });
        const testimonialsList = Array.isArray(data)
          ? data
          : data.testimonials || data.data || [];
        setTestimonials(testimonialsList);
      } catch (error) {
        console.error("Failed to fetch testimonials:", error);
        // Keep empty array if fetch fails
        setTestimonials([]);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchTestimonials();
  }, []);

  const galleryTestimonials = useMemo(() => {
    const list = Array.isArray(testimonials) ? testimonials : [];
    return [...list]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 4);
  }, [testimonials]);

  const galleryIds = useMemo(
    () => galleryTestimonials.map((t) => t.id).join(","),
    [galleryTestimonials]
  );

  useEffect(() => {
    setCurrentTestimonialIndex(0);
  }, [galleryIds]);

  useEffect(() => {
    const len = galleryTestimonials.length;
    if (len <= 1) return undefined;
    const id = window.setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % len);
    }, 6000);
    return () => window.clearInterval(id);
  }, [galleryTestimonials.length, galleryIds]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLaunchCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const countdownParts = useMemo(() => {
    const days = Math.floor(launchCountdown / (24 * 60 * 60));
    const hours = Math.floor((launchCountdown % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((launchCountdown % (60 * 60)) / 60);
    const seconds = launchCountdown % 60;

    return [
      { label: "DAYS", value: String(days).padStart(2, "0") },
      { label: "HOURS", value: String(hours).padStart(2, "0") },
      { label: "MINUTES", value: String(minutes).padStart(2, "0") },
      { label: "SECONDS", value: String(seconds).padStart(2, "0") },
    ];
  }, [launchCountdown]);

  const handleNextTestimonial = () => {
    if (galleryTestimonials.length > 0) {
      setCurrentTestimonialIndex((prevIndex) =>
        prevIndex === galleryTestimonials.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  const handlePrevTestimonial = () => {
    if (galleryTestimonials.length > 0) {
      setCurrentTestimonialIndex((prevIndex) =>
        prevIndex === 0 ? galleryTestimonials.length - 1 : prevIndex - 1
      );
    }
  };

  const currentTestimonial = galleryTestimonials[currentTestimonialIndex];

  const resetReviewForm = () => {
    setReviewName("");
    setReviewEmail("");
    setReviewRating(0);
    setReviewComment("");
    setReviewError("");
    setReviewSuccess("");
  };

  const handleOpenReviewDialog = () => {
    resetReviewForm();
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    resetReviewForm();
  };

  const handleSubmitHomeReview = async () => {
    if (!reviewName.trim()) {
      setReviewError("Please enter your name.");
      return;
    }
    if (!reviewEmail.trim()) {
      setReviewError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewEmail.trim())) {
      setReviewError("Please enter a valid email address.");
      return;
    }
    if (reviewRating < 1) {
      setReviewError("Please select a rating.");
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length < 10) {
      setReviewError("Please share at least 10 characters in your review.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      await apiRequest("/api/v1/testimonials", {
        method: "POST",
        body: JSON.stringify({
          testimonial: reviewComment.trim(),
          testimonialBy: reviewName.trim(),
          email: reviewEmail.trim(),
          rating: reviewRating,
        }),
      });

      setReviewSuccess(
        "Review submitted successfully. It will appear after admin approval."
      );
      window.setTimeout(() => {
        handleCloseReviewDialog();
      }, 1200);
    } catch (error) {
      console.error("Failed to submit review:", error);
      setReviewError(error.message || "Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="relative bg-brand-dark-blue text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
          <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 pt-6 pb-24 md:pt-8 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="space-y-6 text-center lg:text-left mb-10">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  <span className="text-white">Empowering </span>
                  <br></br>
                  <span className="text-brand-gold">Learning</span>
                  <br></br>

                  <span className="text-white"> Through Connection.</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg lg:text-xl text-white/95 max-w-lg mx-auto lg:mx-0 font-normal leading-relaxed">
                Tutor Scene helps learners and tutors connect securely for live,
                interactive lessons that inspire success.
              </p>

              <div className="flex justify-center lg:justify-start">
                <button
                  type="button"
                  onClick={goFindTutor}
                  className="inline-flex items-center justify-center min-w-[12rem] sm:min-w-[14rem] lg:min-w-[12rem] bg-white text-brand-gold border-2 border-brand-gold px-8 sm:px-12 py-1.5 rounded-lg text-base sm:text-lg font-normal shadow-md hover:bg-brand-medium-blue hover:text-white transition-colors"
                >
                  Find a Tutor
                </button>
              </div>
            </div>

            {/* RIGHT IMAGE */}
            <div className="relative flex justify-center lg:justify-end z-10 mt-6 lg:mt-0">
              <div className="relative w-full max-w-[14rem] sm:max-w-[18rem] lg:max-w-[28rem] aspect-square flex items-center justify-center lg:justify-end">
                <div className="relative z-10">
                  <img
                    src="/images/homebannerheader.png"
                    alt="Student learning with Tutor Scene"
                    className="object-cover object-center w-full h-auto"
                    width={460}
                    height={670}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* WHITE SECTION */}
        <section className="relative lg:absolute left-0 right-0 bottom-0 md:bottom-20 z-0 mb-0 lg:mb-10 bg-gray-300 py-5 md:py-1 border-y border-brand-light-blue/40 shadow-[0_-8px_24px_rgba(20,52,96,0.08)] w-full md:w-[80%] md:mr-auto">
          <div className="px-4 sm:px-6 lg:px-20 max-w-7xl mx-auto text-center md:text-left">
            <h2 className="text-2xl md:text-3xl md:ml-20 font-bold text-brand-medium-blue">
              Trusted Tutors
            </h2>
            <p className="mt-2 text-base md:text-lg md:ml-10 font-normal text-brand-medium-blue/85 relative inline-block z-10 pl-6">
              {/* background starts from left edge */}
              <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-60 bg-gradient-to-r from-white via-white to-transparent -z-10"></span>
              Vetted. Experienced. Learner focused.
            </p>
          </div>
        </section>
      </div>

      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
          <img
            src="/images/How_it_works_bg_image.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-white/55" />
        </div>
        <div className="w-full mb-12 md:mb-14 bg-white/50 backdrop-blur-sm flex justify-center">
          <h2 className="inline-block text-center text-3xl sm:text-4xl md:text-5xl font-bold text-brand-medium-blue py-3 sm:py-4 px-6 border-2 border-brand-medium-blue">
            How It Works
          </h2>
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Book a Session
                </h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Let us match you to the perfect tutor or search for the tutor
                  of your choice
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Search &amp; Browse
                </h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Find tutors by subject, price, and availability. Compare tutor
                  profiles for personalized compatibility
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Start Learning
                </h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Connect with your tutor online and start your learning journey
                  from anywhere
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={() => setLearnersGuideOpen(true)}
              className="bg-brand-medium-blue text-white font-bold px-28 py-4 rounded-lg shadow-lg hover:bg-brand-dark-blue transition-colors text-center text-base w-auto"
            >
              Behind the Scenes: A Learners&apos; Guide
            </button>
          </div>
        </div>
      </section>

      <Dialog
        open={learnersGuideOpen}
        onClose={() => setLearnersGuideOpen(false)}
        maxWidth="lg"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>Behind the Scenes: A Learners&apos; Guide</DialogTitle>
        <DialogContent dividers className="p-0 sm:p-2">
          <iframe
            title="Learners guide PDF"
            src={`${LEARNERS_GUIDE_PDF}#toolbar=1`}
            className="w-full min-h-[70vh] border-0 bg-gray-100 rounded-sm"
          />
        </DialogContent>
        <DialogActions>
          <Button
            component="a"
            href={LEARNERS_GUIDE_PDF}
            download="Tutor-Scene-Learners-Guide.pdf"
            variant="contained"
            color="primary"
          >
            Download PDF
          </Button>
          <Button onClick={() => setLearnersGuideOpen(false)} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={reviewDialogOpen}
        onClose={handleCloseReviewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-brand-medium-blue font-bold">
              Write a Review
            </span>
            <button
              type="button"
              onClick={handleCloseReviewDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close review popup"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="space-y-4">
          <input
            type="text"
            value={reviewName}
            onChange={(e) => {
              setReviewName(e.target.value);
              setReviewError("");
            }}
            placeholder="Your Name*"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
          />
          <input
            type="email"
            value={reviewEmail}
            onChange={(e) => {
              setReviewEmail(e.target.value);
              setReviewError("");
            }}
            placeholder="Your Email*"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
          />
          <div className="flex items-center gap-3">
            <span className="text-gray-800 font-medium">Your Rating*</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => {
                    setReviewRating(star);
                    setReviewError("");
                  }}
                  className="transition-transform hover:scale-110"
                  aria-label={`Set rating ${star}`}
                >
                  <svg
                    className={`w-6 h-6 ${
                      star <= reviewRating ? "text-yellow-400" : "text-gray-300"
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={reviewComment}
            onChange={(e) => {
              setReviewComment(e.target.value);
              setReviewError("");
            }}
            placeholder="Share your experience with Tutor Scene..."
            rows={4}
            maxLength={500}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue resize-none"
          />
          <div className="flex justify-end text-xs text-gray-500">
            {reviewComment.length}/500
          </div>
          {reviewError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {reviewError}
            </div>
          )}
          {reviewSuccess && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              {reviewSuccess}
            </div>
          )}
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={handleSubmitHomeReview}
            variant="contained"
            disabled={reviewSubmitting}
            sx={{
              borderRadius: "8px",
              backgroundColor: "#2F66C9",
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              "&:hover": { backgroundColor: "#1F4EA6" },
            }}
          >
            {reviewSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ====================================================
          WHY TUTOR SCENE? SECTION — UPDATED
          Changes from original "Our Features":
          1. Title changed to "Why Tutor Scene?"
          2. Background white
          3. Left side: autoplay muted video (replace src with your video file)
          4. Right side: exact verbiage from client screenshot
          5. Removed old video call mock UI and Students/Tutors/Parents list
      ==================================================== */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="inline-block text-3xl sm:text-4xl md:text-5xl font-bold text-brand-medium-blue py-3 px-8 border-2 border-brand-medium-blue">
              Why Tutor Scene?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side — Marketing Video (autoplay, muted, loop) */}
            {/* NOTE: Replace /videos/marketing.mp4 with the actual video path when provided */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 aspect-video flex items-center justify-center">
              <video
                src="/videos/marketing.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                {/* Fallback if video not yet provided */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <svg
                    className="w-16 h-16 mb-3 opacity-40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p>Marketing video will appear here</p>
                </div>
              </video>
              {/* Fallback overlay shown only when video src is not yet available */}
              <noscript>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <svg
                    className="w-16 h-16 mb-3 opacity-40"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p>Marketing video will appear here</p>
                </div>
              </noscript>
            </div>

            {/* Right Side — Feature List (exact verbiage from client) */}
            <div className="space-y-8">
              {/* Flexible Scheduling */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-brand-medium-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">
                    Flexible Scheduling
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Book sessions at times that fit your real schedule
                  </p>
                </div>
              </div>

              {/* Personalized Matching */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-brand-medium-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">
                    Personalized Matching
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Get matched based on subject, goals, and learning style
                  </p>
                </div>
              </div>

              {/* Easy Booking */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-brand-medium-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">
                    Easy Booking
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Browse tutors, book times, and keep everything in one place
                  </p>
                </div>
              </div>

              {/* Learn Anywhere */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-brand-medium-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">
                    Learn Anywhere
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Connect online and access learning from anywhere
                  </p>
                </div>
              </div>

              {/* Keep Learners Organized */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-brand-medium-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">
                    Keep Learners Organized
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Track multiple learners under one account and stay organized
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* On-Demand Learning Library */}
      <div className="relative bg-brand-dark-blue py-16 md:py-20 overflow-hidden text-white">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
          <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 max-w-3xl mx-auto mb-10 text-center">
            {countdownParts.map((item) => (
              <div key={item.label}>
                <p className="text-4xl sm:text-5xl font-semibold leading-none">
                  {item.value}
                </p>
                <p className="mt-3 text-base sm:text-3xl tracking-wide text-white/95">
                  {item.label}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
              On-Demand Learning Library
            </h2>
            <p className="mt-2 text-4xl sm:text-6xl font-light">Coming Soon!</p>
          </div>

        </div>
      </div>

      {/* Smart Tools Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">
                Smart Tools for Students & Tutors
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Tutor Scene offers powerful tools to make online learning simple
                and effective. Students can book lessons, access materials, and
                track progress — while tutors manage sessions, share resources,
                and communicate seamlessly in real time.
              </p>
            </div>

            {/* Right Side - Thoughtful Student Image */}
            <div className="relative">
              <img
                src="/images/studentHome.png"
                alt="Thoughtful student learning"
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />

              {/* Floating Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-400 rounded-full opacity-60"></div>
              <div className="absolute top-1/2 -left-6 w-8 h-8 bg-yellow-400 rounded-lg opacity-50"></div>
              <div className="absolute -bottom-4 left-1/4 w-6 h-6 bg-orange-400 rounded-full opacity-40"></div>
              <div className="absolute top-1/4 -right-8 w-4 h-4 bg-green-400 rounded-full opacity-70"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================
          WHAT OUR LEARNERS SAY — UPDATED SECTION
          Changes made:
          1. bg-white (white background)
          2. Paragraph text: exact client-specified text only
          3. Star rating removed from display (still stored in DB)
          4. Everything else (logic, arrows, dots, autoplay) unchanged
      ==================================================== */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side */}
            <div>
              <p className="text-xs font-bold text-brand-medium-blue uppercase tracking-widest mb-3">
                Testimonial
              </p>
              <h2 className="text-4xl font-bold text-brand-medium-blue mb-6 border-2 border-brand-medium-blue px-4 py-2 inline-block">
                What Our Learners Say
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Tutor Scene has earned the trust of learners and tutors
                worldwide. Learners love our platform because they&apos;re
                matched with tutors who actually fit how they learn which makes
                progress feel natural, not forced. Share your experience about
                The Scene. We would love to hear from you!
              </p>
              <button
                type="button"
                onClick={handleOpenReviewDialog}
                className="inline-flex items-center border-2 border-brand-medium-blue text-brand-medium-blue hover:bg-brand-medium-blue hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Write Your Review
                <svg
                  className="w-4 h-4 ml-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Right Side - Review Gallery */}
            <div className="relative max-w-lg mx-auto lg:mx-0">
              {loadingTestimonials ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue" />
                </div>
              ) : galleryTestimonials.length === 0 ? (
                <div className="text-center py-12 rounded-3xl border border-gray-200 bg-gray-50">
                  <p className="text-gray-600 px-4">
                    Review gallery will appear here. Your administrator can add
                    up to four featured testimonials in the admin dashboard.
                  </p>
                </div>
              ) : (
                <>
                  <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    <img
                      src="/images/testimonials.jpg"
                      alt="Learner testimonial"
                      className="w-full h-auto object-cover max-h-[420px]"
                    />

                    {/* Prev / Next arrows */}
                    {galleryTestimonials.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={handlePrevTestimonial}
                          className="absolute top-1/2 left-3 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                          aria-label="Previous review"
                        >
                          <svg
                            className="w-5 h-5 text-brand-medium-blue"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={handleNextTestimonial}
                          className="absolute top-1/2 right-3 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                          aria-label="Next review"
                        >
                          <svg
                            className="w-5 h-5 text-brand-medium-blue"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Review card overlapping the photo */}
                  <div className="relative -mt-28 sm:-mt-32 mx-4 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border-l-4 border-brand-gold">
                    <blockquote className="text-gray-700 text-base leading-relaxed mb-4 italic">
                      &ldquo;{currentTestimonial?.testimonial || ""}&rdquo;
                    </blockquote>
                    {currentTestimonial?.testimonialBy && (
                      <p className="text-sm font-bold text-gray-900">
                        {currentTestimonial.testimonialBy}
                      </p>
                    )}
                    {/* star rating NOT displayed — stored in DB for admin use only */}

                    {/* Dot indicators */}
                    {galleryTestimonials.length > 1 && (
                      <div className="flex justify-start mt-4 gap-2">
                        {galleryTestimonials.map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCurrentTestimonialIndex(index)}
                            className={`h-2 rounded-full transition-all ${
                              index === currentTestimonialIndex
                                ? "w-8 bg-brand-medium-blue"
                                : "w-2 bg-gray-300 hover:bg-gray-400"
                            }`}
                            aria-label={`Show review ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Get Started Section */}
      <div className="relative bg-brand-dark-blue py-20 overflow-hidden">
        {/* Background decorative elements matching hero section */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
          <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-brand-gold font-semibold mb-8">
            Join Tutor Scene today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              type="button"
              onClick={goFindTutor}
              className="bg-white text-brand-dark-blue border-2 border-brand-gold hover:bg-brand-medium-blue hover:text-white font-semibold py-4 px-10 sm:px-14 min-w-[14rem] sm:min-w-[17rem] justify-center rounded-lg transition-all shadow-lg inline-flex items-center"
            >
              Find a Tutor Now
            </button>
            <button
              type="button"
              onClick={() => navigate("/become-tutor")}
              className="bg-white text-brand-dark-blue border-2 border-brand-gold hover:bg-brand-medium-blue hover:text-white font-semibold py-4 px-10 sm:px-14 min-w-[14rem] sm:min-w-[17rem] justify-center rounded-lg transition-all shadow-lg inline-flex items-center"
            >
              Become a Tutor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
