import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Icons
const SearchIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const ChevronDownIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const FilterIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  </svg>
);

const ClockIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DollarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const FindTutorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('All Subjects');
  const [level, setLevel] = useState('All Levels');
  const [priceRange, setPriceRange] = useState('All Prices');
  const [sortBy, setSortBy] = useState('Most Relevant');

  const tutors = [
    {
      id: 1,
      name: 'Sarah Mitchell',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['Mathematics', 'Physics'],
      description: 'Experienced mathematics and physics tutor with over 8 years of teaching experience. I specialize in making complex concepts simple and engaging.',
      rate: 45,
      availability: '3 days/week',
    },
    {
      id: 2,
      name: 'James Chen',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['Computer Science', 'Programming'],
      description: 'Software engineer and passionate educator. I teach Python, JavaScript, and web development to students of all levels.',
      rate: 70,
      availability: '3 days/week',
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['English', 'Literature'],
      description: 'English literature graduate with a passion for helping students improve their writing and reading comprehension skills.',
      rate: 80,
      availability: '3 days/week',
    },
    {
      id: 4,
      name: 'Michael Thompson',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['Chemistry', 'Biology'],
      description: 'PhD in Chemistry with extensive experience in tutoring high school and college students. I make science fun and accessible.',
      rate: 50,
      availability: '3 days/week',
    },
    {
      id: 5,
      name: 'Aisha Patel',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['History', 'Social Studies'],
      description: 'History enthusiast dedicated to bringing the past to life for students. I focus on critical thinking and essay writing.',
      rate: 38,
      availability: '3 days/week',
    },
    {
      id: 6,
      name: 'David Lee',
      image: '/images/tutor-placeholder.jpg',
      subjects: ['Music', 'Piano'],
      description: 'Professional pianist and music teacher. I offer lessons for beginners to advanced students in piano and music theory.',
      rate: 60,
      availability: '3 days/week',
    },
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    console.log('Searching for tutors with query:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20 md:py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Find Your Perfect Tutor</h1>
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100">
            Search by subject, price, and availability to discover qualified tutors
          </p>
        </div>
        {/* Curved bottom edge */}
        <div className="absolute bottom-0 left-0 w-full h-24 bg-white transform translate-y-1/2 rounded-t-full"></div>
      </div>

      {/* Search and Filter Section */}
      <div className="relative z-20 -mt-12 md:-mt-16 lg:-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 border border-gray-200">
          {/* Main Search Input */}
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Subject Dropdown */}
            <div className="relative">
              <select
                className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option>All Subjects</option>
                <option>Mathematics</option>
                <option>Physics</option>
                <option>Computer Science</option>
                <option>English</option>
                <option>Chemistry</option>
                <option>History</option>
                <option>Music</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Level Dropdown */}
            <div className="relative">
              <select
                className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option>All Levels</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Price Range Dropdown */}
            <div className="relative">
              <select
                className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option>All Prices</option>
                <option>$0 - $25</option>
                <option>$25 - $50</option>
                <option>$50 - $75</option>
                <option>$75+</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Filter by Time Button */}
            <button className="flex items-center justify-center bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors">
              <FilterIcon className="mr-2" />
              Filter by Time
            </button>
          </div>
        </div>
      </div>

      {/* Tutor List Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header for tutor list */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-800">Showing {tutors.length} tutors</h2>
          <div className="relative">
            <select
              className="block appearance-none bg-white border border-gray-300 rounded-lg py-2 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option>Most Relevant</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Rating</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronDownIcon />
            </div>
          </div>
        </div>

        {/* Tutor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutors.map((tutor) => (
            <div key={tutor.id} className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-xs">Tutor Image</p>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{tutor.name}</h3>
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {tutor.subjects.map((subject, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{tutor.description}</p>
              <div className="flex items-center justify-center mb-2">
                <DollarIcon className="text-gray-500 mr-1" />
                <span className="text-2xl font-bold text-gray-900">${tutor.rate}</span>
                <span className="text-gray-600">/hour</span>
              </div>
              <div className="flex items-center justify-center text-gray-500 text-sm mb-6">
                <ClockIcon className="mr-1" />
                <span>Available {tutor.availability}</span>
              </div>
              <div className="flex gap-4 justify-center">
                <Link to={`/tutor/${tutor.id}`} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  View Profile
                </Link>
                <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                  Check Availability
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FindTutorsPage;

