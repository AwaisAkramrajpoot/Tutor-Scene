import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest, getCurrentUser } from '../../../utils/api';
import {
  AVATAR_EMOJI_GALLERY,
  EMPTY_LEARNER_FORM,
  RELATIONSHIP_OPTIONS,
} from '../../../data/learnerProfileConstants';
import {
  fetchLearners,
  updateProfile,
  upsertLearner,
  fetchRemovalPreview,
  removeLearner,
} from '../../../services/studentAccountService';
import ProfileSectionCard from './ProfileSectionCard';
import GenderField, { parseGenderValue, resolveGender } from './GenderField';
import EmojiAvatarPicker from './EmojiAvatarPicker';
import MyLearnersTable, { parseRelationship } from './MyLearnersTable';
import RemoveLearnerDialog from './RemoveLearnerDialog';

const NAV_ITEMS = [
  { id: 'section-my-profile', label: '1. My Profile' },
  { id: 'section-learners-profile', label: "2. Learner's Profile" },
  { id: 'section-add-learner', label: '3. Add a Learner' },
  { id: 'section-my-learners', label: 'My Learners' },
];

const RelationshipField = ({ value, other, onChange, onOther, disabled }) => (
  <div>
    <label className="text-sm text-gray-600">Relationship to Learner</label>
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
    >
      <option value="">Select relationship</option>
      {RELATIONSHIP_OPTIONS.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
    {value === 'Other (Specify)' && (
      <input
        type="text"
        disabled={disabled}
        placeholder="Specify relationship"
        value={other}
        onChange={(e) => onOther(e.target.value)}
        className="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 disabled:bg-gray-100"
      />
    )}
  </div>
);

function resolveRelationship(select, other) {
  if (select === 'Other (Specify)') return other.trim() || 'Other (Specify)';
  return select;
}

const ProfileInformationPage = () => {
  const user = getCurrentUser();
  const [genderSelect, setGenderSelect] = useState('');
  const [genderOther, setGenderOther] = useState('');
  const [avatarIcon, setAvatarIcon] = useState(user?.avatarIcon || AVATAR_EMOJI_GALLERY[0]);
  const [registersSelf, setRegistersSelf] = useState(Boolean(user?.registersSelfAsLearner));
  const [addLearnersSelected, setAddLearnersSelected] = useState(false);
  const [pendingForms, setPendingForms] = useState([]);
  const [learners, setLearners] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [filterRel, setFilterRel] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [editingLabel, setEditingLabel] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removePreview, setRemovePreview] = useState(null);
  const [removePreviewLoading, setRemovePreviewLoading] = useState(false);
  const [removingLearner, setRemovingLearner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  const [myProfileEditing, setMyProfileEditing] = useState(false);
  const [myProfileSaved, setMyProfileSaved] = useState(true);
  const [myProfileSnapshot, setMyProfileSnapshot] = useState(null);
  const [learnersSectionEditing, setLearnersSectionEditing] = useState(false);
  const [learnersSectionSaved, setLearnersSectionSaved] = useState(true);
  const [learnersSnapshot, setLearnersSnapshot] = useState(null);
  const [activeNav, setActiveNav] = useState('section-my-profile');

  const loadLearners = useCallback(async () => {
    try {
      const res = await fetchLearners();
      setLearners(res.learners || []);
    } catch {
      setLearners([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadLearners();
      try {
        const me = await apiRequest('/api/v1/auth/me');
        const g = parseGenderValue(me.gender);
        setGenderSelect(g.select);
        setGenderOther(g.other);
        setAvatarIcon(me.avatarIcon || AVATAR_EMOJI_GALLERY[0]);
        setRegistersSelf(Boolean(me.registersSelfAsLearner));
      } catch {
        /* ignore */
      }
      try {
        const gl = await apiRequest('/api/v1/grade-levels');
        const list = Array.isArray(gl) ? gl : gl?.data || [];
        setGradeLevels(list.map((g) => g.name || g));
      } catch {
        setGradeLevels(['Elementary', 'Middle', 'High', 'College']);
      }
      setLoading(false);
    })();
  }, [loadLearners]);

  const scrollToSection = (id) => {
    setActiveNav(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveMyProfile = async () => {
    const gender = resolveGender(genderSelect, genderOther);
    await updateProfile({
      gender,
      avatarIcon,
      registersSelfAsLearner: registersSelf,
    });
    const u = getCurrentUser();
    if (u) {
      localStorage.setItem(
        'user',
        JSON.stringify({
          ...u,
          gender,
          avatarIcon,
          registersSelfAsLearner: registersSelf,
        }),
      );
    }
    if (registersSelf) await loadLearners();
    setMyProfileEditing(false);
    setMyProfileSaved(true);
    setMsg('My Profile saved.');
  };

  const saveLearnersSection = async () => {
    await updateProfile({ registersSelfAsLearner: registersSelf });
    if (registersSelf) {
      const u = getCurrentUser();
      await upsertLearner({
        isSelf: true,
        learnerFirstName: u?.firstName || 'Self',
        learnerLastName: u?.lastName || '',
        avatarIcon,
        gender: resolveGender(genderSelect, genderOther),
        relationshipToLearner: 'Self',
        gradeLevel: '',
      });
      await loadLearners();
    }
    setLearnersSectionEditing(false);
    setLearnersSectionSaved(true);
    setMsg("Learner's Profile saved.");
  };

  const handleAddLearnerClick = () => {
    setAddLearnersSelected(true);
    setPendingForms((f) => [...f, EMPTY_LEARNER_FORM()]);
    setActiveNav('section-add-learner');
    setTimeout(() => scrollToSection('section-add-learner'), 100);
  };

  const handleLearnersNext = () => {
    if (addLearnersSelected && pendingForms.length > 0) {
      scrollToSection('section-add-learner');
    } else {
      scrollToSection('section-my-learners');
    }
  };

  const updatePendingForm = (index, patch) => {
    setPendingForms((arr) =>
      arr.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  };

  const savePendingForm = async (index, addAnother = false) => {
    const form = pendingForms[index];
    const rel = resolveRelationship(
      form.relationshipSelect,
      form.relationshipOther,
    );
    await upsertLearner({
      learnerFirstName: form.learnerFirstName,
      learnerLastName: form.learnerLastName,
      gradeLevel: form.gradeLevel,
      gender: resolveGender(form.genderSelect, form.genderOther),
      relationshipToLearner: rel,
      avatarIcon: form.avatarIcon,
    });
    setPendingForms((f) => f.filter((_, i) => i !== index));
    await loadLearners();
    setMsg('Learner added to your account.');
    if (addAnother) {
      setPendingForms((f) => [...f, EMPTY_LEARNER_FORM()]);
      scrollToSection('section-add-learner');
    } else if (pendingForms.length <= 1) {
      setAddLearnersSelected(false);
    }
  };

  const startEdit = (learner) => {
    const g = parseGenderValue(learner.gender);
    const r = parseRelationship(learner.relationshipToLearner);
    const draft = {
      ...learner,
      genderSelect: g.select,
      genderOther: g.other,
      relationshipSelect: r.select,
      relationshipOther: r.other,
    };
    setEditingLabel(learner.learnerLabel);
    setEditDraft(draft);
  };

  const cancelRowEdit = () => {
    setEditingLabel(null);
    setEditDraft(null);
  };

  const handleDraftChange = (patch) => {
    setEditDraft((d) => (d ? { ...d, ...patch } : d));
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    await upsertLearner({
      learnerLabel: editDraft.learnerLabel,
      learnerFirstName: editDraft.learnerFirstName,
      learnerLastName: editDraft.learnerLastName,
      gradeLevel: editDraft.gradeLevel,
      gender: resolveGender(editDraft.genderSelect, editDraft.genderOther),
      relationshipToLearner: resolveRelationship(
        editDraft.relationshipSelect,
        editDraft.relationshipOther,
      ),
      avatarIcon: editDraft.avatarIcon,
      isSelf: editDraft.isSelf,
    });
    setEditingLabel(null);
    setEditDraft(null);
    await loadLearners();
    setMsg('Learner updated.');
  };

  const openRemove = async (learner) => {
    setRemoveTarget(learner);
    setRemovePreview(null);
    setRemovePreviewLoading(true);
    try {
      setRemovePreview(await fetchRemovalPreview(learner.learnerLabel));
    } catch {
      setRemovePreview({ hasUpcomingSessions: false, sessions: [] });
    } finally {
      setRemovePreviewLoading(false);
    }
  };

  const closeRemoveDialog = () => {
    if (removingLearner) return;
    setRemoveTarget(null);
    setRemovePreview(null);
    setRemovePreviewLoading(false);
  };

  const confirmRemove = async (cancelSessions) => {
    if (!removeTarget || removingLearner) return;
    setRemovingLearner(true);
    try {
      await removeLearner(removeTarget.learnerLabel, cancelSessions);
      closeRemoveDialog();
      await loadLearners();
      setMsg(
        cancelSessions
          ? `${removeTarget.learnerFirstName} was removed and upcoming sessions were cancelled.`
          : `${removeTarget.learnerFirstName} was removed.`,
      );
    } catch (err) {
      setMsg(err?.message || 'Could not remove learner.');
    } finally {
      setRemovingLearner(false);
    }
  };

  const filteredLearners = useMemo(() => {
    let list = [...learners];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          (l.learnerFirstName || '').toLowerCase().includes(q) ||
          (l.learnerLastName || '').toLowerCase().includes(q) ||
          (l.gradeLevel || '').toLowerCase().includes(q),
      );
    }
    if (filterRel) {
      list = list.filter((l) =>
        filterRel === 'Self'
          ? l.isSelf
          : l.relationshipToLearner === filterRel,
      );
    }
    if (filterGender) {
      list = list.filter((l) => {
        const g = parseGenderValue(l.gender);
        const resolved = resolveGender(g.select, g.other);
        return resolved === filterGender || l.gender === filterGender;
      });
    }
    list.sort((a, b) => {
      if (a.isSelf && !b.isSelf) return -1;
      if (!a.isSelf && b.isSelf) return 1;
      if (sortKey === 'grade') {
        return (a.gradeLevel || '').localeCompare(b.gradeLevel || '');
      }
      if (sortKey === 'relationship') {
        return (a.relationshipToLearner || '').localeCompare(
          b.relationshipToLearner || '',
        );
      }
      return (a.learnerFirstName || '').localeCompare(b.learnerFirstName || '');
    });
    return list;
  }, [learners, search, sortKey, filterRel, filterGender]);

  const showAddLearnerSections = addLearnersSelected && pendingForms.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-brand-dark-blue">Profile Information</h1>
        <p className="text-gray-600 mt-2 mb-6">
          Easily update your personal details and add learners to get the most out of your
          experience.
        </p>
        {msg && (
          <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            {msg}
          </p>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <nav className="lg:w-56 shrink-0 lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-1">
              Profile Navigation
            </p>
            <ul className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {NAV_ITEMS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-100 last:border-0 transition-colors ${
                      activeNav === item.id
                        ? 'bg-brand-light-blue/40 text-brand-dark-blue font-semibold'
                        : 'text-gray-700 hover:bg-brand-light-blue/20 hover:text-brand-dark-blue'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex-1 space-y-6">
            <ProfileSectionCard
              id="section-my-profile"
              title="My Profile"
              subtitle="Basic information for the account holder."
              saved={myProfileSaved && !myProfileEditing}
              editing={myProfileEditing}
              onEdit={() => {
                setMyProfileSnapshot({
                  genderSelect,
                  genderOther,
                  avatarIcon,
                });
                setMyProfileEditing(true);
                setMyProfileSaved(false);
              }}
              onCancel={() => {
                if (myProfileSnapshot) {
                  setGenderSelect(myProfileSnapshot.genderSelect);
                  setGenderOther(myProfileSnapshot.genderOther);
                  setAvatarIcon(myProfileSnapshot.avatarIcon);
                }
                setMyProfileEditing(false);
                setMyProfileSaved(true);
              }}
              onSave={saveMyProfile}
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <EmojiAvatarPicker
                  value={avatarIcon}
                  onChange={setAvatarIcon}
                  disabled={!myProfileEditing}
                />
                <div className="flex-1 space-y-4 w-full max-w-lg">
                  <div>
                    <label className="text-sm text-gray-600">
                      First name (Auto-populate)
                    </label>
                    <div className="mt-1 w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-800">
                      {user?.firstName || '—'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Read-only. Submit a support request to change your name.
                    </p>
                  </div>
                  <GenderField
                    idPrefix="my-profile-gender"
                    label="Gender"
                    select={genderSelect}
                    other={genderOther}
                    onSelect={setGenderSelect}
                    onOther={setGenderOther}
                    disabled={!myProfileEditing}
                  />
                </div>
              </div>
            </ProfileSectionCard>

            <ProfileSectionCard
              id="section-learners-profile"
              title="Create Learner's Profile"
              subtitle="Select Self to register yourself. Select Add Learner(s) to register someone else. Select both Self and Add Learner(s) if needed."
              saved={learnersSectionSaved && !learnersSectionEditing}
              editing={learnersSectionEditing}
              onEdit={() => {
                setLearnersSnapshot({ registersSelf, addLearnersSelected });
                setLearnersSectionEditing(true);
                setLearnersSectionSaved(false);
              }}
              onCancel={() => {
                if (learnersSnapshot) {
                  setRegistersSelf(learnersSnapshot.registersSelf);
                  setAddLearnersSelected(learnersSnapshot.addLearnersSelected);
                }
                setLearnersSectionEditing(false);
                setLearnersSectionSaved(true);
              }}
              onSave={saveLearnersSection}
              showNext
              onNext={handleLearnersNext}
            >
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  disabled={!learnersSectionEditing}
                  onClick={() => setRegistersSelf((v) => !v)}
                  className={`min-w-[140px] px-8 py-4 rounded-lg font-semibold border-2 transition-colors disabled:opacity-60 ${
                    registersSelf
                      ? 'border-brand-medium-blue bg-brand-light-blue/40 text-brand-dark-blue'
                      : 'border-gray-300 bg-gray-50 text-brand-dark-blue'
                  }`}
                >
                  Self
                </button>
                <button
                  type="button"
                  onClick={handleAddLearnerClick}
                  className={`min-w-[180px] px-8 py-4 rounded-lg font-semibold border-2 transition-colors ${
                    addLearnersSelected
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : 'border-green-500 bg-white text-green-700 hover:bg-green-50'
                  }`}
                >
                  Add Learner(s)
                </button>
              </div>
            </ProfileSectionCard>

            {showAddLearnerSections &&
              pendingForms.map((form, index) => (
                <div
                  key={`pending-${index}`}
                  id={index === 0 ? 'section-add-learner' : undefined}
                  className="flex flex-col lg:flex-row lg:items-start gap-4 scroll-mt-24"
                >
                  <section className="flex-1 bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-brand-dark-blue mb-1">
                      Section 3: Add a Learner
                      {pendingForms.length > 1 ? ` (${index + 1})` : ''}
                    </h2>
                    <h3 className="text-base font-semibold text-gray-800 mb-2">New Learner</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Create the learner profile that will be linked to your account.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Avatar (Edit)</p>
                        <EmojiAvatarPicker
                          size="md"
                          value={form.avatarIcon}
                          onChange={(emoji) => updatePendingForm(index, { avatarIcon: emoji })}
                        />
                      </div>
                      <div className="space-y-4 md:col-span-1">
                        <div>
                          <label className="text-sm text-gray-600">
                            Learner&apos;s First name (Edit)
                          </label>
                          <input
                            value={form.learnerFirstName}
                            onChange={(e) =>
                              updatePendingForm(index, { learnerFirstName: e.target.value })
                            }
                            placeholder="Enter first name"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">
                            Learner&apos;s Last name (Edit)
                          </label>
                          <input
                            value={form.learnerLastName}
                            onChange={(e) =>
                              updatePendingForm(index, { learnerLastName: e.target.value })
                            }
                            placeholder="Enter last name"
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Only you and Tutor Scene Administrators can see last names.
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Grade level (Edit)</label>
                          <select
                            value={form.gradeLevel}
                            onChange={(e) =>
                              updatePendingForm(index, { gradeLevel: e.target.value })
                            }
                            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2"
                          >
                            <option value="">Select grade level</option>
                            {gradeLevels.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </div>
                        <GenderField
                          idPrefix={`learner-${index}-gender`}
                          label="Gender options (Edit)"
                          select={form.genderSelect || ''}
                          other={form.genderOther || ''}
                          onSelect={(v) => updatePendingForm(index, { genderSelect: v })}
                          onOther={(v) => updatePendingForm(index, { genderOther: v })}
                        />
                        <RelationshipField
                          value={form.relationshipSelect || ''}
                          other={form.relationshipOther || ''}
                          onChange={(v) => updatePendingForm(index, { relationshipSelect: v })}
                          onOther={(v) => updatePendingForm(index, { relationshipOther: v })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-6">
                      The learner will be added to your account after saving.
                    </p>
                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPendingForms((f) => f.filter((_, i) => i !== index));
                          if (pendingForms.length <= 1) setAddLearnersSelected(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => savePendingForm(index, false)}
                        className="px-6 py-2 bg-brand-medium-blue text-white rounded-lg text-sm font-medium hover:bg-brand-dark-blue"
                      >
                        Save
                      </button>
                    </div>
                  </section>
                  <button
                    type="button"
                    onClick={() => savePendingForm(index, true)}
                    className="lg:mt-8 shrink-0 px-5 py-3 bg-green-600 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-green-700 whitespace-nowrap self-end lg:self-start"
                  >
                    Save &amp; Add a Learner
                  </button>
                </div>
              ))}

            {!showAddLearnerSections && (
              <div
                id="section-add-learner"
                className="rounded-xl border border-dashed border-gray-300 bg-gray-50/80 px-6 py-8 text-center text-sm text-gray-500 scroll-mt-24"
              >
                Section 3: Add a Learner — select <strong>Add Learner(s)</strong> above to add a
                new learner form.
              </div>
            )}

            <section
              id="section-my-learners"
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm scroll-mt-24"
            >
              <h2 className="text-lg font-bold text-brand-dark-blue mb-1">My Learners</h2>
              <p className="text-sm text-gray-600 mb-4">
                Learners on this account. Edit inline with the pencil icon (saves as checkmark).
                Self appears first when registered.
              </p>
              <MyLearnersTable
                learners={filteredLearners}
                totalLearnerCount={learners.length}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                sortKey={sortKey}
                onSortChange={setSortKey}
                filterRel={filterRel}
                onFilterRelChange={setFilterRel}
                filterGender={filterGender}
                onFilterGenderChange={setFilterGender}
                gradeLevels={gradeLevels}
                editingLabel={editingLabel}
                editDraft={editDraft}
                onStartEdit={startEdit}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelRowEdit}
                onDraftChange={handleDraftChange}
                onRemove={openRemove}
              />
            </section>
          </div>
        </div>
      </div>

      <RemoveLearnerDialog
        open={Boolean(removeTarget)}
        learner={removeTarget}
        preview={removePreview}
        loading={removePreviewLoading}
        removing={removingLearner}
        onClose={closeRemoveDialog}
        onConfirm={confirmRemove}
      />
    </div>
  );
};

export default ProfileInformationPage;
