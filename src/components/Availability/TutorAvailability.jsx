import { useState, useEffect } from 'react';
import { apiRequest } from '../../utils/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import AvailabilityModal from './AvailabilityModal';
import { showSystemMessage } from '../../utils/systemMessage';

const TutorAvailability = () => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Helper function to get tutorProfileId from localStorage
  const getTutorProfileId = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return null;
      }
      const user = JSON.parse(userStr);
      return user.id || user._id || user.userId;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  };



  // Transform API availability data to FullCalendar event format
  const transformToCalendarEvents = (availabilities) => {
    const events = [];
    
    availabilities.forEach(slot => {
      // API now returns ISO 8601 date strings for startTime and endTime
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      
      // Format time for display (e.g., "12:00am - 1:00am")
      const startTimeStr = startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase().replace(' ', '');
      
      const endTimeStr = endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }).toLowerCase().replace(' ', '');
      
      events.push({
        id: `${slot.id}`,
        title: `${startTimeStr} - ${endTimeStr}`,
        start: slot.startTime,
        end: slot.endTime,
        backgroundColor: '#2563eb',
        borderColor: '#1d4ed8',
        textColor: '#ffffff',
        extendedProps: {
          availabilityId: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      });
    });
    
    return events;
  };

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      setAuthError(false);

      const tutorId = getTutorProfileId();
      if (!tutorId) {
        setAuthError(true);
        setErrorMessage('User not authenticated. Please log in to manage your availability.');
        setLoading(false);
        return;
      }

      const response = await apiRequest(`/api/v1/availability/tutor/${tutorId}`);
      const availabilitiesData = response.availabilities || response.data || response || [];
      
      // Transform API data to calendar events
      const events = transformToCalendarEvents(availabilitiesData);
      setCalendarEvents(events);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      
      // Handle specific error types
      if (error.statusCode === 401 || error.code === 'AUTH_ERROR') {
        setAuthError(true);
        setErrorMessage('Your session has expired. Please log in again.');
      } else if (error.statusCode === 403) {
        setErrorMessage('You do not have permission to view this availability.');
      } else if (error.statusCode === 404) {
        // 404 is acceptable - means no availabilities yet
        setCalendarEvents([]);
      } else if (error.code === 'NETWORK_ERROR') {
        setErrorMessage('Unable to connect to the server. Please check your internet connection.');
      } else {
        setErrorMessage(error.message || 'Failed to load availability. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle date click to open create modal
  const handleDateClick = (info) => {
    const clickedDate = new Date(info.date);
    
    // Extract time from clicked slot
    const hours = clickedDate.getHours().toString().padStart(2, '0');
    const minutes = clickedDate.getMinutes().toString().padStart(2, '0');
    const startTime = `${hours}:${minutes}`;
    
    // Calculate end time (1 hour later)
    const endDate = new Date(clickedDate);
    endDate.setHours(endDate.getHours() + 1);
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;
    
    // Format start date
    const year = clickedDate.getFullYear();
    const month = (clickedDate.getMonth() + 1).toString().padStart(2, '0');
    const day = clickedDate.getDate().toString().padStart(2, '0');
    const startDate = `${year}-${month}-${day}`;
    
    // Pre-populate form data
    setModalInitialData({
      startDate,
      endDate: '',
      startTime,
      endTime,
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
    
    setModalMode('create');
    setSelectedEvent(null);
    setShowModal(true);
  };

  // Handle event click to open edit modal
  const handleEventClick = (info) => {
    const event = info.event;
    
    // Extract start and end times from event
    const startDate = new Date(event.start);
    const endDate = new Date(event.end);
    
    const startHours = startDate.getHours().toString().padStart(2, '0');
    const startMinutes = startDate.getMinutes().toString().padStart(2, '0');
    const startTime = `${startHours}:${startMinutes}`;
    
    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
    const endTime = `${endHours}:${endMinutes}`;
    
    // Format start date
    const year = startDate.getFullYear();
    const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const day = startDate.getDate().toString().padStart(2, '0');
    const formattedStartDate = `${year}-${month}-${day}`;
    
    // Pre-populate form data with event's current values
    setModalInitialData({
      startDate: formattedStartDate,
      endDate: '',
      startTime,
      endTime,
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
    
    // Set modalMode to 'edit' and store the selected event
    setModalMode('edit');
    setSelectedEvent(event);
    setShowModal(true);
  };

  // Helper function to generate date range based on selected days
  const generateAvailabilitySlots = (formData, tutorProfileId) => {
    const slots = [];
    
    // Ensure tutorProfileId is a number
    const tutorId = parseInt(tutorProfileId, 10);
    
    if (!formData.isRecurring) {
      // Single day availability
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`);
      
      slots.push({
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        tutorProfileId: tutorId
      });
    } else {
      // Recurring availability - generate slots for each selected day
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      // Get selected days as array
      const selectedDays = Object.entries(formData.selectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([day, _]) => day);
      
      // Iterate through each day in the range
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][currentDate.getDay()];
        
        // Check if this day is selected
        if (selectedDays.includes(dayOfWeek)) {
          const year = currentDate.getFullYear();
          const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
          const day = currentDate.getDate().toString().padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          
          const startDateTime = new Date(`${dateStr}T${formData.startTime}:00`);
          const endDateTime = new Date(`${dateStr}T${formData.endTime}:00`);
          
          slots.push({
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            tutorProfileId: tutorId
          });
        }
        
        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    return slots;
  };

  const handleSubmit = async (formData) => {
    setSubmitting(true);

    try {
      const tutorProfileId = getTutorProfileId();
      if (!tutorProfileId) {
        showSystemMessage({ message: 'User not authenticated. Please log in again.', type: 'error' });
        setAuthError(true);
        setSubmitting(false);
        return;
      }

      if (modalMode === 'edit' && selectedEvent) {
        // Edit mode - PATCH request (single slot update)
        const tutorId = parseInt(tutorProfileId, 10);
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
        const endDateTime = new Date(`${formData.startDate}T${formData.endTime}:00`);
        
        const payload = {
          tutorProfileId: tutorId,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString()
        };
        
        await apiRequest(`/api/v1/availability/${selectedEvent.extendedProps.availabilityId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
      } else {
        // Create mode - generate array of availability slots
        const availabilitySlots = generateAvailabilitySlots(formData, tutorProfileId);
        
        // Send POST request with array of slots
        await apiRequest('/api/v1/availability', {
          method: 'POST',
          body: JSON.stringify(availabilitySlots)
        });
      }

      // Refresh calendar and close modal on success
      await fetchAvailabilities();
      setShowModal(false);
      setSelectedEvent(null);
      setModalInitialData(null);
    } catch (error) {
      console.error('Error saving availability:', error);
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to save availability. ';
      
      if (error.statusCode === 401 || error.code === 'AUTH_ERROR') {
        errorMsg = 'Your session has expired. Please log in again.';
        setAuthError(true);
      } else if (error.statusCode === 400 || error.code === 'VALIDATION_ERROR') {
        errorMsg += error.message || 'Please check your input and try again.';
        if (error.errors) {
          // Display field-specific errors if available
          const fieldErrors = Object.entries(error.errors)
            .map(([field, msg]) => `${field}: ${msg}`)
            .join('\n');
          errorMsg += '\n\n' + fieldErrors;
        }
      } else if (error.statusCode === 403) {
        errorMsg = 'You do not have permission to modify this availability.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      showSystemMessage({ message: errorMsg, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedEvent) return;

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this availability slot?');
    if (!confirmed) return;

    try {
      const tutorProfileId = getTutorProfileId();
      if (!tutorProfileId) {
        showSystemMessage({ message: 'User not authenticated. Please log in again.', type: 'error' });
        setAuthError(true);
        return;
      }

      await apiRequest(`/api/v1/availability/${selectedEvent.extendedProps.availabilityId}`, {
        method: 'DELETE'
      });
      
      // Refresh calendar and close modal on success
      await fetchAvailabilities();
      setShowModal(false);
      setSelectedEvent(null);
      setModalInitialData(null);
    } catch (error) {
      console.error('Error deleting availability:', error);
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to delete availability. ';
      
      if (error.statusCode === 401 || error.code === 'AUTH_ERROR') {
        errorMsg = 'Your session has expired. Please log in again.';
        setAuthError(true);
      } else if (error.statusCode === 403) {
        errorMsg = 'You do not have permission to delete this availability.';
      } else if (error.statusCode === 404) {
        errorMsg = 'This availability slot no longer exists.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      showSystemMessage({ message: errorMsg, type: 'error' });
    }
  };

  // Handle event drop (drag-and-drop)
  const handleEventDrop = async (info) => {
    const event = info.event;
    
    // Extract new start and end times from dropped event
    const newStartDate = new Date(event.start);
    const newEndDate = new Date(event.end);
    
    try {
      const tutorProfileId = getTutorProfileId();
      if (!tutorProfileId) {
        showSystemMessage({ message: 'User not authenticated. Please log in again.', type: 'error' });
        setAuthError(true);
        info.revert();
        return;
      }

      // Send PATCH request with updated times in ISO format
      const tutorId = parseInt(tutorProfileId, 10);
      const payload = {
        tutorProfileId: tutorId,
        startTime: newStartDate.toISOString(),
        endTime: newEndDate.toISOString()
      };

      await apiRequest(`/api/v1/availability/${event.extendedProps.availabilityId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refresh calendar to confirm changes
      await fetchAvailabilities();
    } catch (error) {
      console.error('Error updating availability:', error);
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to move availability. ';
      
      if (error.statusCode === 401 || error.code === 'AUTH_ERROR') {
        errorMsg = 'Your session has expired. Please log in again.';
        setAuthError(true);
      } else if (error.statusCode === 400 || error.code === 'VALIDATION_ERROR') {
        errorMsg += error.message || 'The new time slot is invalid.';
      } else if (error.statusCode === 403) {
        errorMsg = 'You do not have permission to modify this availability.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      showSystemMessage({ message: errorMsg, type: 'error' });
      // Revert event to original position on error
      info.revert();
    }
  };

  // Handle event resize
  const handleEventResize = async (info) => {
    const event = info.event;
    
    // Extract new start and end times from resized event
    const newStartDate = new Date(event.start);
    const newEndDate = new Date(event.end);
    
    try {
      const tutorProfileId = getTutorProfileId();
      if (!tutorProfileId) {
        showSystemMessage({ message: 'User not authenticated. Please log in again.', type: 'error' });
        setAuthError(true);
        info.revert();
        return;
      }

      // Send PATCH request with updated times in ISO format
      const tutorId = parseInt(tutorProfileId, 10);
      const payload = {
        tutorProfileId: tutorId,
        startTime: newStartDate.toISOString(),
        endTime: newEndDate.toISOString()
      };

      await apiRequest(`/api/v1/availability/${event.extendedProps.availabilityId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refresh calendar to confirm changes
      await fetchAvailabilities();
    } catch (error) {
      console.error('Error resizing availability:', error);
      
      // Provide user-friendly error messages
      let errorMsg = 'Failed to resize availability. ';
      
      if (error.statusCode === 401 || error.code === 'AUTH_ERROR') {
        errorMsg = 'Your session has expired. Please log in again.';
        setAuthError(true);
      } else if (error.statusCode === 400 || error.code === 'VALIDATION_ERROR') {
        errorMsg += error.message || 'The new duration is invalid.';
      } else if (error.statusCode === 403) {
        errorMsg = 'You do not have permission to modify this availability.';
      } else if (error.code === 'NETWORK_ERROR') {
        errorMsg = 'Unable to connect to the server. Please check your internet connection.';
      } else {
        errorMsg += error.message || 'Please try again.';
      }
      
      showSystemMessage({ message: errorMsg, type: 'error' });
      // Revert event to original size on error
      info.revert();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    );
  }

  // Show authentication error state
  if (authError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Please log in to manage your availability.'}
            </p>
            <button
              onClick={() => window.location.href = '/signin'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show general error state
  if (errorMessage && !authError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Availability</h3>
                <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
                <div className="mt-4">
                  <button
                    onClick={() => fetchAvailabilities()}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      {/* Loading Overlay during API operations */}
      {submitting && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="text-gray-700 font-medium">Saving changes...</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Your Availability</h1>
          <p className="text-gray-600">Click on the calendar to add availability slots</p>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
          </div>
          <div className="p-6">
            {/* Empty State */}
            {calendarEvents.length === 0 && (
              <div className="text-center py-12 px-4">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No availability slots yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Get started by clicking on any time slot in the calendar below to add your first availability.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Click any time slot to create availability
                </div>
              </div>
            )}
            
            {/* Calendar */}
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              slotMinTime="00:00:00"
              slotMaxTime="23:00:00"
              slotDuration="00:30:00"
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={true}
              allDaySlot={false}
              height="auto"
              displayEventTime={false}
              eventTextColor="#ffffff"
              eventContent={(eventInfo) => {
                return (
                  <div style={{ color: '#ffffff', fontWeight: '500' }}>
                    {eventInfo.event.title}
                  </div>
                );
              }}
              events={calendarEvents}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
            />
          </div>
        </div>

        {/* Availability Modal */}
        <AvailabilityModal
          isOpen={showModal}
          mode={modalMode}
          initialData={modalInitialData}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setModalInitialData(null);
          }}
          onDelete={handleDelete}
          submitting={submitting}
        />
      </div>
    </div>
  );
};

export default TutorAvailability;
