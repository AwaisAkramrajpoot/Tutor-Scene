import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { apiRequest, getCurrentUser, isAuthenticated } from "../utils/api";

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
        setTestimonials([]);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchTestimonials();
  }, []);
//
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
      setReviewError(
        error.message || "Failed to submit review. Please try again."
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* ===== HERO SECTION ===== */}
      <div className="relative bg-gradient-to-r from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end text-white overflow-hidden">
  {/* Background decorative circles — brand colors */}
  <div className="absolute inset-0 pointer-events-none">
    {/* Large blurred circles */}
    <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
    <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
    <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
    {/* Additional brand-colored bubbles */}
    <div className="absolute top-10 right-16 w-16 h-16 rounded-full bg-brand-gold/10 blur-xl" />
    <div className="absolute bottom-32 left-1/3 w-20 h-20 rounded-full bg-brand-light-blue/10 blur-2xl" />
    <div className="absolute top-1/2 left-12 w-10 h-10 rounded-full bg-brand-gold/15 blur-lg" />
    <div className="absolute top-16 left-1/2 w-12 h-12 rounded-full bg-brand-light-blue/20 blur-xl" />
    <div className="absolute bottom-8 left-20 w-8 h-8 rounded-full bg-brand-gold/20 blur-md" />
    {/* Solid outline circles */}
    <div className="absolute top-8 left-1/4 w-6 h-6 rounded-full border border-brand-gold/30" />
    <div className="absolute bottom-20 right-1/3 w-5 h-5 rounded-full border border-brand-light-blue/40" />

    {/* Upper-left bubbles behind "Empowering" text */}  
    <div className="absolute top-20 left-12 w-16 h-16 rounded-full bg-white/10" />
  </div>

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-4 pt-6 pb-24 md:pt-8 md:pb-24">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
      {/* LEFT CONTENT */}
      <div className="space-y-6 text-center lg:text-left mb-10 md:-mt-10">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
            <span className="relative inline-block text-white z-10">
              {/* Centered glow behind text */}
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white/20 rounded-full blur-3xl"></span>
              Empowering
            </span>
            <br />
            <span className="text-brand-gold">Learning</span>
            <br />
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
            className="inline-flex items-center justify-center gap-2 min-w-[12rem] sm:min-w-[14rem] lg:min-w-[12rem] bg-white text-brand-medium-blue border-2 border-brand-gold px-8 sm:px-12 py-1.5 rounded-lg text-base sm:text-lg font-normal shadow-md hover:bg-brand-medium-blue hover:text-white transition-colors"
          >
            Find a Tutor
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* RIGHT IMAGE + FLOATING BADGES */}
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

{/* ✅ ONLY THIS ADDED — small white circle, half outside top-right of image */}
<div className="absolute top-34 -right-12 w-24 h-24 rounded-full bg-white/10 z-0" />

          {/* Top-right: Trusted Tutors */}
          <div className="absolute top-4 -right-2 sm:top-20 sm:-right-4 z-20">
  <div className="bg-white/95 text-brand-medium-blue text-xs sm:text-sm font-semibold 
                  px-6 py-1 shadow-lg border border-brand-gold/40 backdrop-blur-sm
                  text-center leading-tight
                  rounded-tl-lg 
                  rounded-bl-none 
                  rounded-tr-none 
                  rounded-br-lg">
    
    Trusted <br /> Tutors
    
  </div>
</div>

          {/* Middle-right: Experienced */}
          <div className="absolute bottom-24 -right-2 sm:bottom-2 sm:-right-2 z-20">
  <div className="bg-white/95 text-brand-medium-blue text-xs sm:text-sm font-semibold 
                  px-6 py-4 shadow-lg border border-brand-gold/40 backdrop-blur-sm
                  text-center leading-tight
                  
                  rounded-tl-lg 
                  rounded-bl-none 
                  rounded-tr-none 
                  rounded-br-lg">
    
    Experienced
    
  </div>
</div>

          {/* Bottom-left: Learner Focused */}
          <div className="absolute bottom-8 -left-2 sm:bottom-14 sm:-left-4 z-20">
  <div className="bg-white/95 text-brand-medium-blue text-xs sm:text-sm font-semibold 
                  px-6 py-1 shadow-lg borde backdrop-blur-sm
                  text-center leading-tight
                  
                  rounded-tl-lg 
                  rounded-bl-none 
                  rounded-tr-none 
                  rounded-br-lg">
    
    Learner <br /> Focused
    
  </div>
</div>
        </div>
      </div>
    </div>
  </div>

  {/* WHITE/GRAY RIBBON — Trusted Tutors tagline */}
  {/* <section className="relative lg:absolute left-0 right-0 bottom-0 md:bottom-20 z-0 mb-0 lg:mb-10   py-5 md:py-1 border-y border-brand-light-blue/40 shadow-[0_-8px_24px_rgba(20,52,96,0.08)] w-full md:w-[80%] md:mr-auto">
    <div className="px-4 sm:px-6 lg:px-20 max-w-7xl mx-auto text-center md:text-left">
      <h2 className="text-2xl md:text-3xl md:ml-20 font-bold text-brand-medium-blue">
        Trusted Tutors
      </h2>
      <p className="mt-2 text-base md:text-lg md:ml-10 font-normal text-brand-medium-blue/85 relative inline-block z-10 pl-6">
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-60 bg-gradient-to-r from-white via-white to-transparent -z-10"></span>
        Vetted. Experienced. Learner focused.
      </p>
    </div>
  </section> */}
</div>

      {/* ===== HOW IT WORKS SECTION ===== */}
      {/* CHANGE 3: Removed border/outline and semi-transparent background from title */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
          <img
            src="/images/How_it_works_bg_image.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-white/55" />
        </div>

        {/* Decorative bubbles for How It Works */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-10 left-8 w-14 h-14 rounded-full bg-brand-light-blue/20 blur-xl" />
          <div className="absolute bottom-12 right-12 w-20 h-20 rounded-full bg-brand-gold/10 blur-2xl" />
          <div className="absolute top-1/2 right-8 w-8 h-8 rounded-full border border-brand-medium-blue/20" />
        </div>

        {/* CHANGE 3: Title has no border/outline, no semi-transparent shading box */}
        {/* Title */}
<div className="relative z-10 w-full mb-12 md:mb-14 flex justify-center">
  <h2 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold text-brand-medium-blue py-3 sm:py-4 px-6">
    How It Works
  </h2>
</div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Book a Session</h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Let us match you to the perfect tutor or search for the tutor of your choice
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Search &amp; Browse</h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Find tutors by subject, price, and availability. Compare tutor profiles for personalized compatibility
                </p>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-white p-8 shadow-md">
              <div className="text-center">
                <div className="w-16 h-16 bg-brand-medium-blue rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Learning</h3>
                <p className="text-gray-600 text-left md:text-center leading-relaxed">
                  Connect with your tutor online and start your learning journey from anywhere
                </p>
              </div>
            </div>
          </div>

          {/* CHANGE 12: Arrow added to Learners Guide button */}
          <div className="flex justify-center mt-8">
            <button
              type="button"
              onClick={() => setLearnersGuideOpen(true)}
              className="bg-brand-medium-blue text-white font-bold px-28 py-4 rounded-lg shadow-lg hover:bg-brand-dark-blue transition-colors text-center text-base w-auto inline-flex items-center gap-2"
            >
              Behind the Scenes: A Learners&apos; Guide
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ===== LEARNERS GUIDE DIALOG ===== */}
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

         {/* ===== WHAT OUR LEARNERS SAY ===== */}
      {/* CHANGE 7: Removed outline from section title */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side */}
            <div>
              <p className="text-xs font-bold text-brand-medium-blue uppercase tracking-widest mb-3">
                Testimonial
              </p>
              {/* CHANGE 7: No border/outline on title */}
              <h2 className="text-4xl font-bold text-brand-medium-blue mb-6">
                What Our Learners Say
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Tutor Scene has earned the trust of learners and tutors
                worldwide. Learners love our platform because they&apos;re
                matched with tutors who actually fit how they learn which makes
                progress feel natural, not forced. Share your experience about
                The Scene. We would love to hear from you!
              </p>
              {/* CHANGE 12: Arrow added to Write Your Review button */}
              <button
                type="button"
                onClick={handleOpenReviewDialog}
                className="inline-flex items-center border-2 border-brand-medium-blue text-brand-medium-blue hover:bg-brand-medium-blue hover:text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Write Your Review
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Side - Review Gallery */}
            <div className="relative max-w-lg mx-auto lg:mx-0">
              <div className="relative rounded-3xl overflow-hidden shadow-xl">
                <img
                  src={`${process.env.PUBLIC_URL}/images/testimonials.jpg`}
                  alt="Learner testimonial"
                  className="w-full h-auto object-cover max-h-[420px]"
                />

                {!loadingTestimonials && galleryTestimonials.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrevTestimonial}
                      className="absolute top-1/2 left-3 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Previous review"
                    >
                      <svg className="w-5 h-5 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextTestimonial}
                      className="absolute top-1/2 right-3 -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Next review"
                    >
                      <svg className="w-5 h-5 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              <div className="relative -mt-28 sm:-mt-32 mx-4 bg-white rounded-2xl shadow-2xl p-6 sm:p-8 border-l-4 border-brand-gold">
                {loadingTestimonials ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue" />
                  </div>
                ) : galleryTestimonials.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">
                    Reviews will appear here once approved by an administrator.
                  </p>
                ) : (
                  <>
                    <blockquote className="text-gray-700 text-base leading-relaxed mb-4 italic">
                      &ldquo;{currentTestimonial?.testimonial || ""}&rdquo;
                    </blockquote>
                    {currentTestimonial?.testimonialBy && (
                      <p className="text-sm font-bold text-gray-900">
                        {currentTestimonial.testimonialBy}
                      </p>
                    )}
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
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== WHY TUTOR SCENE? SECTION ===== */}
      {/* CHANGE 4: Removed border/outline from section title; globe icon for "Learn Anywhere" */}
      {/* CHANGE 9: Moved this section to appear right after How It Works */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* CHANGE 4: No border/outline on title */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-brand-medium-blue py-3 px-8">
              Why Tutor Scene?
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side — Marketing Video */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg bg-gray-100 aspect-video flex items-center justify-center">
              <video
                src="/videos/marketing.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <svg className="w-16 h-16 mb-3 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p>Marketing video will appear here</p>
                </div>
              </video>
              <noscript>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm">
                  <svg className="w-16 h-16 mb-3 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <p>Marketing video will appear here</p>
                </div>
              </noscript>
            </div>

            {/* Right Side — Feature List */}
            <div className="space-y-8">
              {/* Flexible Scheduling */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">Flexible Scheduling</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Book sessions at times that fit your real schedule</p>
                </div>
              </div>

              {/* Personalized Matching */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">Personalized Matching</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Get matched based on subject, goals, and learning style</p>
                </div>
              </div>

              {/* Easy Booking */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">Easy Booking</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Browse tutors, book times, and keep everything in one place</p>
                </div>
              </div>

              {/* CHANGE 4: Learn Anywhere — globe icon */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  {/* Globe icon */}
                  <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">Learn Anywhere</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Connect online and access learning from anywhere</p>
                </div>
              </div>

              {/* Keep Learners Organized */}
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-brand-medium-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-base font-bold text-brand-medium-blue mb-1">Keep Learners Organized</h4>
                  <p className="text-gray-600 text-sm leading-relaxed">Track multiple learners under one account and stay organized</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ON-DEMAND LEARNING LIBRARY ===== */}
      {/* CHANGE 5: Custom laptop SVG with thumbnail content (no brand logos) */}
      <div className="relative bg-gradient-to-r from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end pt-10 pb-6 overflow-hidden text-white">
        {/* Decorative bubbles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-12 w-16 h-16 rounded-full bg-brand-light-blue/15 blur-xl" />
          <div className="absolute bottom-10 right-16 w-24 h-24 rounded-full bg-brand-gold/10 blur-2xl" />
          <div className="absolute top-1/3 right-1/4 w-10 h-10 rounded-full border border-brand-gold/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 max-w-3xl mx-auto mb-6 text-center">
            {countdownParts.map((item) => (
              <div key={item.label}>
                <p className="text-4xl sm:text-5xl font-semibold leading-none">{item.value}</p>
                <p className="mt-2 text-base sm:text-3xl tracking-wide text-white/95">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-bold leading-tight">
              On-Demand Learning Library
            </h2>
            <p className="text-4xl sm:text-6xl font-light leading-none -mt-1">
              {isAuthenticated() && getCurrentUser()?.role === 'student' ? (
                <Link
                  to="/on-demand-learning"
                  className="underline hover:text-brand-gold transition-colors"
                >
                  Explore the library →
                </Link>
              ) : (
                'Coming Soon!'
              )}
            </p>

            {/* CHANGE 5: Custom laptop illustration with video/PDF/worksheet thumbnails — no brand logos */}
            <div className="mx-auto mt-4 mb-0 w-full max-w-md sm:max-w-lg block">
              <svg viewBox="0 0 520 340" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto drop-shadow-2xl">
                {/* Laptop base/body */}
                <rect x="60" y="30" width="400" height="240" rx="10" ry="10" fill="#1a1a2e" />
                {/* Screen bezel */}
                <rect x="68" y="38" width="384" height="224" rx="6" ry="6" fill="#0d0d1a" />
                {/* Screen background */}
                <rect x="74" y="44" width="372" height="212" rx="4" ry="4" fill="#f3f4f6" />

                {/* Screen content — top bar */}
                <rect x="74" y="44" width="372" height="24" rx="4" ry="4" fill="#e5e7eb" />
                <circle cx="88" cy="56" r="5" fill="#ef4444" />
                <circle cx="102" cy="56" r="5" fill="#f59e0b" />
                <circle cx="116" cy="56" r="5" fill="#10b981" />
                <rect x="140" y="50" width="200" height="12" rx="6" fill="#d1d5db" />

                {/* Screen label */}
                <text x="260" y="82" textAnchor="middle" fill="#1667b0" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Learning Library</text>

                {/* Row 1 Thumbnails */}
                {/* Thumbnail 1 — Video play */}
                <rect x="82" y="90" width="108" height="70" rx="6" fill="#1667b0" />
                <polygon points="118,120 118,145 140,132" fill="white" opacity="0.9" />
                <rect x="82" y="152" width="108" height="8" rx="2" fill="#d1d5db" />
                <rect x="82" y="163" width="70" height="6" rx="2" fill="#e5e7eb" />
                <rect x="156" y="148" width="26" height="10" rx="3" fill="#ef4444" />
                <text x="169" y="156" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">VIDEO</text>

                {/* Thumbnail 2 — PDF */}
                <rect x="206" y="90" width="108" height="70" rx="6" fill="#dc2626" />
                {/* PDF page lines */}
                <rect x="222" y="100" width="76" height="6" rx="2" fill="white" opacity="0.8" />
                <rect x="222" y="110" width="60" height="4" rx="2" fill="white" opacity="0.6" />
                <rect x="222" y="118" width="68" height="4" rx="2" fill="white" opacity="0.6" />
                <rect x="222" y="126" width="50" height="4" rx="2" fill="white" opacity="0.6" />
                <rect x="222" y="134" width="64" height="4" rx="2" fill="white" opacity="0.6" />
                <rect x="222" y="144" width="40" height="8" rx="3" fill="#fbbf24" />
                <text x="242" y="150" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold" fontFamily="sans-serif">PDF</text>
                <rect x="206" y="152" width="108" height="8" rx="2" fill="#d1d5db" />
                <rect x="206" y="163" width="70" height="6" rx="2" fill="#e5e7eb" />

                {/* Thumbnail 3 — Worksheet */}
                <rect x="330" y="90" width="108" height="70" rx="6" fill="#059669" />
                {/* Worksheet grid lines */}
                <rect x="342" y="100" width="84" height="5" rx="1" fill="white" opacity="0.8" />
                <line x1="342" y1="112" x2="426" y2="112" stroke="white" strokeWidth="0.8" opacity="0.5" />
                <line x1="342" y1="120" x2="426" y2="120" stroke="white" strokeWidth="0.8" opacity="0.5" />
                <line x1="342" y1="128" x2="426" y2="128" stroke="white" strokeWidth="0.8" opacity="0.5" />
                <line x1="342" y1="136" x2="426" y2="136" stroke="white" strokeWidth="0.8" opacity="0.5" />
                <line x1="375" y1="108" x2="375" y2="142" stroke="white" strokeWidth="0.8" opacity="0.5" />
                {/* Checkmarks */}
                <text x="356" y="121" fill="white" fontSize="8" opacity="0.9">✓</text>
                <text x="356" y="130" fill="white" fontSize="8" opacity="0.9">✓</text>
                <text x="390" y="121" fill="white" fontSize="8" opacity="0.7">○</text>
                <rect x="330" y="152" width="108" height="8" rx="2" fill="#d1d5db" />
                <rect x="330" y="163" width="70" height="6" rx="2" fill="#e5e7eb" />
                <rect x="392" y="148" width="40" height="10" rx="3" fill="#059669" />
                <text x="412" y="156" textAnchor="middle" fill="white" fontSize="5.5" fontWeight="bold" fontFamily="sans-serif">SHEET</text>

                {/* Row 2 Thumbnails — smaller strip */}
                {/* Mini thumb 1 */}
                <rect x="82" y="178" width="70" height="40" rx="4" fill="#7c3aed" />
                <polygon points="103,193 103,208 115,200" fill="white" opacity="0.85" />
                {/* Mini thumb 2 */}
                <rect x="162" y="178" width="70" height="40" rx="4" fill="#b91c1c" />
                <rect x="172" y="185" width="50" height="4" rx="1" fill="white" opacity="0.7" />
                <rect x="172" y="192" width="40" height="3" rx="1" fill="white" opacity="0.5" />
                <rect x="172" y="199" width="46" height="3" rx="1" fill="white" opacity="0.5" />
                {/* Mini thumb 3 */}
                <rect x="242" y="178" width="70" height="40" rx="4" fill="#0369a1" />
                <polygon points="263,193 263,208 275,200" fill="white" opacity="0.85" />
                {/* Mini thumb 4 */}
                <rect x="322" y="178" width="70" height="40" rx="4" fill="#d97706" />
                <rect x="332" y="185" width="50" height="4" rx="1" fill="white" opacity="0.7" />
                <rect x="332" y="192" width="38" height="3" rx="1" fill="white" opacity="0.5" />
                <rect x="332" y="199" width="44" height="3" rx="1" fill="white" opacity="0.5" />
                {/* Mini thumb 5 */}
                <rect x="402" y="178" width="44" height="40" rx="4" fill="#0d9488" />
                <text x="424" y="201" textAnchor="middle" fill="white" fontSize="14" opacity="0.9">+</text>

                {/* Laptop hinge */}
                <rect x="55" y="268" width="410" height="8" rx="3" fill="#2d2d44" />
                {/* Laptop bottom/keyboard area */}
                <rect x="30" y="272" width="460" height="28" rx="6" ry="6" fill="#2a2a3e" />
                {/* Trackpad */}
                <rect x="220" y="278" width="80" height="16" rx="3" fill="#3a3a55" />
                {/* Keyboard keys hint */}
                <rect x="60" y="280" width="140" height="4" rx="2" fill="#3a3a55" opacity="0.6" />
                <rect x="60" y="287" width="130" height="4" rx="2" fill="#3a3a55" opacity="0.6" />
                <rect x="320" y="280" width="140" height="4" rx="2" fill="#3a3a55" opacity="0.6" />
                <rect x="325" y="287" width="130" height="4" rx="2" fill="#3a3a55" opacity="0.6" />
                {/* Base shadow */}
                <ellipse cx="260" cy="310" rx="220" ry="10" fill="black" opacity="0.2" />
              </svg>
            </div>
          </div>
        </div>
      </div> 
      {/* ===== WRITE A REVIEW DIALOG ===== */}
      {/* CHANGE 8: 250 character limit */}
     <Dialog
  open={reviewDialogOpen}
  onClose={handleCloseReviewDialog}
  maxWidth="sm"
  fullWidth
  PaperProps={{
    sx: {
      overflow: "visible",
      borderRadius: "12px",
    },
  }}
>
        <DialogTitle className="pb-2">
          <div className="flex items-center justify-between">
            <span className="text-brand-medium-blue font-bold">Write a Review</span>
            <button
              type="button"
              onClick={handleCloseReviewDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close review popup"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </DialogTitle>
        <DialogContent className="space-y-4" sx={{ overflow: "visible" }}>
          <input
            type="text"
            value={reviewName}
            onChange={(e) => { setReviewName(e.target.value); setReviewError(""); }}
            placeholder="Your Name*"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
          />
          <input
            type="email"
            value={reviewEmail}
            onChange={(e) => { setReviewEmail(e.target.value); setReviewError(""); }}
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
                  onClick={() => { setReviewRating(star); setReviewError(""); }}
                  className="transition-transform hover:scale-110"
                  aria-label={`Set rating ${star}`}
                >
                  <svg
                    className={`w-6 h-6 ${star <= reviewRating ? "text-yellow-400" : "text-gray-300"}`}
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
            onChange={(e) => { setReviewComment(e.target.value); setReviewError(""); }}
            placeholder="Share your experience with Tutor Scene..."
            rows={4}
            maxLength={250}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue resize-none"
          />
          <div className="flex justify-end text-xs text-gray-500">
            {reviewComment.length}/250
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

      {/* ===== READY TO GET STARTED SECTION ===== */}
      {/* CHANGE 10: "Join Tutor Scene today" is white and larger; CHANGE 11: larger button font; CHANGE 12: arrows on buttons */}
      <div className="relative bg-gradient-to-r from-brand-gradient-start via-brand-gradient-mid to-brand-gradient-end py-20 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
          <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
          <div className="absolute bottom-8 left-1/4 w-12 h-12 rounded-full bg-brand-gold/15 blur-xl" />
          <div className="absolute top-8 right-16 w-10 h-10 rounded-full bg-brand-light-blue/20 blur-lg" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          {/* CHANGE 10: white text, larger font (text-2xl), but smaller than heading */}
          <p className="text-2xl text-white font-semibold mb-8">
            Join Tutor Scene today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* CHANGE 11: larger font on buttons (text-lg); CHANGE 12: arrows */}
            <button
              type="button"
              onClick={goFindTutor}
              className="bg-white text-brand-medium-blue border-2 border-brand-gold hover:bg-brand-medium-blue hover:text-white font-normal py-4 px-10 sm:px-14 min-w-[14rem] sm:min-w-[17rem] justify-center rounded-lg transition-all shadow-lg inline-flex items-center gap-2 text-lg"
            >
              Find a Tutor Now
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => navigate("/become-tutor")}
              className="bg-white text-brand-medium-blue border-2 border-brand-gold hover:bg-brand-medium-blue hover:text-white font-normal py-4 px-10 sm:px-14 min-w-[14rem] sm:min-w-[17rem] justify-center rounded-lg transition-all shadow-lg inline-flex items-center gap-2 text-lg"
            >
              Become a Tutor
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;