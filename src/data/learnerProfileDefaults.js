export function buildLearnerProfilePayload(learnerLabel, user) {
  const presets = {
    Emma: {
      learnerFirstName: 'Emma',
      gradeLevel: '7',
      gender: 'Female',
      relationshipToLearner: 'Parent/Guardian',
    },
    Jack: {
      learnerFirstName: 'Jack',
      gradeLevel: '6',
      gender: 'Male',
      relationshipToLearner: 'Parent/Guardian',
    },
    Sarah: {
      learnerFirstName: 'Sarah',
      gradeLevel: '9',
      gender: 'Female',
      relationshipToLearner: 'Parent/Guardian',
    },
    Michael: {
      learnerFirstName: 'Michael',
      gradeLevel: '11',
      gender: 'Male',
      relationshipToLearner: 'Parent/Guardian',
    },
  };
  if (presets[learnerLabel]) {
    return presets[learnerLabel];
  }
  const fn = user?.firstName || 'Learner';
  return {
    learnerFirstName: fn,
    gradeLevel: '',
    gender: '',
    relationshipToLearner: 'Self',
  };
}
