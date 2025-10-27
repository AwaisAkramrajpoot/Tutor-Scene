import React, { useState, useEffect } from 'react';

// Icons
const ArrowLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronLeftIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = (props) => (
  <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
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

const BookSession = ({ tutorData, onClose }) => {
  const [selectedDate, setSelectedDate] = useState('30');
  const [selectedHour, setSelectedHour] = useState('10.00 AM');
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleConfirmBooking = () => {
    setShowConfirmationModal(true);
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

  const DateCell = ({ date, active, onClick, disabled }) => (
    <button
      onClick={() => !disabled && onClick(date)}
      disabled={disabled}
      className={`w-8 h-8 text-sm rounded transition-colors font-medium ${
        disabled
          ? 'text-gray-400 cursor-not-allowed'
          : active
          ? 'bg-amber-500 text-white shadow-md'
          : 'text-gray-900 hover:bg-blue-50'
      }`}
    >
      {date}
    </button>
  );

  const TimeButton = ({ time, active, onClick }) => (
    <button
      onClick={() => onClick(time)}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
        active
          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      }`}
    >
      {time}
    </button>
  );

  const Calendar = ({ selectedDate, setSelectedDate }) => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    // June 2025 calendar - starts on Sunday
    const dates = [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30
    ];

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 text-gray-700">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <h3 className="text-lg font-semibold">June 2025</h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRightIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
          {dates.map((date, index) => (
            <div key={index} className="flex justify-center items-center">
              <DateCell
                date={date.toString()}
                active={selectedDate === date.toString()}
                onClick={setSelectedDate}
                disabled={false}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

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

              {/* Select Date Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                <Calendar selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
              </div>

              {/* Select Hour Section */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Hour</h3>
                <div className="grid grid-cols-3 gap-2">
                  {tutorData.timeSlots.map((time) => (
                    <TimeButton
                      key={time}
                      time={time}
                      active={selectedHour === time}
                      onClick={setSelectedHour}
                    />
                  ))}
                </div>
              </div>

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
                    <span className="text-gray-600">Session Duration</span>
                    <span className="text-gray-900">1 hour</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hourly Rate</span>
                    <span className="text-gray-900">${tutorData.rate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900">$5</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-semibold text-gray-900">${tutorData.rate + 5}</span>
                  </div>
                </div>

                {/* Selected Session Display */}
                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckIcon className="text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Selected Session</p>
                      <p className="text-sm text-blue-700">Monday, June 30, 2025</p>
                      <p className="text-sm text-blue-700">{selectedHour}</p>
                    </div>
                  </div>
                </div>

                {/* Confirm Booking Button */}
                <button
                  onClick={handleConfirmBooking}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Confirm Booking
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
