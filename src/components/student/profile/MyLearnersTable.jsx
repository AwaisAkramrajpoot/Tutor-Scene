import { GENDER_OPTIONS, RELATIONSHIP_OPTIONS } from '../../../data/learnerProfileConstants';
import { parseGenderValue, resolveGender } from './GenderField';

const PencilIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

const SaveIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

function parseRelationship(stored) {
  if (!stored) return { select: '', other: '' };
  if (RELATIONSHIP_OPTIONS.includes(stored)) return { select: stored, other: '' };
  return { select: 'Other (Specify)', other: stored };
}

const cellInput =
  'w-full min-w-[80px] border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-brand-medium-blue';

const MyLearnersTable = ({
  learners,
  loading,
  search,
  onSearchChange,
  sortKey,
  onSortChange,
  filterRel,
  onFilterRelChange,
  filterGender,
  onFilterGenderChange,
  gradeLevels,
  editingLabel,
  editDraft,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDraftChange,
  onRemove,
}) => {
  if (loading) {
    return <p className="text-gray-500 text-center py-10">Loading learners…</p>;
  }

  if (learners.length === 0) {
    return (
      <p className="text-gray-500 text-center py-10 border border-dashed border-gray-200 rounded-lg">
        No learners on this account yet. Use <strong>Add Learner(s)</strong> above or register{' '}
        <strong>Self</strong> to add your first row.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name or grade…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
          aria-label="Search learners"
        />
        <select
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          aria-label="Sort learners"
        >
          <option value="name">Sort by first name</option>
          <option value="grade">Sort by grade level</option>
          <option value="relationship">Sort by relationship</option>
        </select>
        <select
          value={filterRel}
          onChange={(e) => onFilterRelChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          aria-label="Filter by relationship"
        >
          <option value="">All relationships</option>
          {RELATIONSHIP_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
          <option value="Self">Self</option>
        </select>
        <select
          value={filterGender}
          onChange={(e) => onFilterGenderChange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          aria-label="Filter by gender"
        >
          <option value="">All genders</option>
          {GENDER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto max-h-[min(480px,60vh)] overflow-y-auto border border-gray-200 rounded-lg shadow-inner">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
            <tr className="text-left text-gray-600 font-medium">
              <th className="p-3 w-12" scope="col" />
              <th className="p-3 w-14" scope="col">
                Avatar
              </th>
              <th className="p-3 min-w-[120px]" scope="col">
                Learner&apos;s First Name
              </th>
              <th className="p-3 min-w-[120px]" scope="col">
                Learner&apos;s Last Name
              </th>
              <th className="p-3 min-w-[90px]" scope="col">
                Grade Level
              </th>
              <th className="p-3 min-w-[100px]" scope="col">
                Gender
              </th>
              <th className="p-3 min-w-[140px]" scope="col">
                Relationship to Learner
              </th>
              <th className="p-3 w-24" scope="col">
                Remove
              </th>
            </tr>
          </thead>
          <tbody>
            {learners.map((learner) => {
              const editing = editingLabel === learner.learnerLabel;
              const row = editing ? editDraft : learner;
              const g = editing
                ? { select: row.genderSelect, other: row.genderOther }
                : parseGenderValue(row.gender);
              const rel = editing
                ? { select: row.relationshipSelect, other: row.relationshipOther }
                : parseRelationship(row.relationshipToLearner);

              return (
                <tr
                  key={learner.learnerLabel}
                  className={`border-t border-gray-100 hover:bg-gray-50/50 ${
                    learner.isSelf ? 'bg-brand-light-blue/10' : ''
                  }`}
                >
                  <td className="p-3 align-middle">
                    <button
                      type="button"
                      onClick={() =>
                        editing ? onSaveEdit() : onStartEdit(learner)
                      }
                      className="p-1.5 rounded-md text-brand-medium-blue hover:bg-brand-light-blue/30"
                      aria-label={editing ? 'Save row' : 'Edit row'}
                      title={editing ? 'Save' : 'Edit'}
                    >
                      {editing ? <SaveIcon /> : <PencilIcon />}
                    </button>
                    {editing && (
                      <button
                        type="button"
                        onClick={onCancelEdit}
                        className="block mt-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        undo
                      </button>
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing ? (
                      <select
                        value={row.avatarIcon || '👤'}
                        onChange={(e) =>
                          onDraftChange({ avatarIcon: e.target.value })
                        }
                        className="text-xl border border-gray-300 rounded p-1 w-14"
                        aria-label="Learner avatar"
                      >
                        {['👤', '😀', '🧒', '👦', '👧', '🧑‍🎓', '👩‍🎓', '🦊', '📚'].map(
                          (e) => (
                            <option key={e} value={e}>
                              {e}
                            </option>
                          ),
                        )}
                      </select>
                    ) : (
                      <span className="text-2xl" title="Avatar">
                        {row.avatarIcon || '👤'}
                      </span>
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing ? (
                      <input
                        value={row.learnerFirstName || ''}
                        onChange={(e) =>
                          onDraftChange({ learnerFirstName: e.target.value })
                        }
                        className={cellInput}
                      />
                    ) : (
                      row.learnerFirstName
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing ? (
                      <input
                        value={row.learnerLastName || ''}
                        onChange={(e) =>
                          onDraftChange({ learnerLastName: e.target.value })
                        }
                        className={cellInput}
                        title="Only you and TS Admin see last names"
                      />
                    ) : (
                      row.learnerLastName
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing ? (
                      <select
                        value={row.gradeLevel || ''}
                        onChange={(e) =>
                          onDraftChange({ gradeLevel: e.target.value })
                        }
                        className={cellInput}
                      >
                        <option value="">—</option>
                        {gradeLevels.map((gl) => (
                          <option key={gl} value={gl}>
                            {gl}
                          </option>
                        ))}
                      </select>
                    ) : (
                      row.gradeLevel
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing ? (
                      <div className="space-y-1">
                        <select
                          value={g.select}
                          onChange={(e) =>
                            onDraftChange({ genderSelect: e.target.value })
                          }
                          className={cellInput}
                        >
                          <option value="">—</option>
                          {GENDER_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                        {g.select === 'Other' && (
                          <input
                            value={g.other}
                            onChange={(e) =>
                              onDraftChange({ genderOther: e.target.value })
                            }
                            placeholder="Specify"
                            className={cellInput}
                          />
                        )}
                      </div>
                    ) : (
                      row.gender
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {editing && !learner.isSelf ? (
                      <div className="space-y-1">
                        <select
                          value={rel.select}
                          onChange={(e) =>
                            onDraftChange({ relationshipSelect: e.target.value })
                          }
                          className={cellInput}
                        >
                          <option value="">—</option>
                          {RELATIONSHIP_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        {rel.select === 'Other (Specify)' && (
                          <input
                            value={rel.other}
                            onChange={(e) =>
                              onDraftChange({ relationshipOther: e.target.value })
                            }
                            className={cellInput}
                          />
                        )}
                      </div>
                    ) : (
                      row.relationshipToLearner
                    )}
                  </td>
                  <td className="p-3 align-middle">
                    {learner.isSelf ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onRemove(learner)}
                        className="text-gray-700 hover:text-red-700 text-xs font-medium border border-gray-300 bg-gray-100 hover:bg-gray-50 px-3 py-1.5 rounded"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Scroll to view and manage additional learners. Self appears on the first row when
        registered.
      </p>
    </>
  );
};

export { parseRelationship };
export default MyLearnersTable;
