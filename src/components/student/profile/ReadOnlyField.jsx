const ReadOnlyField = ({ label, value, hint }) => (
  <div>
    <label className="text-sm text-gray-600">{label}</label>
    <div className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800 min-h-[42px] flex items-center">
      {value || '—'}
    </div>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
  </div>
);

export default ReadOnlyField;
