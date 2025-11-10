import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import BookSession from './BookSession';
import MessageRequestButton from './Messaging/MessageRequestButton';
import { apiRequest } from '../utils/api';

// --- Icons (Using Lucide-like SVGs for visual fidelity) ---

// Star Icon for rating
const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// Clock Icon for experience
const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// Arrow Left Icon for "Back to Search"
const ArrowLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);



// --- Mock Data ---
const tutorData = {
  name: 'Sarah Mitchell',
  rate: 70,
  rating: 4.9,
  totalReviews: 127,
  sessions: 450,
  experience: '8 years',
  description: 'Experienced mathematics and physics tutor with over 8 years of teaching experience. I specialize in making complex concepts easy to understand. With 8 years of teaching experience, I\'ve helped hundreds of students achieve their academic goals. My teaching philosophy focuses on building strong fundamentals and developing critical thinking skills. I believe every student can succeed with the right guidance and support.',
  availableDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  timeSlots: [
    '09.00 AM', '09.30 AM', '10.00 AM', '10.30 AM', '11.00 AM', '11.30 AM',
    '3.00 PM', '3.30 PM', '4.00 PM', '4.30 PM', '5.00 PM', '5.30 PM'
  ],
  reviews: [
    { id: 1, name: 'Robert K.', date: '22 Jul', rating: 5, comment: 'Very patient and explains concepts clearly. Great at adapting to my son\'s learning style.' },
    { id: 2, name: 'Jennifer M.', date: '22 Jul', rating: 5, comment: 'Sarah is an amazing tutor! My daughter went from struggling in algebra to getting A\'s. Highly recommend!' },
    { id: 3, name: 'Emma W.', date: '22 Jul', rating: 5, comment: 'Sarah is an amazing tutor! She helped me improve my math grade from a C to an A in just 2 months. Highly recommend!' }
  ]
};

// --- Main Component ---
const App = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State for showing/hiding the booking component and storing booking data
  const [showBooking, setShowBooking] = useState(null);

  // State for API data
  const [tutorDetails, setTutorDetails] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);



  // Fetch tutor details and availability on component mount
  useEffect(() => {
    const fetchTutorData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // First, fetch tutor details
        const detailsResponse = await apiRequest(`/api/v1/onboarding/tutor/${id}`, 'GET');
        setTutorDetails(detailsResponse);

        // Then, fetch availability using the userId from tutor details
        if (detailsResponse?.userId) {
          const availabilityResponse = await apiRequest(`/api/v1/availability/tutor/${detailsResponse.userId}`, 'GET');
          setAvailability(availabilityResponse);
        }
      } catch (err) {
        console.error('Error fetching tutor data:', err);
        setError(err.response?.data?.message || 'Failed to load tutor information');
      } finally {
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [id]);

  // Fetch approved reviews for this tutor
  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;

      try {
        setLoadingReviews(true);
        const reviewsResponse = await apiRequest(`/api/v1/reviews/tutor/${id}?status=approved`, 'GET');
        
        // Handle various response shapes
        let reviewsList = [];
        if (Array.isArray(reviewsResponse)) {
          reviewsList = reviewsResponse;
        } else if (Array.isArray(reviewsResponse.reviews)) {
          reviewsList = reviewsResponse.reviews;
        } else if (Array.isArray(reviewsResponse.data)) {
          reviewsList = reviewsResponse.data;
        }
        
        setReviews(reviewsList);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        // Don't show error to user, just use empty reviews
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [id]);

  const handleBookSession = () => {
    // Prepare booking data to pass to BookSession component
    const bookingData = {
      tutorProfileId: tutorDetails?.id,
      userId: tutorDetails?.userId,
      subjects: tutorDetails?.subjects,
      gradeLevels: tutorDetails?.gradeLevels
    };

    setShowBooking(bookingData);
  };

  const handleCloseBooking = () => {
    setShowBooking(null);
  };



  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutor profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
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



  // Merge API data with mock data structure
  const mergedTutorData = tutorDetails ? {
    name: tutorDetails.fullName || 'Unknown Tutor',
    rate: parseFloat(tutorDetails.fee) || 70,
    rating: tutorDetails.rating || 4.9,
    totalReviews: reviews.length || tutorDetails.totalReviews || 0,
    sessions: tutorDetails.totalSessions || 0,
    experience: tutorDetails.yearsOfExperience ? `${tutorDetails.yearsOfExperience} years` : 'N/A',
    description: tutorDetails.teachingPhilosophy || 'No description available',
    reviews: reviews,
    profilePhotoUrl: tutorDetails.profilePic,
    subjects: tutorDetails.subjects,
    gradeLevels: tutorDetails.gradeLevels
  } : tutorData;

  // If booking component should be shown, render it instead
  if (showBooking) {
    return (
      <BookSession
        tutorData={mergedTutorData}
        bookingData={showBooking}
        onClose={handleCloseBooking}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* ------------------ Header Section (Blue Curve & Profile) ------------------ */}
      <header className="relative bg-white">
        {/* Brand Background Section */}
        <div className="relative w-full bg-gradient-to-r from-brand-dark-blue to-brand-medium-blue text-white" style={{ height: '180px' }}>
          {/* Back to Search Link */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8 z-20">
            <div 
              onClick={() => navigate('/find-tutors')}
              className="flex items-center text-white text-base font-medium cursor-pointer hover:text-brand-gold transition-colors"
            >
              <ArrowLeftIcon className="mr-2" />
              Back to Search
            </div>
          </div>
        </div>

        {/* Curved background overlay */}
        <div
          className="absolute left-0 right-0 bg-gray-50"
          style={{
            top: '140px',
            height: '120px',
            borderTopLeftRadius: '50% 100px',
            borderTopRightRadius: '50% 100px',
          }}
        ></div>

        {/* Tutor Profile Picture */}
        <div className="relative z-10 flex justify-center" style={{ marginTop: '-80px', paddingBottom: '20px' }}>
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <div className="w-36 h-36 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
              <img
                src={mergedTutorData.profilePhotoUrl || "https://placehold.co/144x144/E0E0E0/333333?text=Tutor"}
                alt={mergedTutorData.name}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Tutor Information */}
        <div className="relative z-10 text-center pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{mergedTutorData.name}</h1>

          {/* Rating and Sessions */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
              <span className="text-lg font-bold text-green-700 mr-1">{mergedTutorData.rating}</span>
            </div>
            <span className="text-base text-gray-600">({mergedTutorData.totalReviews} reviews)</span>
            <span className="text-gray-400">·</span>
            <span className="text-base text-gray-600">{mergedTutorData.sessions} sessions</span>
          </div>

          {/* Experience */}
          <div className="flex items-center justify-center text-gray-600">
            <ClockIcon className="mr-2 w-5 h-5 text-gray-500" />
            <span className="text-lg text-gray-600">{mergedTutorData.experience} experience</span>
          </div>

          {/* Hourly Rate */}
          <div className="mt-6">
            <div className="text-5xl font-extrabold text-gray-900">
              ${mergedTutorData.rate} <span className="text-xl font-normal text-gray-500">/hour</span>
            </div>
          </div>
        </div>
      </header>

      {/* ------------------ Main Content Layout ------------------ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* About Me Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed">
                {mergedTutorData.description}
              </p>
            </div>

            {/* Introduction Video */}
            {tutorDetails?.introVideo && (
              <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction Video</h2>
                <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
                  <video
                    controls
                    className="w-full h-full object-contain"
                    poster={mergedTutorData.profilePhotoUrl}
                  >
                    <source src={tutorDetails.introVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {/* Student Reviews Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Student Reviews</h2>
              {loadingReviews ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
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
                      ? new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : review.date || '';
                    
                    return (
                      <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <img
                                src={`https://placehold.co/40x40/E0E0E0/333333?text=${studentName.split(' ')[0][0]}`}
                                alt={`${studentName} avatar`}
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
                              <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

          {/* Right Column - Sidebar */}
          <div className="space-y-6">

            {/* Subjects & Grade Levels */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Subjects</h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {tutorDetails?.subjects?.split(',').map((subject, idx) => (
                  <span key={idx} className="px-3 py-1 bg-brand-light-blue text-brand-dark-blue rounded-full text-sm font-medium border border-brand-gold">
                    {subject.trim()}
                  </span>
                ))}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">Grade Levels</h3>
              <div className="flex flex-wrap gap-2">
                {tutorDetails?.gradeLevels?.split(',').map((level, idx) => (
                  <span key={idx} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {level.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="space-y-3">
                <MessageRequestButton
                  tutorId={parseInt(id, 10)}
                  tutorName={mergedTutorData.name}
                />
                <button
                  onClick={handleBookSession}
                  className="w-full bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all hover:shadow-xl border-2 border-transparent hover:border-brand-gold"
                >
                  Book Session
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Experience</span>
                  <span className="font-semibold text-gray-900">{mergedTutorData.experience}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Sessions</span>
                  <span className="font-semibold text-gray-900">{mergedTutorData.sessions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-semibold text-gray-900">{mergedTutorData.rating} ⭐</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Hourly Rate</span>
                  <span className="font-semibold text-gray-900">${mergedTutorData.rate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
