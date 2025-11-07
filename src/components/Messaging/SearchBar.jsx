import { useState, useEffect, useRef } from 'react';
import { debounce } from '../../utils/messagingHelpers';

const SearchBar = ({ value, onChange, placeholder = 'Search conversations...' }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const debouncedOnChange = useRef(null);

  // Create debounced onChange handler
  useEffect(() => {
    debouncedOnChange.current = debounce((searchValue) => {
      onChange(searchValue);
    }, 500);
  }, [onChange]);

  // Handle input change
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Call debounced onChange
    if (debouncedOnChange.current) {
      debouncedOnChange.current(newValue);
    }
  };

  // Handle clear button
  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  // Sync with external value changes
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  return (
    <div className="relative">
      {/* Search Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Search Input */}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        aria-label="Search conversations"
      />

      {/* Clear Button */}
      {localValue && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
