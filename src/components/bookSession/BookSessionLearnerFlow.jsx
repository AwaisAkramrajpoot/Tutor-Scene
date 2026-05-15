import { useCallback, useEffect, useMemo, useState } from 'react';
import BookSessionBlueSection from './BookSessionBlueSection';
import BookSessionMatchFlow from './BookSessionMatchFlow';
import LearnerAssessmentModal from './LearnerAssessmentModal';

const BookSessionLearnerFlow = ({ embedded = false }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [assessmentOpen, setAssessmentOpen] = useState(false);
  const [modalLearnerLabel, setModalLearnerLabel] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem('user');
    if (!s) return;
    try {
      setUser(JSON.parse(s));
    } catch {
      setUser(null);
    }
  }, []);

  const learnerChoices = useMemo(() => {
    if (!user) return [];
    const n = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const account = n || 'Account holder';
    return [account, 'Emma', 'Jack', 'Sarah', 'Michael'];
  }, [user]);

  const bump = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const openAssessment = useCallback((label) => {
    setModalLearnerLabel(label);
    setAssessmentOpen(true);
  }, []);

  const closeAssessment = useCallback(() => {
    setAssessmentOpen(false);
    setModalLearnerLabel('');
  }, []);

  return (
    <>
      <BookSessionBlueSection
        embedded={embedded}
        learnerChoices={learnerChoices}
        onLaunchAssessment={openAssessment}
      />
      <div className="w-full bg-white pb-12">
        <BookSessionMatchFlow
          refreshKey={refreshKey}
          onEditAssessment={openAssessment}
          onAfterRemove={bump}
          profileReturnPath={embedded ? '/dashboard' : '/book-session'}
        />
      </div>
      <LearnerAssessmentModal
        open={assessmentOpen}
        onClose={closeAssessment}
        learnerLabel={modalLearnerLabel}
        learnerChoices={learnerChoices}
        onLearnerLabelChange={setModalLearnerLabel}
        user={user}
        onPersisted={bump}
      />
    </>
  );
};

export default BookSessionLearnerFlow;
