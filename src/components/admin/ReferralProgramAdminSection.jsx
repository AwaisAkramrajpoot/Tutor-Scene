import { useEffect, useState } from 'react';
import { Button, TextField } from '@mui/material';
import {
  getReferralProgramContent,
  updateReferralProgramContent,
} from '../../services/tutorReferralsService';
import { useSystemMessage } from '../../hooks/useSystemMessage';

const fields = [
  { key: 'howItWorksTitle', label: 'How It Works — Title' },
  { key: 'howItWorksSubtitle', label: 'How It Works — Subtitle' },
  { key: 'howItWorksBody', label: 'How It Works — Body', multiline: true },
  { key: 'earnTitle', label: 'Earn Section — Title' },
  { key: 'earnBody', label: 'Earn Section — Body', multiline: true },
  { key: 'referralsTitle', label: 'Referrals — Title' },
  { key: 'referralsSubtitle', label: 'Referrals — Subtitle' },
  { key: 'referralCodeTitle', label: 'Referral Code — Title' },
  { key: 'referralLinkTitle', label: 'Referral Link — Title' },
  { key: 'referralShareHint', label: 'Share Hint', multiline: true },
  { key: 'termsUrl', label: 'Terms & Conditions URL' },
];

export const ReferralProgramAdminSection = () => {
  const { showMessage } = useSystemMessage();
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getReferralProgramContent();
        setForm(data || {});
      } catch (error) {
        console.error(error);
        showMessage('Failed to load referral program content.', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showMessage]);

  const handleChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateReferralProgramContent(form);
      showMessage('Referral program content saved.', 'success');
    } catch (error) {
      console.error(error);
      showMessage('Failed to save referral program content.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-center text-gray-600">Loading referral program content…</div>;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-brand-deep-navy">Referrals Program Content</h2>
        <p className="mt-1 text-sm text-gray-600">
          Edit the verbiage shown in the tutor referrals pop-up on the dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            value={form[field.key] || ''}
            onChange={handleChange(field.key)}
            fullWidth
            multiline={Boolean(field.multiline)}
            minRows={field.multiline ? 3 : 1}
          />
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          sx={{
            backgroundColor: 'var(--brand-medium-blue)',
            '&:hover': { backgroundColor: 'var(--brand-dark-blue)' },
          }}
        >
          {saving ? 'Saving…' : 'Save Content'}
        </Button>
      </div>
    </div>
  );
};
