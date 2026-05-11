import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest, resolveApiAssetUrl } from "../utils/api";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import NotificationsPanel from "./Notifications/NotificationsPanel";
import BookSessionLearnerFlow from "./bookSession/BookSessionLearnerFlow";

// Icons
const CalendarIcon = (props) => (
  <svg
    {...props}
    className="w-5 h-5"
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
);

const ClockIcon = (props) => (
  <svg
    {...props}
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const UsersIcon = () => (
  <svg
    className="w-5 h-5"
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
);

// All 11 My Tutors filter options
const TUTOR_FILTER_OPTIONS = [
  {
    key: "recently-contacted",
    label: "Recently Contacted",
    desc: "Messaged or requested within last X days",
  },
  {
    key: "favorited",
    label: "Favorited Tutors",
    desc: "All tutors starred/liked, regardless of contact",
  },
  {
    key: "saved-for-student",
    label: "Saved for a Student",
    desc: "Child-based lists",
  },
  {
    key: "active",
    label: "Active Tutors (Booked/Assigned)",
    desc: "Upcoming sessions, recurring or active bookings",
  },
  {
    key: "past",
    label: "Past Tutors",
    desc: "Completed sessions — great for rebooking",
  },
  {
    key: "recommended",
    label: "Recommended For You",
    desc: "Based on subject needs, grade, location & ratings",
  },
  {
    key: "shortlist",
    label: "Shortlist / Comparing",
    desc: "Deciding between 3–5 tutors",
  },
  {
    key: "waiting-reply",
    label: "Waiting on Reply",
    desc: "Messaged but no response yet (with timestamps)",
  },
  {
    key: "unavailable",
    label: "Unavailable / Not Accepting New Students",
    desc: "Tutors you liked who are currently full — saved for later",
  },
  {
    key: "blocked",
    label: "Blocked / Hidden",
    desc: "Tutors you don't want to see again",
  },
  {
    key: "notes-tagged",
    label: "Notes-Only / Tagged",
    desc: "Custom tags like: Great for ADHD, Homework help…",
  },
];

const MOCK_LEARNER_TABS = [
  { label: "Emma (6)", key: "emma" },
  { label: "Jack (2)", key: "jack" },
  { label: "Sarah (1)", key: "sarah" },
  { label: "Michael (3)", key: "michael" },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentTutors, setRecentTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTutors, setLoadingTutors] = useState(true);
  const [error, setError] = useState(null);
  const [tutorsError, setTutorsError] = useState(null);
  const [user, setUser] = useState(null);
  const [discoverTutors, setDiscoverTutors] = useState([]);
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  // My Tutors active tab (learner tabs)
  const [activeTutorTab, setActiveTutorTab] = useState(0);

  // My Tutors active filter
  const [activeTutorFilter, setActiveTutorFilter] =
    useState("recently-contacted");

  // My Tutors search
  const [tutorSearch, setTutorSearch] = useState("");

  // Favorite toggle state (local UI)
  const [favoritedTutors, setFavoritedTutors] = useState({});

  // Add Note / Tag modal state
  const [noteModal, setNoteModal] = useState({
    open: false,
    tutorId: null,
    type: null,
    value: "",
  });

  // Assign to Student picker state
  const [assignModal, setAssignModal] = useState({
    open: false,
    tutorId: null,
  });

  // Cancel booking dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(false);

  useEffect(() => {
    setActiveTutorTab(0);
  }, [activeTutorFilter]);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const userData = JSON.parse(userStr);
      setUser(userData);
    }
  }, []);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const response = await apiRequest(
          `/api/v1/bookings/student/${user.id}/sessions?status=upcoming`,
          { method: "GET" }
        );
        setUpcomingSessions(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching upcoming sessions:", err);
        setError("Failed to load upcoming sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchUpcomingSessions();
  }, [user?.id]);

  useEffect(() => {
    const fetchRecentTutors = async () => {
      if (!user?.id) return;
      try {
        setLoadingTutors(true);
        const response = await apiRequest(
          `/api/v1/conversations/student/${user.id}/recent-tutors`,
          { method: "GET" }
        );
        const list = Array.isArray(response) ? response : response?.data || [];
        setRecentTutors(list);
        setTutorsError(null);
      } catch (err) {
        console.error("Error fetching recent tutors:", err);
        setTutorsError("Failed to load recent tutors");
      } finally {
        setLoadingTutors(false);
      }
    };
    fetchRecentTutors();
  }, [user?.id]);

  useEffect(() => {
    const loadDiscover = async () => {
      if (!user?.id) return;
      try {
        setLoadingDiscover(true);
        const res = await apiRequest(
          "/api/v1/onboarding/tutor?priceRange=lowToHigh",
          { method: "GET" }
        );
        const list = res.tutors || res.data || [];
        setDiscoverTutors(Array.isArray(list) ? list.slice(0, 8) : []);
      } catch {
        setDiscoverTutors([]);
      } finally {
        setLoadingDiscover(false);
      }
    };
    loadDiscover();
  }, [user?.id]);

  const handleJoinSession = (zoomLink) => {
    if (zoomLink) {
      window.open(zoomLink, "_blank");
    } else {
      alert("Zoom link not available for this session");
    }
  };

  const handleFindTutors = () => navigate("/find-tutors");
  const handleMySessions = () => navigate("/my-sessions");
  const handleBookSession = () => navigate("/book-session");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenCancelDialog = (session) => {
    setSessionToCancel(session);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSessionToCancel(null);
  };

  const handleCancelBooking = async () => {
    if (!sessionToCancel) return;
    setCancellingBooking(true);
    try {
      await apiRequest(`/api/v1/bookings/${sessionToCancel.id}/cancel`, {
        method: "PATCH",
      });
      setUpcomingSessions((prev) =>
        prev.filter((s) => s.id !== sessionToCancel.id)
      );
      handleCloseCancelDialog();
    } catch (err) {
      console.error("Failed to cancel booking:", err);
      alert(err.message || "Failed to cancel booking. Please try again.");
    } finally {
      setCancellingBooking(false);
    }
  };

  const toggleFavorite = (tutorId) => {
    setFavoritedTutors((prev) => ({ ...prev, [tutorId]: !prev[tutorId] }));
  };

  const matchesSearch = (item) => {
    const tutorInfo = item.tutor || {};
    const prospectInfo = item.prospectInfo || {};
    const name = (
      prospectInfo.fullName ||
      `${tutorInfo.firstName || ""} ${tutorInfo.lastName || ""}`
    ).toLowerCase();
    return name.includes(tutorSearch.toLowerCase());
  };

  const searchedRecent = recentTutors.filter(matchesSearch);

  let displayTutors = [];
  if (
    activeTutorFilter === "recently-contacted" ||
    activeTutorFilter === "saved-for-student"
  ) {
    displayTutors = searchedRecent;
  } else if (activeTutorFilter === "favorited") {
    displayTutors = searchedRecent.filter((item) => {
      const id = item.tutorId ?? item.tutor?.id;
      return favoritedTutors[id];
    });
  } else {
    displayTutors = [];
  }

  const learnerTabs =
    activeTutorFilter === "saved-for-student"
      ? MOCK_LEARNER_TABS
      : user
      ? [
          {
            label: `${user.firstName || "Me"} (${displayTutors.length})`,
            key: "self",
          },
        ]
      : [];

  const tutorFirstName = (item) => {
    const t = item.tutor || {};
    if (t.firstName) return t.firstName;
    const full = item.prospectInfo?.fullName;
    if (full) return full.trim().split(/\s+/)[0] || "Tutor";
    return "Tutor";
  };

  const goChat = (item) => {
    if (item.conversationId) {
      navigate(`/messages?conversation=${item.conversationId}`);
    } else {
      navigate("/messages");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header Banner ── */}
      <div className="bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 md:ml-36 pt-10 pb-6">
          <h1 className="text-4xl font-bold mb-1">
            Hello {user?.firstName || "Student"}
          </h1>
          <p className="text-lg text-brand-light-blue italic">
            Continue your learning journey on The Scene!
          </p>
        </div>
      </div>

      <div className="w-full bg-white border-b border-gray-200">
        <BookSessionLearnerFlow embedded />
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* ── Left Column ── */}
          <div className="lg:col-span-3 space-y-6">
            {/* Quick Action Cards */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div
                onClick={handleBookSession}
                className="flex-1 min-w-0 basis-0 bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-brand-medium-blue rounded-full flex items-center justify-center border-2 border-brand-gold mb-3">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-base font-bold text-gray-900">
                  Book a Session
                </h3>
                <p className="text-gray-500 text-xs mt-1">
                  Learning Style Match
                </p>
              </div>

              <div
                onClick={handleFindTutors}
                className="flex-1 min-w-0 basis-0 bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-brand-medium-blue rounded-full flex items-center justify-center border-2 border-brand-gold mb-3">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-base font-bold text-gray-900">
                  Find Tutor
                </h3>
                <p className="text-gray-500 text-xs mt-1">Custom Search</p>
              </div>

              <div
                onClick={handleMySessions}
                className="flex-1 min-w-0 basis-0 bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-shadow cursor-pointer flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 bg-brand-medium-blue rounded-full flex items-center justify-center border-2 border-brand-gold mb-3">
                  <svg
                    className="w-6 h-6 text-white"
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
                <h3 className="text-base font-bold text-gray-900">
                  My Sessions
                </h3>
                <p className="text-gray-500 text-xs mt-1">View History</p>
              </div>
            </div>

            {/* <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Available tutors
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Recently approved tutors on Tutor Scene. My Tutors below only lists people you have messaged.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFindTutors}
                  className="shrink-0 text-sm font-medium text-brand-medium-blue hover:text-brand-dark-blue hover:underline"
                >
                  Search all tutors
                </button>
              </div>
              {loadingDiscover ? (
                <div className="flex justify-center py-6">
                  <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-brand-medium-blue" />
                </div>
              ) : discoverTutors.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  No active tutors are listed yet. Try again after an admin approves a tutor, or use Find Tutor to search by subject.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {discoverTutors.map((t) => {
                    const pic = t.profilePic
                      ? resolveApiAssetUrl(t.profilePic)
                      : null;
                    const name = t.fullName || "Tutor";
                    const first = name.trim().split(/\s+/)[0] || "Tutor";
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => navigate(`/tutor/${t.id}`)}
                        className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:border-brand-medium-blue hover:bg-gray-50 transition-colors"
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gray-200">
                          {pic ? (
                            <img
                              src={pic}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-gray-600">
                              {first.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {name}
                          </p>
                          {t.subjects ? (
                            <p className="truncate text-xs text-gray-500">
                              {t.subjects}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div> */}

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CalendarIcon className="text-brand-medium-blue" />
                <h2 className="text-xl font-bold text-gray-900">
                  Upcoming Sessions
                </h2>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No upcoming sessions scheduled
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={
                            session.tutor?.profilePicture ||
                            `https://placehold.co/48x48/E0E0E0/333333?text=${
                              session.tutor?.firstName?.[0] || "T"
                            }${session.tutor?.lastName?.[0] || "T"}`
                          }
                          alt={`${session.tutor?.fullName || ""}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="font-bold text-gray-900">
                            {session.tutor?.fullName}
                          </h3>
                          {session.subject && (
                            <div className="flex space-x-2 mt-1">
                              <span className="bg-brand-light-blue text-brand-dark-blue px-2 py-1 rounded-full text-xs font-medium">
                                {session.subject.name || session.subject}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{formatDate(session.startTime)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ClockIcon className="w-4 h-4" />
                              <span>{formatTime(session.endTime)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            handleJoinSession(session.zoomJoinLink)
                          }
                          className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          Join Session
                        </button>
                        {session.status === "confirmed" && (
                          <button
                            onClick={() => handleOpenCancelDialog(session)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            title="Cancel Booking"
                          >
                            <svg
                              className="w-5 h-5"
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
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════
                MY TUTORS SECTION — full client spec
            ══════════════════════════════════════════ */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Section Title */}
              <div className="flex items-center space-x-2 mb-4">
                <UsersIcon />
                <h2 className="text-lg font-semibold text-gray-800">
                  My Tutors
                </h2>
              </div>

              {loadingTutors ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
                </div>
              ) : tutorsError ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{tutorsError}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* ── LEFT: Learner tabs + search + tutor list ── */}
                  <div className="md:col-span-2 bg-[#f8fafc] p-4 rounded-lg border">
                    {/* Learner Tabs */}
                    {learnerTabs.length > 0 && (
                      <div className="flex gap-2 mb-3">
                        {learnerTabs.map((tab, idx) => (
                          <button
                            key={tab.key || idx}
                            onClick={() => setActiveTutorTab(idx)}
                            className={`px-3 py-1 rounded-md text-xs font-medium border ${
                              activeTutorTab === idx
                                ? "bg-brand-medium-blue text-white border-brand-medium-blue"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Search Bar */}
                    <div className="relative mb-4">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                      <input
                        type="text"
                        placeholder="Search tutors..."
                        value={tutorSearch}
                        onChange={(e) => setTutorSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                      />
                    </div>

                    {/* Tutor List */}
                    {displayTutors.length === 0 ? (
                      <p className="text-gray-500 text-sm py-4">
                        {activeTutorFilter === "recently-contacted" ||
                        activeTutorFilter === "saved-for-student"
                          ? "No tutors found"
                          : "No tutors in this list yet."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {displayTutors.map((item) => {
                          const tutorInfo = item.tutor || {};
                          const prospectInfo = item.prospectInfo || {};
                          const tutorId = item.tutorId ?? tutorInfo.id;
                          const isFav = !!favoritedTutors[tutorId];
                          const hasConversation = !!item.conversationId;

                          return (
                            <div
                              key={item.conversationId || tutorId}
                              className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-center space-x-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                    <img
                                      src={
                                        prospectInfo.profilePic ||
                                        tutorInfo.profilePhotoUrl ||
                                        `https://placehold.co/40x40/E0E0E0/333333?text=${
                                          tutorInfo.firstName?.[0] || "T"
                                        }${tutorInfo.lastName?.[0] || "T"}`
                                      }
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h3 className="text-sm font-semibold text-gray-800 truncate">
                                      {tutorFirstName(item)}
                                    </h3>
                                    {prospectInfo.yearsOfExperience != null && (
                                      <p className="text-xs text-gray-500">
                                        {prospectInfo.yearsOfExperience} years
                                        experience
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5 justify-start sm:justify-end">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/tutor/${tutorId}`)
                                    }
                                    className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                  >
                                    View Profile
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => goChat(item)}
                                    className="text-xs px-2.5 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                                  >
                                    {hasConversation
                                      ? "View Message"
                                      : "Send Message"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => goChat(item)}
                                    className="text-xs px-2.5 py-1.5 rounded-md border border-brand-medium-blue text-brand-medium-blue hover:bg-brand-medium-blue hover:text-white transition-colors whitespace-nowrap"
                                  >
                                    View in Chat
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleBookSession}
                                    className="text-xs px-2.5 py-1.5 rounded-md bg-brand-medium-blue text-white hover:bg-brand-dark-blue transition-colors whitespace-nowrap"
                                  >
                                    Book
                                  </button>
                                </div>
                              </div>

                              {/* Quick Action Icons row */}
                              <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-100">
                                {/* ⭐ Favorite toggle */}
                                <button
                                  onClick={() => toggleFavorite(tutorId)}
                                  title="Favorite toggle"
                                  className={`flex items-center gap-1 text-xs transition-colors ${
                                    isFav
                                      ? "text-yellow-500"
                                      : "text-gray-400 hover:text-yellow-500"
                                  }`}
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill={isFav ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                                    />
                                  </svg>
                                  <span>
                                    {isFav ? "Favorited" : "Favorite"}
                                  </span>
                                </button>

                                {/* 👧 Assign to Student */}
                                <button
                                  onClick={() =>
                                    setAssignModal({ open: true, tutorId })
                                  }
                                  title="Assign to Student"
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-medium-blue transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
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
                                  <span>Assign to Student</span>
                                </button>

                                {/* 🏷 Add Tag */}
                                <button
                                  onClick={() =>
                                    setNoteModal({
                                      open: true,
                                      tutorId,
                                      type: "tag",
                                      value: "",
                                    })
                                  }
                                  title="Add Tag"
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-medium-blue transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                    />
                                  </svg>
                                  <span>Add Tag</span>
                                </button>

                                {/* 📝 Add Note */}
                                <button
                                  onClick={() =>
                                    setNoteModal({
                                      open: true,
                                      tutorId,
                                      type: "note",
                                      value: "",
                                    })
                                  }
                                  title="Add Note"
                                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-medium-blue transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  <span>Add Note</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Manage Lists */}
                    <button
                      type="button"
                      className="mt-4 flex items-center text-xs text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-1 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                      Manage Lists
                    </button>
                  </div>

                  {/* ── RIGHT: My Tutors Filters (all 11) ── */}
                  <div className="md:col-span-1">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                      My Tutors Filters
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-lg divide-y overflow-hidden">
                      {TUTOR_FILTER_OPTIONS.map((filter) => (
                        <button
                          key={filter.key}
                          onClick={() => setActiveTutorFilter(filter.key)}
                          className={`w-full flex items-start justify-between px-4 py-3 text-left transition-colors ${
                            activeTutorFilter === filter.key
                              ? "bg-[#f1f5f9]"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex-1 pr-2">
                            <p
                              className={`text-sm leading-tight ${
                                activeTutorFilter === filter.key
                                  ? "font-semibold text-gray-900"
                                  : "text-gray-700"
                              }`}
                            >
                              {filter.label}
                              {filter.key === "recently-contacted" && (
                                <span className="ml-1 text-xs text-brand-medium-blue font-normal">
                                  (default)
                                </span>
                              )}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 opacity-40 flex-shrink-0 mt-0.5"
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
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* ══ END MY TUTORS SECTION ══ */}
          </div>

          {/* ── Right Column — Notifications ── */}
          <div className="lg:col-span-1">
            <NotificationsPanel />
          </div>
        </div>
      </div>

      {/* Cancel Booking Confirmation Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-gray-900">
              Cancel Booking
            </span>
            <button
              onClick={handleCloseCancelDialog}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={cancellingBooking}
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
        <DialogContent>
          <div className="py-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Are you sure you want to proceed with this action?
            </h3>
            <p className="text-gray-600 text-center text-sm">
              This will cancel your booking with{" "}
              {sessionToCancel?.tutor?.fullName}. This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button
            onClick={handleCloseCancelDialog}
            color="inherit"
            disabled={cancellingBooking}
          >
            No, Keep Booking
          </Button>
          <Button
            onClick={handleCancelBooking}
            variant="contained"
            color="error"
            disabled={cancellingBooking}
          >
            {cancellingBooking ? "Cancelling..." : "Yes, Cancel Booking"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add Tag / Add Note Modal ── */}
      <Dialog
        open={noteModal.open}
        onClose={() =>
          setNoteModal({ open: false, tutorId: null, type: null, value: "" })
        }
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {noteModal.type === "tag" ? "Add Tag" : "Add Note"}
        </DialogTitle>
        <DialogContent>
          <input
            type="text"
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
            placeholder={
              noteModal.type === "tag"
                ? 'e.g. "Great for ADHD", "Test prep"'
                : "Write a note…"
            }
            value={noteModal.value}
            onChange={(e) =>
              setNoteModal((prev) => ({ ...prev, value: e.target.value }))
            }
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setNoteModal({
                open: false,
                tutorId: null,
                type: null,
                value: "",
              })
            }
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // TODO: wire up to API
              console.log(
                `Saved ${noteModal.type} for tutor ${noteModal.tutorId}:`,
                noteModal.value
              );
              setNoteModal({
                open: false,
                tutorId: null,
                type: null,
                value: "",
              });
            }}
            variant="contained"
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign to Student Picker Modal ── */}
      <Dialog
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false, tutorId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign to Student</DialogTitle>
        <DialogContent>
          <p className="text-sm text-gray-600 mt-2">
            Select which student(s) to assign this tutor to:
          </p>
          {/* Placeholder — replace with real student list from API */}
          <div className="mt-3 space-y-2">
            {["Child A", "Child B", "Child C"].map((child) => (
              <label
                key={child}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input type="checkbox" className="rounded border-gray-300" />
                {child}
              </label>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setAssignModal({ open: false, tutorId: null })}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              // TODO: wire up to API
              setAssignModal({ open: false, tutorId: null });
            }}
            variant="contained"
            color="primary"
          >
            Assign
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentDashboard;
