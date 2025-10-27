import React from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BookIcon = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CalendarIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BellIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5L19.5 4.5M15 17h5l-5 5v-5z" />
  </svg>
);

const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const StudentDashboard = () => {
  const navigate = useNavigate();

  const handleJoinSession = (tutorId) => {
    navigate(`/session/${tutorId}`);
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Welcome Back, Alex!</h1>
          <p className="text-xl text-blue-100">Ready to continue your learning journey?</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Find New Tutor Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <SearchIcon className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Find New Tutor</h3>
                    <p className="text-gray-600">Browse tutors</p>
                  </div>
                </div>
              </div>

              {/* My Sessions Card */}
              <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
                    <BookIcon className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">My Sessions</h3>
                    <p className="text-gray-600">View history</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CalendarIcon className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Sessions</h2>
              </div>
              
              <div className="space-y-4">
                {/* Session 1 - Sarah Mitchell */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://placehold.co/48x48/E0E0E0/333333?text=SM" 
                      alt="Sarah Mitchell" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">Sarah Mitchell</h3>
                      <div className="flex space-x-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Mathematics
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Physics
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Oct 20</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>02:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinSession('sarah-mitchell')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Join Session
                  </button>
                </div>

                {/* Session 2 - James Chen */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://placehold.co/48x48/E0E0E0/333333?text=JC" 
                      alt="James Chen" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">James Chen</h3>
                      <div className="flex space-x-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Computer Science
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Oct 22</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>04:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinSession('sarah-mitchell')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Join Session
                  </button>
                </div>

                {/* Session 3 - Maria Garcia */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://placehold.co/48x48/E0E0E0/333333?text=MG" 
                      alt="Maria Garcia" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">Maria Garcia</h3>
                      <div className="flex space-x-2 mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Mathematics
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Physics
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Oct 20</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>02:00 PM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleJoinSession('sarah-mitchell')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Join Session
                  </button>
                </div>
              </div>
            </div>

            {/* Recent Tutors Contacted */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Tutors Contacted</h2>
              
              <div className="space-y-4">
                {/* Tutor 1 - Emily Rodriguez */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://placehold.co/48x48/E0E0E0/333333?text=ER" 
                      alt="Emily Rodriguez" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">Emily Rodriguez</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <StarIcon className="text-green-500" />
                        <span className="text-sm text-green-600 font-medium">4.8</span>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Mathematics
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Physics
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Join Session
                  </button>
                </div>

                {/* Tutor 2 - James Chen */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img 
                      src="https://placehold.co/48x48/E0E0E0/333333?text=JC" 
                      alt="James Chen" 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">James Chen</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <StarIcon className="text-green-500" />
                        <span className="text-sm text-green-600 font-medium">4.8</span>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          Computer Science
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    Join Session
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Notifications */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-6">
                <BellIcon className="text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              </div>

              {/* Today Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">TODAY</h3>
                  <button className="text-sm text-gray-500 hover:text-gray-700">Mark all as read</button>
                </div>
                
                <div className="space-y-4">
                  {/* Notification 1 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">New Session Booked</h4>
                        <span className="text-xs text-gray-500">1h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Your session with Sarah Mitchell starts in 2 hours</p>
                    </div>
                  </div>

                  {/* Notification 2 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Session Completed</h4>
                        <span className="text-xs text-gray-500">2h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">You've successfully completed your recent Science lesson with Ahmed</p>
                    </div>
                  </div>

                  {/* Notification 3 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Session Rescheduled</h4>
                        <span className="text-xs text-gray-500">8h</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Fatima Noor has rescheduled her English session to Saturday, 7:00 PM.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Yesterday Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 uppercase">YESTERDAY</h3>
                  <button className="text-sm text-gray-500 hover:text-gray-700">Mark all as read</button>
                </div>
                
                <div className="space-y-4">
                  {/* Notification 1 */}
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 text-sm">Upcoming Session Reminder</h4>
                        <span className="text-xs text-gray-500">1d</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">You have a Physics session with Ahsan Malik scheduled for tomorrow at 6:30 PM.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
