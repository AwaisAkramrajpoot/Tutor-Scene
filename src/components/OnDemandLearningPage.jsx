import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveApiAssetUrl } from '../utils/api';
import {
  fetchFeaturedContent,
  fetchFilterOptions,
  fetchContent,
  fetchCategories,
  saveContent,
  unsaveContent,
  addToCart,
  fetchCartCount,
} from '../services/onDemandLearningService';

const TABS = [
  { id: 'video', label: 'Videos', icon: 'play' },
  { id: 'pdf', label: 'PDFs', icon: 'doc' },
  { id: 'worksheet', label: 'Worksheets', icon: 'grid' },
  { id: 'quiz', label: 'Quizzes', icon: 'check' },
];

const CATEGORY_META = {
  video: {
    title: 'Video Lessons',
    subtitle: 'Visual/audio learning',
    browseLabel: 'Browse Video Lessons',
  },
  pdf: {
    title: 'Learning Guides',
    subtitle: 'Reading & reference material',
    browseLabel: 'Browse PDFs',
  },
  worksheet: {
    title: 'Practice Worksheets',
    subtitle: 'Structured practice',
    browseLabel: 'Browse Worksheets',
  },
  quiz: {
    title: 'Practice Questions',
    subtitle: 'Quick question drills',
    browseLabel: 'Browse Quizzes',
  },
};

const THUMB_GRADIENTS = [
  'from-amber-200 via-orange-300 to-amber-400',
  'from-slate-300 via-slate-400 to-slate-500',
  'from-sky-200 via-blue-300 to-indigo-300',
  'from-emerald-200 via-teal-300 to-cyan-300',
];

const FilterIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

const BookmarkIcon = ({ filled }) => (
  <svg
    className={`w-5 h-5 ${filled ? 'text-brand-gold fill-brand-gold' : 'text-gray-400'}`}
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

function ContentThumbnail({ item, index = 0 }) {
  const url = item.thumbnailUrl ? resolveApiAssetUrl(item.thumbnailUrl) : null;
  if (url) {
    return (
      <img src={url} alt="" className="w-full h-full object-cover" />
    );
  }
  return (
    <div
      className={`w-full h-full bg-gradient-to-br ${THUMB_GRADIENTS[index % THUMB_GRADIENTS.length]} flex items-center justify-center`}
    >
      <span className="text-white/90 text-4xl font-bold drop-shadow">
        {item.title?.charAt(0) || '?'}
      </span>
    </div>
  );
}

function FeaturedCard({ item, index, onSave, onUnlock }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
      <div className="relative h-40 sm:h-44">
        <ContentThumbnail item={item} index={index} />
        <button
          type="button"
          onClick={() => onSave(item)}
          className="absolute top-3 right-3 p-1.5 bg-white/90 rounded-full shadow hover:bg-white"
          aria-label={item.isSaved ? 'Remove from saved' : 'Save'}
        >
          <BookmarkIcon filled={item.isSaved} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-brand-dark-blue text-lg leading-tight">{item.title}</h3>
        <p className="text-sm text-gray-600 mt-1">By {item.tutorName}</p>
        <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
          <span className="font-semibold text-brand-dark-blue">
            ${Number(item.pricePerMinute).toFixed(0)}/min
          </span>
          <span>{item.durationMinutes} min</span>
        </div>
        <button
          type="button"
          onClick={() => onUnlock(item)}
          className="mt-4 w-full bg-brand-medium-blue hover:bg-brand-dark-blue text-white py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          Unlock Lesson
        </button>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, placeholder = 'All' }) {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <label className="flex items-center justify-between py-3 px-4 cursor-pointer">
        <span className="text-sm font-medium text-gray-800">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-sm text-brand-medium-blue bg-transparent border-0 focus:ring-0 cursor-pointer max-w-[55%] text-right"
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value ?? opt} value={opt.value ?? opt}>
              {opt.label ?? opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

const OnDemandLearningPage = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: '',
    duration: '',
    price: '',
    fileType: '',
    saved: false,
  });
  const [filterOpen, setFilterOpen] = useState(true);
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    gradeLevels: [],
    fileTypes: [],
    durations: [],
    prices: [],
  });
  const [featured, setFeatured] = useState([]);
  const [tabItems, setTabItems] = useState([]);
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  const filterParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      subject: filters.subject || undefined,
      gradeLevel: filters.gradeLevel || undefined,
      duration: filters.duration || undefined,
      price: filters.price || undefined,
      fileType: filters.fileType || undefined,
      saved: filters.saved ? 'true' : undefined,
      type: activeTab,
    }),
    [search, filters, activeTab],
  );

  const loadCartCount = useCallback(async () => {
    try {
      const res = await fetchCartCount();
      setCartCount(res?.count ?? 0);
    } catch {
      setCartCount(0);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [featuredRes, contentRes, catRes] = await Promise.all([
        fetchFeaturedContent(),
        fetchContent(filterParams),
        fetchCategories({
          search: filterParams.search,
          subject: filterParams.subject,
          gradeLevel: filterParams.gradeLevel,
          duration: filterParams.duration,
          price: filterParams.price,
          fileType: filterParams.fileType,
          saved: filterParams.saved,
        }),
      ]);
      setFeatured(Array.isArray(featuredRes) ? featuredRes : []);
      setTabItems(contentRes?.items ?? []);
      setCategories(catRes?.categories ?? {});
    } catch {
      setFeatured([]);
      setTabItems([]);
      setCategories({});
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  useEffect(() => {
    fetchFilterOptions()
      .then(setFilterOptions)
      .catch(() => {});
    loadCartCount();
  }, [loadCartCount]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const clearFilters = () => {
    setSearch('');
    setFilters({
      subject: '',
      gradeLevel: '',
      duration: '',
      price: '',
      fileType: '',
      saved: false,
    });
  };

  const handleSave = async (item) => {
    try {
      if (item.isSaved) {
        await unsaveContent(item.id);
      } else {
        await saveContent(item.id);
      }
      await loadData();
    } catch {
      /* ignore */
    }
  };

  const handleUnlock = async (item) => {
    try {
      await addToCart(item.id);
      await loadCartCount();
    } catch {
      /* ignore */
    }
  };

  const hasActiveFilters =
    search.trim() ||
    filters.subject ||
    filters.gradeLevel ||
    filters.duration ||
    filters.price ||
    filters.fileType ||
    filters.saved;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="relative bg-gradient-to-r from-brand-dark-blue via-brand-medium-blue to-brand-light-blue text-white pt-16 pb-28 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1200 200" preserveAspectRatio="none">
            <path
              d="M0,80 Q300,160 600,80 T1200,80 L1200,200 L0,200 Z"
              fill="currentColor"
              className="text-white"
            />
          </svg>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center sm:text-left flex-1">
              On-Demand Learning
            </h1>
            <Link
              to="/on-demand-learning/cart"
              className="shrink-0 self-center sm:self-start bg-brand-gold hover:bg-yellow-500 text-brand-dark-blue font-bold px-6 py-2.5 rounded-md shadow-lg transition-colors text-sm uppercase tracking-wide"
            >
              View Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadData();
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.44 4.19l3.58 3.58a1 1 0 01-1.42 1.42l-3.58-3.58A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                type="search"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-lg text-gray-900 border-0 shadow-lg focus:ring-2 focus:ring-brand-gold"
              />
            </div>
          </form>
          <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-3xl mx-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-dark-blue text-white shadow-md'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gray-50 transform translate-y-1/2 rounded-t-[3rem]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          <div className="flex-1 min-w-0">
            <section className="mb-10">
              <h2 className="text-xl font-bold text-brand-dark-blue mb-4">Featured Lessons</h2>
              {loading && featured.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Loading featured lessons…</p>
              ) : featured.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No featured lessons yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {featured.map((item, i) => (
                    <FeaturedCard
                      key={item.id}
                      item={item}
                      index={i}
                      onSave={handleSave}
                      onUnlock={handleUnlock}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="mb-8">
              <h2 className="text-lg font-bold text-brand-dark-blue mb-3 capitalize">
                {TABS.find((t) => t.id === activeTab)?.label} results
              </h2>
              {loading ? (
                <p className="text-gray-500 py-6 text-center">Loading…</p>
              ) : tabItems.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                  No {TABS.find((t) => t.id === activeTab)?.label?.toLowerCase()} found
                  {hasActiveFilters ? ' matching your filters.' : '.'}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tabItems.map((item, i) => (
                    <FeaturedCard
                      key={item.id}
                      item={item}
                      index={i}
                      onSave={handleSave}
                      onUnlock={handleUnlock}
                    />
                  ))}
                </div>
              )}
            </section>

            {Object.entries(CATEGORY_META).map(([type, meta]) => {
              const items = categories[type] || [];
              return (
                <section
                  key={type}
                  className="mb-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
                >
                  <h3 className="text-lg font-bold text-brand-dark-blue">{meta.title}</h3>
                  <p className="text-sm text-gray-500 mb-4">{meta.subtitle}</p>
                  {items.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 mb-4">
                      No {meta.title.toLowerCase()} found
                    </p>
                  ) : (
                    <ul className="space-y-2 mb-4 text-sm text-gray-700">
                      {items.slice(0, 3).map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span className="font-medium truncate">{item.title}</span>
                          <span className="text-gray-500 shrink-0">
                            {item.durationMinutes} min
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(type)}
                    className="w-full sm:w-auto bg-brand-medium-blue hover:bg-brand-dark-blue text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {meta.browseLabel}
                  </button>
                </section>
              );
            })}
          </div>

          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setFilterOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 font-semibold text-brand-dark-blue"
              >
                <span className="flex items-center gap-2">
                  <FilterIcon />
                  Filter
                </span>
                <span className="text-gray-400 text-xs">{filterOpen ? '▲' : '▼'}</span>
              </button>
              {filterOpen && (
                <div>
                  <FilterSelect
                    label="Subject"
                    value={filters.subject}
                    onChange={(v) => setFilters((f) => ({ ...f, subject: v }))}
                    options={filterOptions.subjects.map((s) => ({ value: s, label: s }))}
                  />
                  <FilterSelect
                    label="Grade Level"
                    value={filters.gradeLevel}
                    onChange={(v) => setFilters((f) => ({ ...f, gradeLevel: v }))}
                    options={filterOptions.gradeLevels.map((g) => ({
                      value: g,
                      label: g,
                    }))}
                  />
                  <FilterSelect
                    label="Duration"
                    value={filters.duration}
                    onChange={(v) => setFilters((f) => ({ ...f, duration: v }))}
                    options={filterOptions.durations}
                  />
                  <FilterSelect
                    label="Price"
                    value={filters.price}
                    onChange={(v) => setFilters((f) => ({ ...f, price: v }))}
                    options={filterOptions.prices}
                  />
                  <FilterSelect
                    label="File Type"
                    value={filters.fileType}
                    onChange={(v) => setFilters((f) => ({ ...f, fileType: v }))}
                    options={filterOptions.fileTypes.map((ft) => ({
                      value: ft,
                      label: ft.toUpperCase(),
                    }))}
                  />
                  <label className="flex items-center justify-between py-3 px-4 border-b border-gray-100 cursor-pointer">
                    <span className="text-sm font-medium text-gray-800">Saved</span>
                    <input
                      type="checkbox"
                      checked={filters.saved}
                      onChange={(e) =>
                        setFilters((f) => ({ ...f, saved: e.target.checked }))
                      }
                      className="rounded border-gray-300 text-brand-medium-blue focus:ring-brand-medium-blue"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full text-center py-3 text-sm font-medium text-brand-medium-blue hover:text-brand-dark-blue"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default OnDemandLearningPage;
