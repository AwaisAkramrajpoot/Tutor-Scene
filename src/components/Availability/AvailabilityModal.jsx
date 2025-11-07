import { useState, useEffect } from 'react';

const AvailabilityModal = ({
  isOpen,
  mode,
  initialData,
  onSubmit,
  onClose,
  onDelete,
  submitting
}) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    isRecurring: false,
    selectedDays: {
      MONDAY: true,
      TUESDAY: true,
      WEDNESDAY: true,
      THURSDAY: true,
      FRIDAY: true,
      SATURDAY: false,
      SUNDAY: false
    }
  });

  const [errors, setErrors] = useState({});

  const daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
        startTime: initialData.startTime || '09:00',
        endTime: initialData.endTime || '17:00',
        isRecurring: initialData.isRecurring || false,
        selectedDays: initialData.selectedDays || {
          MONDAY: true,
          TUESDAY: true,
          WEDNESDAY: true,
          THURSDAY: true,
          FRIDAY: true,
          SATURDAY: false,
          SUNDAY: false
        }
      });
    }
  }, [initialData]);

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (formData.isRecurring && !formData.endDate) {
      newErrors.endDate = 'End date is required for recurring availability';
    }

    if (formData.isRecurring && formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    // Validate that end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.split(':').map(Number);
      const end = formData.endTime.split(':').map(Number);
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];

      if (endMinutes <= startMinutes) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (formData.isRecurring) {
      const hasSelectedDay = Object.values(formData.selectedDays).some(day => day);
      if (!hasSelectedDay) {
        newErrors.selectedDays = 'Please select at least one day of the week';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this availability slot?')) {
      onDelete();
    }
  };

  const toggleDay = (day) => {
    setFormData({
      ...formData,
      selectedDays: {
        ...formData.selectedDays,
        [day]: !formData.selectedDays[day]
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'edit' ? 'Edit Availability Slot' : 'Add New Availability Slot'}
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-gray-50"
                required
                readOnly
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
              {errors.startTime && (
                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
              )}
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                required
              />
              {errors.endTime && (
                <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>
              )}
            </div>

            {/* Recurring Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-700">
                Recurring availability
              </label>
            </div>

            {/* End Date (conditional - only if recurring) */}
            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required={formData.isRecurring}
                  min={formData.startDate}
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
                )}
              </div>
            )}

            {/* Day Selection (conditional - only if recurring) */}
            {formData.isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {daysOfWeek.map(day => (
                    <label
                      key={day}
                      className="flex items-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedDays[day]}
                        onChange={() => toggleDay(day)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 capitalize">
                        {day.toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.selectedDays && (
                  <p className="mt-1 text-sm text-red-600">{errors.selectedDays}</p>
                )}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : mode === 'edit' ? 'Update' : 'Add'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>

            {/* Delete Button (Edit Mode Only) */}
            {mode === 'edit' && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Slot
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityModal;
