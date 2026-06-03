import { GENDER_OPTIONS } from '../../../data/learnerProfileConstants';

/** Parse stored gender into select + optional Other text */
export function parseGenderValue(stored) {
  if (!stored) return { select: '', other: '' };
  const known = GENDER_OPTIONS.map((o) => o.value);
  if (known.includes(stored)) return { select: stored, other: '' };
  return { select: 'Other', other: stored };
}

export function resolveGender(select, other) {
  if (select === 'Other') return other.trim() || 'Other';
  return select;
}

const GenderField = ({
  select,
  other,
  onSelect,
  onOther,
  disabled = false,
  idPrefix = 'gender',
  label = 'Gender',
}) => {
  const display = resolveGender(select, other) || '—';

  if (disabled) {
    return (
      <div>
        <label className="text-sm text-gray-600">{label}</label>
        <div className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 min-h-[42px] flex items-center">
          {display}
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm text-gray-600" htmlFor={`${idPrefix}-select`}>
        {label}
      </label>
      <select
        id={`${idPrefix}-select`}
        value={select}
        onChange={(e) => onSelect(e.target.value)}
        className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
      >
        <option value="">Select gender</option>
        {GENDER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {select === 'Other' && (
        <input
          id={`${idPrefix}-other`}
          type="text"
          placeholder="Please specify"
          value={other}
          onChange={(e) => onOther(e.target.value)}
          className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2"
        />
      )}
    </div>
  );
};

export default GenderField;
