import React from 'react';
import { useNavigate } from 'react-router-dom';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const FilterIcon = (props) => (
  <svg {...props} className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const StarIcon = (props) => (
  <svg {...props} className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const MySessions = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = React.useState('upcoming');

  const sessions = [
    {
      id: 1,
      tutor: 'Sarah Mitchell',
      subject: 'Mathematics',
      date: 'Oct 20, 2023',
      time: '02:00 PM - 03:00 PM',
      duration: '1 hour',
      status: 'Completed',
      rating: 5,
      review: 'Great session! Sarah explained everything clearly.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=SM'
    },
    {
      id: 2,
      tutor: 'James Chen',
      subject: 'Computer Science',
      date: 'Oct 18, 2023',
      time: '04:00 PM - 05:30 PM',
      duration: '1.5 hours',
      status: 'Completed',
      rating: 4,
      review: 'Helpful session, but could be more interactive.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=JC'
    },
    {
      id: 3,
      tutor: 'Maria Garcia',
      subject: 'Physics',
      date: 'Oct 25, 2023',
      time: '11:00 AM - 12:00 PM',
      duration: '1 hour',
      status: 'Upcoming',
      rating: null,
      review: '',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=MG'
    },
    {
      id: 4,
      tutor: 'David Kim',
      subject: 'Chemistry',
      date: 'Oct 10, 2023',
      time: '03:00 PM - 04:30 PM',
      duration: '1.5 hours',
      status: 'Cancelled',
      rating: null,
      review: 'Session was cancelled by the tutor.',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=DK'
    },
    {
      id: 5,
      tutor: 'Alex Johnson',
      subject: 'Mathematics',
      date: 'Oct 28, 2023',
      time: '10:00 AM - 11:30 AM',
      duration: '1.5 hours',
      status: 'Upcoming',
      rating: null,
      review: '',
      avatar: 'https://placehold.co/48x48/E0E0E0/333333?text=AJ'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Sessions</h1>
          <p className="text-gray-600">View and manage your tutoring sessions</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search sessions..."
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
              <FilterIcon />
              <span>Filter</span>
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              New Session
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`${activeTab === 'upcoming' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Upcoming
              <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sessions.filter(s => s.status === 'Upcoming').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`${activeTab === 'completed' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Completed
              <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sessions.filter(s => s.status === 'Completed').length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`${activeTab === 'cancelled' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Cancelled
              <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {sessions.filter(s => s.status === 'Cancelled').length}
              </span>
            </button>
          </nav>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {sessions
            .filter(session => {
              if (activeTab === 'upcoming') return session.status === 'Upcoming';
              if (activeTab === 'completed') return session.status === 'Completed';
              if (activeTab === 'cancelled') return session.status === 'Cancelled';
              return true;
            })
            .map((session) => (
            <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex items-center space-x-4 mb-4 md:mb-0">
                    <img 
                      src={session.avatar} 
                      alt={session.tutor} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{session.tutor}</h3>
                      <p className="text-gray-600">{session.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium">{session.date}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium">{session.time}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-medium">{session.duration}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Status</p>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {session.status}
                      </span>
                    </div>
                  </div>
                </div>

                {session.review && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className={`${i < session.rating ? 'text-yellow-500' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{session.rating}.0</span>
                    </div>
                    <p className="text-gray-700">{session.review}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-between">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            disabled
          >
            Previous
          </button>
          <div className="flex items-center space-x-1">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-600 text-white">
              1
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100">
              2
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100">
              3
            </button>
            <span className="px-2">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100">
              10
            </button>
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default MySessions;
