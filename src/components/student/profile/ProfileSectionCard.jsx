const SavedBadge = () => (
  <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1">
    <span aria-hidden>✓</span> Saved
  </span>
);

const ProfileSectionCard = ({
  id,
  title,
  subtitle,
  children,
  saved,
  editing,
  onEdit,
  onCancel,
  onSave,
  onNext,
  showActions = true,
  showNext = false,
}) => (
  <section
    id={id}
    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm scroll-mt-24"
  >
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
      <div>
        <h2 className="text-lg font-bold text-brand-dark-blue">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </div>
      {saved && !editing && <SavedBadge />}
    </div>
    {children}
    {showActions && (
      <div className="flex justify-end items-center gap-3 mt-6 pt-4 border-t border-gray-100">
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
        {editing ? (
          <button
            type="button"
            onClick={onSave}
            className="px-6 py-2 bg-brand-medium-blue text-white rounded-lg text-sm font-medium hover:bg-brand-dark-blue shadow-sm"
          >
            Save
          </button>
        ) : (
          <>
            {showNext && onNext && (
              <button
                type="button"
                onClick={onNext}
                className="px-6 py-2 bg-brand-medium-blue text-white rounded-lg text-sm font-medium hover:bg-brand-dark-blue shadow-sm"
              >
                Next
              </button>
            )}
            <button
              type="button"
              onClick={onEdit}
              className="px-6 py-2 border border-brand-medium-blue text-brand-medium-blue rounded-lg text-sm font-medium hover:bg-brand-light-blue/20"
            >
              Edit
            </button>
          </>
        )}
      </div>
    )}
  </section>
);

export default ProfileSectionCard;
