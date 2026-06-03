import { useEffect, useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest, resolveApiAssetUrl } from '../../utils/api';
import { useSystemMessage } from '../../hooks/useSystemMessage';
import {
  tutorFirstName,
  bioPreview,
  buildSubjectPillsFromCatalog,
  filterSubjectPills,
  computeFeeRangeFromBaseFee,
  formatLearnerRateDisplay,
} from '../../utils/tutorLearnerDisplay';
import TutorProfileAvatar from '../TutorProfileAvatar';

const CheckIcon = () => (
  <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const PencilIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const normalizeSubjectsResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.subjects)) return response.subjects;
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const BookSessionMatchFlow = ({
  refreshKey,
  onEditAssessment,
  onAfterRemove,
}) => {
  const { showMessage } = useSystemMessage();
  const [learners, setLearners] = useState([]);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [level, setLevel] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [minFee, setMinFee] = useState('');
  const [maxFee, setMaxFee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [learnerSelectionError, setLearnerSelectionError] = useState('');
  const prevLearnersCountRef = useRef(0);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      try {
        const res = await apiRequest('/api/v1/learner-assessment/completed', {
          method: 'GET',
        });
        if (cancelled) return;
        setLearners(res.learners || []);
      } catch {
        if (!cancelled) setLearners([]);
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    if (
      selectedLabel &&
      learners.length > 0 &&
      !learners.some((l) => l.learnerLabel === selectedLabel)
    ) {
      setSelectedLabel('');
    }
  }, [learners, selectedLabel]);

  useEffect(() => {
    const wasEmpty = prevLearnersCountRef.current === 0;
    prevLearnersCountRef.current = learners.length;
    if (wasEmpty && learners.length === 1) {
      setSelectedLabel(learners[0].learnerLabel);
    }
  }, [learners]);

  useEffect(() => {
    if (selectedLabel) setLearnerSelectionError('');
  }, [selectedLabel]);

  useEffect(() => {
    const run = async () => {
      try {
        const response = await apiRequest('/api/v1/subjects');
        setAvailableSubjects(normalizeSubjectsResponse(response));
      } catch {
        setAvailableSubjects([]);
      }
    };
    run();
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

  const toggleLearnerSelection = (learnerLabel) => {
    setSelectedLabel((prev) => (prev === learnerLabel ? '' : learnerLabel));
    setLearnerSelectionError('');
  };

  const fetchTutors = async () => {
    if (!selectedLabel) {
      setLearnerSelectionError(
        'Select a learner in My Learners using the Select option before searching for matches.',
      );
      return;
    }
    setLearnerSelectionError('');
    if (!subject || !String(subject).trim()) {
      showMessage({ message: 'Please choose a subject to view tutors.', type: 'warning' });
      return;
    }
    try {
      setLoadingTutors(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('searchString', searchQuery);
      params.append('subject', subject);
      if (level) params.append('level', level);
      params.append('priceRange', priceRange || 'lowToHigh');
      if (selectedDate) params.append('availability', selectedDate);
      if (minFee !== '' && minFee != null) params.append('minFee', String(minFee));
      if (maxFee !== '' && maxFee != null) params.append('maxFee', String(maxFee));
      const qs = params.toString();
      const response = await apiRequest(
        `/api/v1/onboarding/tutor?${qs}`,
        { method: 'GET' }
      );
      const list = response.tutors || response.data || response || [];
      setTutors(Array.isArray(list) ? list.slice(0, 3) : []);
    } catch {
      setTutors([]);
    } finally {
      setLoadingTutors(false);
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
  };

  const handleRemove = async (learnerLabel) => {
    if (!window.confirm('Remove this learner assessment?')) return;
    try {
      await apiRequest(
        `/api/v1/learner-assessment?learnerLabel=${encodeURIComponent(learnerLabel)}`,
        { method: 'DELETE' }
      );
      if (selectedLabel === learnerLabel) setSelectedLabel('');
      onAfterRemove();
    } catch {
      showMessage({ message: 'Could not remove assessment.', type: 'error' });
    }
  };

  const displayName = (row) =>
    row.learnerFirstName || row.learnerLabel || 'Learner';

  const selectedLearner = learners.find((l) => l.learnerLabel === selectedLabel);

  if (loadingList && learners.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-medium-blue border-t-transparent" />
        </div>
      </div>
    );
  }

  if (learners.length === 0) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md sm:p-6">
        <h3 className="text-lg font-bold text-brand-dark-blue">My Learners</h3>
        <p className="mt-1 text-sm font-medium text-brand-medium-blue">
          Choose who you are matching tutors for using the Select column below.
        </p>
        {selectedLearner ? (
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-brand-gold bg-amber-50 px-3 py-2 text-sm text-brand-dark-blue">
            <span className="font-medium">Selected for matching:</span>
            <span className="font-semibold">{displayName(selectedLearner)}</span>
          </p>
        ) : (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            No learner selected yet. Use the Select column to choose one before searching.
          </p>
        )}
        {learnerSelectionError ? (
          <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {learnerSelectionError}
          </p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-gray-600">
                <th className="w-24 py-2 pr-2 text-center font-medium">Select</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Learner First Name</th>
                <th className="py-2 pr-4 font-medium">Grade Level</th>
                <th className="py-2 pr-4 font-medium">Gender</th>
                <th className="py-2 pr-4 font-medium">Relationship to Learner</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.map((row) => {
                const sel = selectedLabel === row.learnerLabel;
                return (
                  <tr
                    key={row.learnerLabel}
                    className={`transition-colors ${sel ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className={`py-3 pr-2 text-center ${sel ? 'rounded-l-md' : ''}`}>
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2">
                        <input
                          type="radio"
                          name="bookSessionSelectedLearner"
                          checked={sel}
                          onClick={() => toggleLearnerSelection(row.learnerLabel)}
                          readOnly
                          className="h-4 w-4 cursor-pointer border-gray-300 text-brand-medium-blue focus:ring-brand-medium-blue"
                          aria-label={`${sel ? 'Deselect' : 'Select'} ${displayName(row)} for matching`}
                        />
                        <span className="sr-only">Select {displayName(row)}</span>
                      </label>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-flex items-center text-green-700"
                        aria-label="Complete"
                        title="Complete"
                      >
                        <CheckIcon />
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-medium text-gray-900">
                      <span className="inline-flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                          {(displayName(row)[0] || '?').toUpperCase()}
                        </span>
                        {displayName(row)}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {row.gradeLevel || '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {row.gender || '—'}
                    </td>
                    <td className="py-3 pr-4 text-gray-700">
                      {row.relationshipToLearner || '—'}
                    </td>
                    <td className={`py-3 ${sel ? 'rounded-r-md' : ''}`}>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAssessment(row.learnerLabel);
                          }}
                          className="inline-flex items-center justify-center rounded-md border border-brand-medium-blue bg-white p-2 text-brand-medium-blue hover:bg-brand-medium-blue hover:text-white"
                          title="Edit assessment"
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(row.learnerLabel);
                          }}
                          className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-md sm:p-6">
        <h3 className="text-lg font-bold text-brand-dark-blue">Get Matched</h3>
        <p className="mt-1 text-sm font-medium text-brand-medium-blue">
          Subject is required. Other filters are optional. Up to 3 tutor matches are shown.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Matches use your search and filters together with{' '}
          {selectedLearner ? (
            <span className="font-semibold text-brand-dark-blue">{displayName(selectedLearner)}</span>
          ) : (
            'the learner you select above'
          )}
          .
        </p>

        <form onSubmit={handleSearchSubmit} className="mt-4">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
            <div className="relative min-w-0 flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search for tutors..."
                className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="submit"
                className="rounded-lg bg-brand-medium-blue px-6 py-3 text-sm font-semibold text-white hover:bg-brand-dark-blue"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Subject <span className="text-red-600">*</span>
            </label>
            <div className="relative">
              <select
                className="block w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Level
            </label>
            <div className="relative">
              <select
                className="block w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="Elementary">Elementary</option>
                <option value="Middle School">Middle School</option>
                <option value="High School">High School</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Price sort
            </label>
            <div className="relative">
              <select
                className="block w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-3 pr-10 text-sm text-gray-900 focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
              >
                <option value="">All Prices</option>
                <option value="lowToHigh">Low to High</option>
                <option value="highToLow">High to Low</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowDateModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white py-2.5 px-3 text-sm text-gray-800 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="truncate">
                {selectedDate || selectedTime || recurring
                  ? 'Date/Time filter set'
                  : 'Filter by Date/Time'}
              </span>
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Min price ($/hr)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Optional min"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
              value={minFee}
              onChange={(e) => setMinFee(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Max price ($/hr)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              placeholder="Optional max"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand-medium-blue focus:outline-none focus:ring-2 focus:ring-brand-medium-blue/30"
              value={maxFee}
              onChange={(e) => setMaxFee(e.target.value)}
            />
          </div>
        </div>

        {showDateModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">
                  Filter by Date/Time
                </h4>
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mb-3 text-xs text-gray-500">
                Choose a date to narrow by tutor availability. Optional time and recurring preferences describe how you want to meet; the date is sent to the server when you apply.
              </p>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                min={today}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Time (optional)
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2"
              />
              <label className="mb-4 flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="checkbox"
                  checked={recurring}
                  onChange={(e) => setRecurring(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Include recurring availability preferences
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDateModal(false);
                    if (!subject.trim()) {
                      showMessage({ message: 'Please choose a subject before applying date filters.', type: 'warning' });
                      return;
                    }
                    fetchTutors();
                  }}
                  className="flex-1 rounded-lg bg-brand-medium-blue py-2 text-sm font-medium text-white hover:bg-brand-dark-blue"
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
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm text-gray-800 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          {loadingTutors ? (
            <div className="flex justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-medium-blue border-t-transparent" />
            </div>
          ) : tutors.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              Select a subject (required), optionally set other filters, then click Search to see up to 3 tutor matches.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {tutors.map((tutor) => {
                const allPills = buildSubjectPillsFromCatalog(
                  tutor.subjects,
                  availableSubjects,
                );
                const pills = filterSubjectPills(allPills, subject, level);
                const hasSubjectOrLevelFilter = Boolean(
                  subject.trim() || level.trim(),
                );
                const cardPills = hasSubjectOrLevelFilter ? pills : allPills;
                const { feeRangeMin, feeRangeMax } = computeFeeRangeFromBaseFee(
                  tutor.fee,
                );
                const rateLine = formatLearnerRateDisplay(
                  tutor.fee,
                  feeRangeMin,
                  feeRangeMax,
                  // subject.trim() ? subject : null,
                  // level.trim() ? level : null,
                ).line;
                return (
                <div
                  key={tutor.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm"
                >
                  <div className="flex gap-4 items-start">
                    <TutorProfileAvatar
                      profilePic={tutor.profilePic}
                      name={tutorFirstName(tutor.fullName)}
                    />
                    <div className="min-w-0 flex-1 pt-1">
                      <h4 className="text-lg font-bold text-gray-900">
                        {tutorFirstName(tutor.fullName)}
                      </h4>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">
                    {bioPreview(
                      tutor.teachingPhilosophy ||
                        'Passionate educator dedicated to student success',
                      35,
                      50,
                    )}
                  </p>
                  <p className="mt-3 text-sm font-medium text-gray-900">Subject(s)</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {cardPills.map((p, index) => (
                      <span
                        key={`${p.fullName}-${index}`}
                        className="inline-flex max-w-full flex-wrap items-baseline gap-x-1 rounded-md border border-brand-gold bg-blue-50 px-2.5 py-1 text-[11px] text-brand-dark-blue sm:text-xs"
                      >
                        <span className="font-bold">{p.category}</span>
                        <span>– {p.subjectLine}</span>
                        {p.gradeLevelsDisplay ? (
                          <span className="font-normal text-gray-700">
                            {' '}
                            {p.gradeLevelsDisplay}
                          </span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                  {tutor.yearsOfExperience != null && (
                    <p className="mt-2 text-xs text-gray-500">
                      {tutor.yearsOfExperience} years of experience
                    </p>
                  )}
                  <p className="mt-3 text-xl font-bold text-gray-900">{rateLine}</p>
                  <div className="mt-4 flex justify-center">
                    <Link
                      to={(() => {
                        const u = new URLSearchParams();
                        if (subject.trim()) u.set('subject', subject.trim());
                        if (level.trim()) u.set('level', level.trim());
                        const q = u.toString();
                        return q ? `/tutor/${tutor.id}?${q}` : `/tutor/${tutor.id}`;
                      })()}
                      className="inline-block rounded-lg bg-brand-medium-blue px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark-blue"
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
    </div>
  );
};

export default BookSessionMatchFlow;
