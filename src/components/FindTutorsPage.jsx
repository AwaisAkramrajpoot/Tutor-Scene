import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';

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
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [sortBy, setSortBy] = useState('Most Relevant');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  // Fetch subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await apiRequest('/api/v1/subjects');
        const subjectsList = response.subjects || response.data || response || [];
        setAvailableSubjects(subjectsList);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    try {
      setLoading(true);

      // Build query params
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchString', searchQuery);
      if (subject) params.append('subject', subject);
      if (level) params.append('level', level);
      if (priceRange) params.append('priceRange', priceRange);
      if (selectedDate) params.append('availability', selectedDate);

      const queryString = params.toString();
      const endpoint = queryString ? `/api/v1/onboarding/tutor?${queryString}` : '/api/v1/onboarding/tutor';

      const response = await apiRequest(endpoint);
      const tutorsList = response.tutors || response.data || response || [];
      setTutors(tutorsList);
    } catch (error) {
      console.error('Error fetching tutors:', error);
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTutors();
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
            <div className="relative flex gap-2">
              <div className="relative flex-1">
  {/* The icon needs to be absolutely positioned inside the relative parent */}
  <svg 
    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor"
  >
    {/* Assuming SearchIcon is an SVG, replacing with a generic search path for demonstration */}
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.44 4.19l3.58 3.58a1 1 0 01-1.42 1.42l-3.58-3.58A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
  
  <input
    type="text"
    placeholder="Search for tutors..."
    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Search
              </button>
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
                <option value="">All Subjects</option>
                {availableSubjects.map((subj) => (
                  <option key={subj.id} value={subj.name}>
                    {subj.name}
                  </option>
                ))}
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
                <option value="">All Levels</option>
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
                <option value="">All Prices</option>
                <option value="lowToHigh">Low to High</option>
                <option value="highToLow">High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <ChevronDownIcon />
              </div>
            </div>

            {/* Filter by Time Button */}
            <button
              onClick={() => setShowDatePicker(true)}
              className="flex items-center justify-center bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <FilterIcon className="mr-2" />
              {selectedDate ? `Date: ${selectedDate}` : 'Filter by Time'}
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Select Date</h3>
              <button
                onClick={() => setShowDatePicker(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a date (today or future dates only)
              </label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDatePicker(false);
                  fetchTutors();
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Apply Filter
              </button>
              <button
                onClick={() => {
                  setSelectedDate('');
                  setShowDatePicker(false);
                  fetchTutors();
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor List Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header for tutor list */}


        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading tutors...</p>
            </div>
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No tutors found</h3>
            <p className="text-gray-600">Try adjusting your search filters</p>
          </div>
        ) : (
          /* Tutor Cards Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutors.map((tutor) => (
              <div key={tutor.id} className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow">
                {/* Profile Picture */}
                {tutor.profilePic ? (
                  <img
                    src={tutor.profilePic}
                    alt={tutor.fullName}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-2">{tutor.fullName}</h3>

                {/* Subjects */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {(Array.isArray(tutor.subjects)
                    ? tutor.subjects
                    : tutor.subjects?.split(',').map(s => s.trim()) || []
                  ).map((subject, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>

                {/* Teaching Philosophy */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {tutor.teachingPhilosophy || 'Passionate educator dedicated to student success'}
                </p>

                {/* Grade Levels */}
                {tutor.gradeLevels && (
                  <p className="text-gray-500 text-xs mb-3">
                    Grade Levels: {tutor.gradeLevels}
                  </p>
                )}

                {/* Years of Experience */}
                {tutor.yearsOfExperience && (
                  <p className="text-gray-500 text-xs mb-3">
                    {tutor.yearsOfExperience} years of experience
                  </p>
                )}

                {/* Fee */}
                <div className="flex items-center justify-center mb-6">
                  <DollarIcon className="text-gray-500 mr-1" />
                  <span className="text-2xl font-bold text-gray-900">${tutor.fee || '0'}</span>
                  <span className="text-gray-600">/hour</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-center">
                  <Link to={`/tutor/${tutor.id}`} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    View Profile
                  </Link>
                  {/* <button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                    Check Availability
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindTutorsPage;

