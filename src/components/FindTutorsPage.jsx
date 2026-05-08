import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../utils/api';
import {
  tutorFirstName,
  bioPreview,
  buildSubjectPillsFromCatalog,
  filterSubjectPills,
  computeFeeRangeFromBaseFee,
  formatLearnerRateDisplay,
} from '../utils/tutorLearnerDisplay';

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

const DollarIcon = (props) => (
  <svg {...props} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const normalizeSubjectsResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subjects)) return response.subjects;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const FindTutorsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await apiRequest('/api/v1/subjects');
        setAvailableSubjects(normalizeSubjectsResponse(response));
      } catch {
        setAvailableSubjects([]);
      }
    };
    fetchSubjects();
  }, []);

  const subjectsByCategory = useMemo(() => {
    const map = new Map();
    availableSubjects.forEach((s) => {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(s);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, items]) => ({
        category,
        items: items.sort((x, y) => (x.name || '').localeCompare(y.name || '')),
      }));
  }, [availableSubjects]);

  const fetchTutors = async () => {
    if (!subject || !String(subject).trim()) {
      window.alert('Please select a subject from the catalog to search for tutors.');
      return;
    }
    try {
      setLoading(true);
      setSearchAttempted(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchString', searchQuery);
      params.append('subject', subject.trim());
      if (level) params.append('level', level);
      if (priceRange) params.append('priceRange', priceRange);
      if (selectedDate) params.append('availability', selectedDate);
      if (minFee !== '' && minFee != null) params.append('minFee', String(minFee));
      if (maxFee !== '' && maxFee != null) params.append('maxFee', String(maxFee));
      const qs = params.toString();
      const response = await apiRequest(`/api/v1/onboarding/tutor?${qs}`, { method: 'GET' });
      const tutorsList = response.tutors || response.data || response || [];
      setTutors(Array.isArray(tutorsList) ? tutorsList : []);
    } catch {
      setTutors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTutors();
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSubject('');
    setLevel('');
    setPriceRange('');
    setMinFee('');
    setMaxFee('');
    setSelectedDate('');
    setSelectedTime('');
    setRecurring(false);
    setTutors([]);
    setSearchAttempted(false);
  };

  const filterSummary =
    selectedDate || selectedTime || recurring
      ? 'Filter set'
      : 'Filter by Date/Time';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative bg-gradient-to-r from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue text-white py-20 md:py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">Find Your Perfect Tutor</h1>
          <p className="text-lg md:text-xl lg:text-2xl text-brand-light-blue">
            Search by subject, level, price, and availability. Subjects come from the Tutor Scene catalog and any subjects your admin adds.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 bg-white transform translate-y-1/2 rounded-t-full" />
      </div>

      <div className="relative z-20 -mt-12 md:-mt-16 lg:-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 lg:p-10 border border-gray-200">
          <form onSubmit={handleSearchSubmit} className="mb-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <div className="relative flex-1 min-w-0">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.44 4.19l3.58 3.58a1 1 0 01-1.42 1.42l-3.58-3.58A7 7 0 012 9z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search for tutors..."
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="submit"
                  className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 sm:px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="border border-gray-300 bg-white text-gray-800 px-6 sm:px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>

          <p className="text-xs text-gray-500 mb-4 -mt-2">
            Subject is required. The list combines the official Tutor Scene catalog with subjects created in Admin.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Subject <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <select
                  className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select subject</option>
                  {subjectsByCategory.map(({ category, items }) => (
                    <optgroup key={category} label={category}>
                      {items.map((subj) => (
                        <option
                          key={`${category}-${subj.name}-${subj.id ?? subj.name}`}
                          value={subj.name}
                        >
                          {subj.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
              <div className="relative">
                <select
                  className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  <option value="">All Levels</option>
                  <option value="Elementary">Elementary</option>
                  <option value="Middle School">Middle School</option>
                  <option value="High School">High School</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Price sort</label>
              <div className="relative">
                <select
                  className="block w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 pl-4 pr-10 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
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
            </div>

            <div className="flex flex-col justify-end">
              <span className="block text-xs font-medium text-gray-600 mb-1 opacity-0">Filter</span>
              <button
                type="button"
                onClick={() => setShowDateModal(true)}
                className="flex items-center justify-center bg-white border border-gray-300 rounded-lg py-3 px-4 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-medium-blue transition-colors"
              >
                <FilterIcon className="mr-2 shrink-0" />
                <span className="truncate">{filterSummary}</span>
              </button>
            </div>
          </div>

          {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Min price ($/hr)</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Min"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                value={minFee}
                onChange={(e) => setMinFee(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Max price ($/hr)</label>
              <input
                type="number"
                min={0}
                step={1}
                placeholder="Max"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium-blue"
                value={maxFee}
                onChange={(e) => setMaxFee(e.target.value)}
              />
            </div>
          </div> */}
        </div>
      </div>

      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Filter by Date/Time</h3>
              <button
                type="button"
                onClick={() => setShowDateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Availability search uses the date you pick. Optional time and recurring preferences help you plan; only the date is sent to the server today.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium-blue mb-4"
            />
            <label className="block text-sm font-medium text-gray-700 mb-2">Time (optional)</label>
            <input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-medium-blue mb-4"
            />
            <label className="flex items-center gap-2 text-sm text-gray-800 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="rounded border-gray-300"
              />
              Include recurring availability preferences
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDateModal(false);
                  if (subject.trim()) fetchTutors();
                }}
                className="flex-1 bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDate('');
                  setSelectedTime('');
                  setRecurring(false);
                  setShowDateModal(false);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-medium-blue mb-4" />
              <p className="text-gray-600">Loading tutors...</p>
            </div>
          </div>
        ) : tutors.length === 0 ? (
          <div className="text-center py-20">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {!searchAttempted ? 'Ready to search' : 'No tutors found'}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {!searchAttempted
                ? 'Choose a subject from the catalog, adjust optional filters, then click Search.'
                : 'Try broadening level, price range, or date filters, or pick another subject.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tutors.map((tutor) => {
              const allPills = buildSubjectPillsFromCatalog(
                tutor.subjects,
                availableSubjects,
              );
              const pills = filterSubjectPills(allPills, subject, level);
              const cardPills = pills.length ? pills : allPills;
              const { feeRangeMin, feeRangeMax } = computeFeeRangeFromBaseFee(
                tutor.fee,
              );
              const rateLine = formatLearnerRateDisplay(
                tutor.fee,
                feeRangeMin,
                feeRangeMax,
                subject.trim() ? subject : null,
              ).line;
              const profileQs = new URLSearchParams();
              if (subject.trim()) profileQs.set('subject', subject.trim());
              if (level.trim()) profileQs.set('level', level.trim());
              const profileTo = profileQs.toString()
                ? `/tutor/${tutor.id}?${profileQs.toString()}`
                : `/tutor/${tutor.id}`;
              return (
                <div
                  key={tutor.id}
                  className="bg-white rounded-xl shadow-md p-6 text-center border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  {tutor.profilePic ? (
                    <img
                      src={tutor.profilePic}
                      alt={tutorFirstName(tutor.fullName)}
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {tutorFirstName(tutor.fullName)}
                  </h3>

                  <p className="text-gray-600 text-sm mb-3 min-h-[2.5rem]">
                    {bioPreview(
                      tutor.teachingPhilosophy ||
                        'Passionate educator dedicated to student success',
                    )}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2 mb-3 text-left">
                    {cardPills.map((p, index) => (
                      <span
                        key={`${p.fullName}-${index}`}
                        className="inline-flex flex-wrap items-baseline gap-x-1 rounded-full border border-brand-gold bg-blue-50 px-2.5 py-1 text-[11px] sm:text-xs text-brand-dark-blue max-w-full"
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

                  {tutor.yearsOfExperience != null &&
                    tutor.yearsOfExperience !== '' && (
                      <p className="text-gray-500 text-xs mb-3">
                        {tutor.yearsOfExperience} years of experience
                      </p>
                    )}

                  <div className="flex items-center justify-center gap-1 mb-6 flex-wrap">
                    <DollarIcon className="text-gray-500 shrink-0" />
                    <span className="text-xl sm:text-2xl font-bold text-gray-900">
                      {rateLine}
                    </span>
                  </div>

                  <div className="flex gap-4 justify-center">
                    <Link
                      to={profileTo}
                      className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindTutorsPage;
