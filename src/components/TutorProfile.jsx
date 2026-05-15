import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import BookSession from './BookSession';
import MessageRequestButton from './Messaging/MessageRequestButton';
import { apiRequest, resolveApiAssetUrl } from '../utils/api';
import {
  tutorFirstName,
  formatAverageResponseLabel,
  formatLearnerRateDisplay,
  filterSubjectPills,
  bioPreview,
} from '../utils/tutorLearnerDisplay';

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const tutorData = {
  name: 'Sarah Mitchell',
  rate: 70,
  rating: 4.9,
  totalReviews: 127,
  sessions: 450,
  experience: '8 years',
  description:
    'Experienced mathematics and physics tutor with over 8 years of teaching experience. I specialize in making complex concepts easy to understand. With 8 years of teaching experience, I\'ve helped hundreds of students achieve their academic goals. My teaching philosophy focuses on building strong fundamentals and developing critical thinking skills. I believe every student can succeed with the right guidance and support.',
  reviews: [],
};

const TutorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const filterSubject = searchParams.get('subject') || '';
  const filterLevel = searchParams.get('level') || '';

  const defaultFindTutorsReturn = useMemo(() => {
    const qs = new URLSearchParams();
    if (filterSubject) qs.set('subject', filterSubject);
    if (filterLevel) qs.set('level', filterLevel);
    const q = qs.toString();
    return q ? `/find-tutors?${q}` : '/find-tutors';
  }, [filterSubject, filterLevel]);

  const returnTo = location.state?.returnTo || defaultFindTutorsReturn;

  const [showBooking, setShowBooking] = useState(null);
  const [tutorDetails, setTutorDetails] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      navigate(returnTo, { replace: true });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, returnTo]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!loading && tutorDetails) {
      window.scrollTo(0, 0);
    }
  }, [loading, tutorDetails, id]);

  useEffect(() => {
    const fetchTutorData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError(null);
        const detailsResponse = await apiRequest(`/api/v1/onboarding/tutor/${id}`, {
          method: 'GET',
        });
        setTutorDetails(detailsResponse);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load tutor information');
      } finally {
        setLoading(false);
      }
    };
    fetchTutorData();
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      try {
        setLoadingReviews(true);
        const reviewsResponse = await apiRequest(
          `/api/v1/reviews/tutor/${id}?status=approved`,
          { method: 'GET' },
        );
        let reviewsList = [];
        if (Array.isArray(reviewsResponse)) reviewsList = reviewsResponse;
        else if (Array.isArray(reviewsResponse.reviews))
          reviewsList = reviewsResponse.reviews;
        else if (Array.isArray(reviewsResponse.data))
          reviewsList = reviewsResponse.data;
        setReviews(reviewsList);
      } catch {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };
    fetchReviews();
  }, [id]);

  const filteredPills = useMemo(() => {
    const pills = tutorDetails?.subjectPills;
    if (!Array.isArray(pills) || !pills.length) return [];
    return filterSubjectPills(pills, filterSubject, filterLevel);
  }, [tutorDetails, filterSubject, filterLevel]);

  const rateDisplay = useMemo(() => {
    if (!tutorDetails) return { line: '—' };
    return formatLearnerRateDisplay(
      tutorDetails.fee,
      tutorDetails.feeRangeMin,
      tutorDetails.feeRangeMax,
      filterSubject,
      filterLevel,
    );
  }, [tutorDetails, filterSubject, filterLevel]);

  const handleBookSession = () => {
    const bookingData = {
      tutorProfileId: tutorDetails?.id,
      userId: tutorDetails?.userId,
      subjects: tutorDetails?.subjects,
      gradeLevels: tutorDetails?.gradeLevels,
    };
    setShowBooking(bookingData);
  };

  const handleCloseBooking = () => {
    setShowBooking(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mx-auto mb-4" />
          <p className="text-gray-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-medium py-2 px-6 rounded-lg transition-colors shadow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const mergedTutorData = tutorDetails
    ? {
        name: tutorDetails.fullName || 'Unknown Tutor',
        rate: parseFloat(tutorDetails.fee) || 70,
        rating: tutorDetails.rating || 4.9,
        totalReviews: reviews.length || tutorDetails.totalReviews || 0,
        sessions: tutorDetails.totalSessions || 0,
        experience: tutorDetails.yearsOfExperience
          ? `${tutorDetails.yearsOfExperience} years`
          : 'N/A',
        description: tutorDetails.teachingPhilosophy || 'No description available',
        reviews,
        profilePhotoUrl: tutorDetails.profilePic,
        subjects: tutorDetails.subjects,
        gradeLevels: tutorDetails.gradeLevels,
      }
    : tutorData;

  if (showBooking) {
    return (
      <BookSession
        tutorData={mergedTutorData}
        bookingData={showBooking}
        onClose={handleCloseBooking}
      />
    );
  }

  const displayFirst = tutorFirstName(mergedTutorData.name);
  const backToSearch = () => {
    navigate(returnTo);
  };

  const introSrc = tutorDetails?.introVideo;
  const showIntro = Boolean(introSrc && String(introSrc).trim());

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <header className="relative bg-white">
        <div
          className="relative w-full bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white"
          style={{ height: '180px' }}
        >
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
            <button
              type="button"
              onClick={backToSearch}
              className="flex items-center text-white text-base font-medium cursor-pointer hover:text-brand-gold transition-colors bg-transparent border-0 p-0"
            >
              <ArrowLeftIcon className="mr-2" />
              Back to Search
            </button>
          </div>
        </div>

        <div
          className="absolute left-0 right-0 bg-gray-50"
          style={{
            top: '140px',
            height: '120px',
            borderTopLeftRadius: '50% 100px',
            borderTopRightRadius: '50% 100px',
          }}
        />

        <div
          className="relative z-10 flex justify-center"
          style={{ marginTop: '-80px', paddingBottom: '20px' }}
        >
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <div className="w-36 h-36 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={
                  resolveApiAssetUrl(mergedTutorData.profilePhotoUrl) ||
                  'https://placehold.co/144x144/E0E0E0/333333?text=Tutor'
                }
                alt={displayFirst}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 text-center pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{displayFirst}</h1>

          <div className="flex items-center justify-center text-gray-600 mb-2">
            <ClockIcon className="mr-2 w-5 h-5 text-gray-500" />
            <span className="text-lg text-gray-600">
              {mergedTutorData.experience} experience
            </span>
          </div>

          <p className="text-base text-gray-700 mb-4">
            {formatAverageResponseLabel(tutorDetails?.averageResponseHours)}
          </p>

          <div className="mt-2">
            <div className="text-4xl sm:text-5xl font-extrabold text-gray-900">
              {rateDisplay.line}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                {bioPreview(mergedTutorData.description, 35, 50)}
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Subject(s)</h2>
              <div className="flex flex-wrap gap-2">
                {filteredPills.map((p, idx) => (
                  <span
                    key={`${p.fullName}-${idx}`}
                    className="inline-flex flex-wrap items-baseline gap-x-1 rounded-full border border-brand-gold bg-blue-50 px-3 py-1.5 text-xs sm:text-sm text-brand-dark-blue"
                  >
                    <span className="font-bold">{p.category}</span>
                    <span>– {p.subjectLine}</span>
                    {p.gradeLevelsDisplay ? (
                      <span className="text-gray-700 font-normal">
                        {' '}
                        {p.gradeLevelsDisplay}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h2>
              {loadingReviews ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue" />
                </div>
              ) : mergedTutorData.reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {mergedTutorData.reviews.map((review) => {
                    const studentName = review.student
                      ? `${review.student.firstName} ${review.student.lastName}`
                      : review.name || 'Anonymous';
                    const reviewDate = review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : review.date || '';
                    return (
                      <div
                        key={review.id}
                        className="border-b border-gray-200 last:border-0 pb-6 last:pb-0"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <img
                                src={`https://placehold.co/40x40/E0E0E0/333333?text=${(studentName.split(' ')[0] || 'A')[0]}`}
                                alt=""
                                className="rounded-full"
                              />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{studentName}</h4>
                              <p className="text-xs text-gray-500">{reviewDate}</p>
                            </div>
                          </div>
                          <div className="flex text-amber-500">
                            {[...Array(review.rating || 5)].map((_, i) => (
                              <StarIcon key={i} className="w-4 h-4" />
                            ))}
                            {[...Array(5 - (review.rating || 5))].map((_, i) => (
                              <svg
                                key={`e-${i}`}
                                className="w-4 h-4 text-gray-300"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {showIntro && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Introduction Video</h3>
                <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <video
                    key="inline"
                    controls
                    playsInline
                    preload="none"
                    poster={
                      resolveApiAssetUrl(mergedTutorData.profilePhotoUrl) ||
                      undefined
                    }
                    className="w-full h-full object-contain"
                  >
                    <source src={introSrc} type="video/mp4" />
                  </video>
                </div>
                <button
                  type="button"
                  onClick={() => setVideoModalOpen(true)}
                  className="mt-3 w-full text-sm font-medium text-brand-medium-blue hover:text-brand-dark-blue"
                >
                  Enlarge video
                </button>
              </div>
            )}

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="space-y-3">
                <MessageRequestButton
                  tutorId={parseInt(id, 10)}
                  tutorName={mergedTutorData.name}
                />
                <button
                  type="button"
                  onClick={handleBookSession}
                  className="w-full flex items-center justify-center gap-2 bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-transparent hover:border-brand-gold"
                >
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Book Session
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {videoModalOpen && showIntro && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          role="presentation"
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl bg-black rounded-lg overflow-hidden shadow-2xl"
            role="presentation"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setVideoModalOpen(false)}
              className="absolute top-3 right-3 z-10 rounded-full bg-white/90 p-2 text-gray-800 hover:bg-white"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-video w-full">
              <video
                key="modal"
                controls
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
              >
                <source src={introSrc} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorProfile;
