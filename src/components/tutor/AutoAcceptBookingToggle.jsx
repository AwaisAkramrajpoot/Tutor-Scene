import { useState, useEffect, useRef } from 'react';
import {
  getTutorBookingSettings,
  updateTutorBookingSettings,
} from '../../services/tutorBookingService';

const AutoAcceptBookingToggle = ({ onChange, className = '' }) => {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [prospectId, setProspectId] = useState(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const load = async () => {
      try {
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          onChangeRef.current?.(false);
          return;
        }
        const user = JSON.parse(userStr);
        const id = user.prospectId;
        if (!id) {
          onChangeRef.current?.(false);
          return;
        }
        setProspectId(id);
        const settings = await getTutorBookingSettings(id);
        const value = Boolean(settings?.autoAcceptBookingRequests);
        setEnabled(value);
        onChangeRef.current?.(value);
      } catch {
        setEnabled(false);
        onChangeRef.current?.(false);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async () => {
    if (!prospectId || saving) return;
    const next = !enabled;
    setSaving(true);
    try {
      await updateTutorBookingSettings(prospectId, next);
      setEnabled(next);
      onChange?.(next);
    } catch {
      // keep previous value on error
    } finally {
      setSaving(false);
    }
  };

  return (
    <label
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
    >
      <span className="text-sm italic text-red-600 whitespace-nowrap">
        Automatically Accept Booking Requests
      </span>
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleToggle}
        disabled={loading || saving}
        className="h-4 w-4 rounded border-gray-300 text-brand-medium-blue focus:ring-brand-medium-blue disabled:opacity-50"
        aria-label="Automatically accept booking requests"
      />
    </label>
  );
};

export default AutoAcceptBookingToggle;
