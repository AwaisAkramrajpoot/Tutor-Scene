export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

export const RELATIONSHIP_OPTIONS = [
  'Parent',
  'Legal Guardian',
  'Grandparent',
  'Aunt / Uncle',
  'Older Sibling',
  'Foster Parent',
  'Step-Parent',
  'Family Friend',
  'Mentor / Coach',
  'Teacher',
  'School Counselor',
  'Caseworker / Social Worker',
  'Tutor / Academic Support Staff',
  'Other (Specify)',
];

export const AVATAR_EMOJI_GALLERY = [
  '😀', '😎', '🤓', '🧑‍🎓', '👩‍🎓', '🧒', '👦', '👧',
  '🦊', '🐻', '🐼', '🐨', '🦁', '🐯', '🐸', '🦄',
  '⭐', '🌟', '📚', '✏️', '🎨', '🔬', '🎵', '⚽',
];

export const EMPTY_LEARNER_FORM = () => ({
  learnerLabel: '',
  learnerFirstName: '',
  learnerLastName: '',
  gradeLevel: '',
  genderSelect: '',
  genderOther: '',
  relationshipSelect: '',
  relationshipOther: '',
  avatarIcon: AVATAR_EMOJI_GALLERY[0],
  isSelf: false,
});
