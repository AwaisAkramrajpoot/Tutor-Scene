import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Icons
const ArrowLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);



const CheckIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const CreditCardIcon = (props) => (
  <svg {...props} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const BookSession = ({ tutorData, bookingData, onClose }) => {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [notes, setNotes] = useState('');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Discount code state
  const [discountCode, setDiscountCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState(null); // { valid: boolean, message: string, discount: number }
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // Parse subjects from the booking data
  const subjects = bookingData?.subjects ? bookingData.subjects.split(',').map(s => s.trim()) : [];

  // Fetch availability data and transform to calendar events
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!bookingData?.userId) return;

      try {
        setLoadingAvailability(true);
        const availabilityData = await apiRequest(`/api/v1/availability/tutor/${bookingData.userId}`, 'GET');
        
        // Transform availability data to calendar events
        const events = availabilityData.map(slot => {
          const startDate = new Date(slot.startTime);
          const endDate = new Date(slot.endTime);
          
          // Format time for display
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
          
          return {
            id: `${slot.id}`,
            title: `${startTimeStr} - ${endTimeStr}`,
            start: slot.startTime,
            end: slot.endTime,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            textColor: '#ffffff',
            extendedProps: {
              availabilityId: slot.id,
              tutorProfileId: bookingData.tutorProfileId
            }
          };
        });
        
        setCalendarEvents(events);
      } catch (error) {
        console.error('Error fetching availability:', error);
        setBookingError('Failed to load tutor availability');
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [bookingData?.userId, bookingData?.tutorProfileId]);

  // Handle event click to select availability slot
  const handleEventClick = (info) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      tutorProfileId: event.extendedProps.tutorProfileId
    });
  };

  // Validate discount code
  const handleValidateDiscountCode = async () => {
    if (!discountCode.trim()) {
      setCodeValidation({ valid: false, message: 'Please enter a discount code' });
      return;
    }

    const serviceFee = 5;
    const totalAmount = tutorData.rate + serviceFee;

    setValidatingCode(true);
    setCodeValidation(null);

    try {
      const response = await apiRequest(
        `/api/v1/promo-codes/validate?code=${encodeURIComponent(discountCode.trim())}&amount=${totalAmount}`,
        'GET'
      );

      if (response.valid) {
        setCodeValidation({
          valid: true,
          message: 'Promo code applied successfully!',
          discount: response.discount || 0
        });
        setAppliedDiscount(response.discount || 0);
      } else {
        setCodeValidation({
          valid: false,
          message: response.message || 'Invalid promo code'
        });
        setAppliedDiscount(0);
      }
    } catch (err) {
      console.error('Failed to validate promo code:', err);
      setCodeValidation({
        valid: false,
        message: err.message || 'Failed to validate promo code'
      });
      setAppliedDiscount(0);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSubject) {
      setBookingError('Please select a subject');
      return;
    }

    if (!selectedEvent) {
      setBookingError('Please select an available time slot');
      return;
    }

    setIsBooking(true);
    setBookingError(null);

    try {
      // Get student profile ID from localStorage
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        setBookingError('User not authenticated. Please log in again.');
        setIsBooking(false);
        return;
      }
      
      const user = JSON.parse(userStr);
      const studentProfileId = user.id || user._id || user.userId;
      
      if (!studentProfileId) {
        setBookingError('Unable to identify user. Please log in again.');
        setIsBooking(false);
        return;
      }

      // Calculate total price (hourly rate + service fee)
      const serviceFee = 5;
      const totalPrice = tutorData.rate + serviceFee;

      // Prepare the booking payload
      // NOTE: Do NOT subtract appliedDiscount here - the backend will apply the discount
      const payload = {
        studentProfileId: parseInt(studentProfileId, 10),
        tutorProfileId: selectedEvent.tutorProfileId,
        subjectId: selectedSubject,
        startTime: new Date(selectedEvent.start).toISOString(),
        endTime: new Date(selectedEvent.end).toISOString(),
        totalPrice: totalPrice, // Send full price - backend applies discount
        notes: notes || undefined,
        discountCode: codeValidation?.valid ? discountCode.trim() : undefined
      };

      console.log('Booking payload:', payload);

      // Make the API call
      await apiRequest('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Show success modal
      setShowConfirmationModal(true);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Failed to book session. Please try again.');
    } finally {
      setIsBooking(false);
    }
  };

  // Auto-dismiss modal after 7 seconds
  useEffect(() => {
    if (showConfirmationModal) {
      const timer = setTimeout(() => {
        setShowConfirmationModal(false);
        onClose(); // Close the booking component and return to tutor profile
      }, 7000);

      return () => clearTimeout(timer);
    }
  }, [showConfirmationModal, onClose]);



  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-sm mx-4 transform transition-all duration-300 ease-in-out">
            {/* Checkmark Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-blue-600 text-center mb-3">
              Booking confirmed!
            </h2>

            {/* Subtitle */}
            <p className="text-gray-600 text-center text-base">
              You will receive a confirmation email shortly.
            </p>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={onClose}
              className="flex items-center text-white text-base font-medium hover:text-blue-200 transition-colors"
            >
              <ArrowLeftIcon className="mr-2" />
              Back to Search
            </button>
            <h1 className="text-3xl font-bold">Book a Session</h1>
            <div></div> {/* Empty div for centering */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column - Session Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Tutor Profile Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                    <img
                      src="https://placehold.co/64x64/E0E0E0/333333?text=SM"
                      alt="Sarah Mitchell"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{tutorData.name}</h3>
                    <div className="flex space-x-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Mathematics
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Physics
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loadingAvailability && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading availability...</span>
                  </div>
                </div>
              )}

              {/* Calendar Section */}
              {!loadingAvailability && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Available Time Slot</h3>
                  <p className="text-sm text-gray-500 mb-4">Click on a green time slot to select it for booking</p>
                  <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="timeGridWeek"
                    headerToolbar={{
                      left: 'prev,next today',
                      center: 'title',
                      right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    slotMinTime="06:00:00"
                    slotMaxTime="22:00:00"
                    slotDuration="00:30:00"
                    selectable={false}
                    selectMirror={false}
                    dayMaxEvents={true}
                    weekends={true}
                    allDaySlot={false}
                    height="auto"
                    displayEventTime={false}
                    events={calendarEvents}
                    eventClick={handleEventClick}
                    eventClassNames="cursor-pointer"
                  />
                </div>
              )}

              {/* Empty state when no availability */}
              {!loadingAvailability && calendarEvents.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">This tutor has no available time slots at the moment.</p>
                </div>
              )}

              {/* Select Subject Section */}
              {subjects.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Subject</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.map((subject, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedSubject(index + 1)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${selectedSubject === index + 1
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {subject}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., I need help with calculus"
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                />
              </div>

              {/* Discount Code Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discount Code (Optional)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value.toUpperCase());
                      setCodeValidation(null);
                    }}
                    placeholder="Enter promo code"
                    className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  />
                  <button
                    onClick={handleValidateDiscountCode}
                    disabled={validatingCode || !discountCode.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {validatingCode ? 'Validating...' : 'Apply'}
                  </button>
                </div>
                
                {/* Validation Message */}
                {codeValidation && (
                  <div className={`mt-3 p-3 rounded-lg ${codeValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <p className={`text-sm ${codeValidation.valid ? 'text-green-800' : 'text-yellow-800'}`}>
                      {codeValidation.message}
                    </p>
                    {codeValidation.valid && codeValidation.discount > 0 && (
                      <p className="text-sm text-green-700 font-medium mt-1">
                        You save ${codeValidation.discount.toFixed(2)}!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {bookingError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{bookingError}</p>
                </div>
              )}

              {/* Payment Method Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <CreditCardIcon className="text-amber-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Credit / Debit Card</h4>
                      <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Booking Summary */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate</span>
                    <span className="text-gray-900">${tutorData.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900">$5</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-medium">Discount</span>
                      <span className="font-medium">-${appliedDiscount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">
                      ${(tutorData.rate + 5 - appliedDiscount).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Selected Session Display */}
                {selectedEvent && selectedSubject && (
                  <div className="mt-6 bg-green-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <CheckIcon className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-900">Selected Session</p>
                          <p className="text-sm text-green-700">
                            {new Date(selectedEvent.start).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-sm text-green-700">{selectedEvent.title}</p>
                          <p className="text-sm text-green-700 font-medium mt-1">
                            Subject: {subjects[selectedSubject - 1]}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Validation Message */}
                {(!selectedEvent || !selectedSubject) && (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                      Please select:
                      {!selectedEvent && ' a time slot from the calendar'}
                      {!selectedSubject && ', a subject'}
                    </p>
                  </div>
                )}

                {/* Confirm Booking Button */}
                <button
                  onClick={handleConfirmBooking}
                  disabled={isBooking || !selectedSubject || !selectedEvent}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isBooking ? 'Booking...' : 'Confirm Booking'}
                </button>

                {/* Disclaimer */}
                <p className="text-xs text-gray-500 mt-4 text-center">
                  You won't be charged until the tutor confirms the session
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSession;
