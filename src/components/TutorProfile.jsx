import React, { useState } from 'react';
import BookSession from './BookSession';

// --- Icons (Using Lucide-like SVGs for visual fidelity) ---

// Star Icon for rating
const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
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

// Calendar Arrow Icons
const ChevronLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const ChevronRightIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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
  // State for showing/hiding the booking component
  const [showBooking, setShowBooking] = useState(false);
  
  // Mock state for selected items to match the image
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedDate, setSelectedDate] = useState('30');
  const [selectedHour, setSelectedHour] = useState('10.00 AM');

  const handleBookSession = () => {
    setShowBooking(true);
  };

  const handleCloseBooking = () => {
    setShowBooking(false);
  };

  const DayButton = ({ day, active, onClick }) => (
    <button
      onClick={() => onClick(day)}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? 'bg-amber-500 text-white border-amber-500 shadow-lg'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {day}
    </button>
  );

  const TimeButton = ({ time, active, onClick }) => (
    <button
      onClick={() => onClick(time)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {time}
    </button>
  );

  const DateCell = ({ date, active, onClick, disabled }) => (
    <button
      onClick={() => !disabled && onClick(date)}
      disabled={disabled}
      className={`w-8 h-8 text-sm rounded transition-colors font-medium ${
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : active
          ? 'bg-amber-500 text-white shadow-md'
          : 'text-gray-900 hover:bg-blue-50'
      }`}
    >
      {date}
    </button>
  );


  // --- Calendar Component Mock ---
  const Calendar = ({ selectedDate, setSelectedDate }) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // Mock days for June 2023: Starts on a Thursday (empty cells for Sun, Mon, Tue, Wed)
    const dates = [
      '', '', '', '', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 text-gray-700">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <h3 className="text-lg font-semibold">June 2023</h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {dates.map((date, index) => (
            <div key={index} className="flex justify-center items-center">
              {date ? (
                <DateCell
                  date={date.toString()}
                  active={selectedDate === date.toString()}
                  onClick={setSelectedDate}
                  disabled={date === 17 || date === 18} // Mock disabled weekend dates for realism
                />
              ) : (
                <div className="w-8 h-8"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // If booking component should be shown, render it instead
  if (showBooking) {
    return <BookSession tutorData={tutorData} onClose={handleCloseBooking} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* ------------------ Header Section (Blue Curve & Profile) - REVISED ------------------ */}
      <header className="relative bg-white pt-6"> {/* Adjusted pt to account for back button */}
        {/* Blue Background Section */}
        <div className="w-full bg-blue-600 text-white overflow-hidden" style={{ height: '180px' }}> {/* Fixed height for blue section */}
          {/* Back to Search Link (Absolute positioning relative to blue section) */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center text-white text-base font-medium">
              <ArrowLeftIcon className="mr-2" />
              Back to Search
            </div>
          </div>
          
          {/* The magic for the curve: a large, absolutely positioned white div with huge top-left/right radii */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-40 bg-gray-50" // bg-gray-50 matches page background
            style={{ 
              borderTopLeftRadius: '50% 100px', // Horizontal 50%, Vertical 100px
              borderTopRightRadius: '50% 100px', // This creates the concave curve
              transform: 'translateY(50%)' // Move it up to create the overlap
            }}
          ></div>
        </div>

        {/* Tutor Profile Picture (Overlapping) */}
        {/* Positioned relative to the header, centered horizontally, and adjusted vertically
            to sit exactly on the curve. */}
        <div className="relative z-10 flex justify-center mt-[-100px] mb-10"> {/* Negative margin to pull it up over the curve */}
          <div className="w-40 h-40 bg-white rounded-full flex items-center justify-center border-4 border-white shadow-xl">
            <div className="w-36 h-36 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                <img 
                    src="https://placehold.co/144x144/E0E0E0/333333?text=Tutor" 
                    alt="Sarah Mitchell" 
                    className="object-cover w-full h-full"
                />
            </div>
          </div>
        </div>

        {/* Tutor Information (Name, Rating, Experience) - Placed below the picture on the white background */}
        <div className="text-center pb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{tutorData.name}</h1>
          
          {/* Rating and Sessions Block */}
          <div className="flex items-center justify-center space-x-2 mb-4">
            {/* Rating Chip */}
            <div className="flex items-center bg-green-100 px-2 py-1 rounded-full">
              <span className="text-lg font-bold text-green-700 mr-1">{tutorData.rating}</span>
            </div>
            {/* Reviews and Sessions */}
            <span className="text-base text-gray-600">({tutorData.totalReviews} reviews)</span>
            <span className="text-gray-400">·</span>
            <span className="text-base text-gray-600">{tutorData.sessions} sessions</span>
          </div>

          {/* Experience */}
          <div className="flex items-center justify-center text-gray-600">
            <ClockIcon className="mr-2 w-5 h-5 text-gray-500" />
            <span className="text-lg text-gray-600">{tutorData.experience} experience</span>
          </div>
        </div>
      </header>
      {/* ------------------ Header Section - END REVISED ------------------ */}


      {/* ------------------ Main Content Layout (Two Columns) ------------------ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - About Me & Available Days */}
          <div className="space-y-6">
            
            {/* About Me Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 m-4">About Me</h2>
              <p className="text-gray-700 leading-relaxed text-sm">
                {tutorData.description}
              </p>
            </div>

            {/* Available Days Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Days</h2>
              <div className="flex flex-wrap gap-2">
                {tutorData.availableDays.map((day) => (
                  <DayButton
                    key={day}
                    day={day}
                    active={selectedDay === day}
                    onClick={setSelectedDay}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Section (Calendar & Time Slots) */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Select Date</h2>
              <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

              <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Select Hour</h2>
              <div className="grid grid-cols-3 gap-2">
                {tutorData.timeSlots.map((time) => (
                  <TimeButton
                    key={time}
                    time={time}
                    active={selectedHour === time}
                    onClick={setSelectedHour}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing and Book Button (Centered below the columns) */}
        <div className="text-center mt-12 mb-12">
          <div className="text-5xl font-extrabold text-gray-900 mb-6">
            ${tutorData.rate} <span className="text-xl font-normal text-gray-500">/hour</span>
          </div>
          <button
            onClick={handleBookSession}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-16 rounded-xl text-xl shadow-lg shadow-blue-300/50 transition-colors"
          >
            Book Session
          </button>
        </div>

        {/* ------------------ Student Reviews Section ------------------ */}
        <div className="mt-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Student Reviews</h2>
          <div className="grid grid-cols-1 gap-6">
            {tutorData.reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl p-6 shadow-md border-t-2 border-amber-500">
                
                {/* Reviewer Info and Rating */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    {/* Avatar Placeholder */}
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 border border-gray-200">
                      <img 
                        src={`https://placehold.co/40x40/E0E0E0/333333?text=${review.name.split(' ')[0][0]}`}
                        alt={`${review.name} avatar`}
                        className="rounded-full"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.name}</h4>
                      <p className="text-xs text-gray-500">{review.date}</p>
                    </div>
                  </div>
                  
                  {/* Rating Stars */}
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4" />
                    ))}
                  </div>
                </div>
                
                {/* Comment */}
                <p className="text-gray-700 pl-12 text-sm italic">{review.comment}</p>
              </div>
            ))}
          </div>
          
          {/* More See Link */}
          <div className="text-center mt-6">
            <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
              See more
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
