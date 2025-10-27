import React, { useState, useCallback } from 'react';

// --- Icon Components (Replacing Lucide/FontAwesome for self-containment) ---

// Mic Icon (Mute/Unmute state)
const MicIcon = ({ isToggled }) => (
    <svg className="w-6 h-6" viewBox="0 0 24 24"
         stroke={isToggled ? 'white' : 'currentColor'}
         fill="none"
    >
        {isToggled ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3zM1 1l22 22" />
        )}
    </svg>
);

// Video Icon (On/Off state)
const VideoIcon = ({ isToggled }) => (
    <svg className="w-6 h-6" viewBox="0 0 24 24"
         stroke={isToggled ? 'white' : 'currentColor'}
         fill="none"
    >
        {isToggled ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        ) : (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM1 1l22 22" />
        )}
    </svg>
);

// ScreenShare Icon
const ScreenShareIcon = ({ isToggled }) => (
    <svg className="w-6 h-6" viewBox="0 0 24 24"
         stroke={isToggled ? 'white' : 'currentColor'}
         fill="none"
    >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

// Chat Icon
const ChatIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
);

// End Call Icon
const EndCallIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
    </svg>
);

// Info Icon
const InfoIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// Book Icon
const BookIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.206 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.794 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.794 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.206 18 16.5 18s-3.332.477-4.5 1.253" />
    </svg>
);

// Check Icon
const CheckIcon = ({ size = 5 }) => (
    <svg className={`w-${size} h-${size} text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

// Radio Icon (for Pre-Session Checklist)
const RadioIcon = ({ checked, label }) => (
    <div className="flex items-start space-x-3 py-3">
        <div className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-md border-2 transition-all duration-200 ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
            {checked && <CheckIcon size={6} />}
        </div>
        <div>
            <p className={`font-medium ${checked ? 'text-gray-800' : 'text-gray-700'}`}>{label}</p>
            {/* The description for the checklist items is implied in the component using the image. Removed for simplicity. */}
        </div>
    </div>
);

// --- Session Room Live Call Component (Existing) ---

const initialMessages = [
    { sender: 'Sarah', time: '02:05 PM', text: "Hi there! Welcome to our session. How can I help you today?" },
    { sender: 'You', time: '02:06 PM', text: "Hi Sarah, I'm having trouble understanding quadratic equations and factoring." },
    { sender: 'Sarah', time: '02:07 PM', text: "No problem at all! We'll start with the basics. Look at the whiteboard I just shared." },
];

const SessionRoom = ({ onEndCall, onBackToDashboard }) => {
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [messages, setMessages] = useState(initialMessages);
    const [inputMessage, setInputMessage] = useState('');

    const toggleMic = useCallback(() => setIsMicOn(prev => !prev), []);
    const toggleVideo = useCallback(() => setIsVideoOn(prev => !prev), []);
    const toggleSharing = useCallback(() => setIsScreenSharing(prev => !prev), []);
    const toggleChat = useCallback(() => setIsChatOpen(prev => !prev), []);

    const handleSendMessage = useCallback(() => {
        if (inputMessage.trim() === '') return;
        setMessages(prev => [
            ...prev,
            { sender: 'You', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text: inputMessage }
        ]);
        setInputMessage('');
    }, [inputMessage]);

    const baseControlClass = "p-3 rounded-full transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50";

    const mainGridClasses = isChatOpen
        ? "grid grid-cols-1 lg:grid-cols-3 gap-6"
        : "flex flex-col";
    
    const videoFeedClasses = isChatOpen 
        ? "lg:col-span-2" 
        : "w-full";

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            {/* Header */}
            <header className="bg-white shadow-md rounded-b-xl sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={onBackToDashboard}
                            className="p-2 text-blue-600 hover:bg-gray-100 rounded-full transition duration-150"
                            aria-label="Back to Dashboard"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-extrabold text-gray-800">Live Tutoring Session</h1>
                    </div>
                    
                    {/* Session Info & Timer */}
                    <div className="flex items-center space-x-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-blue-600">Mathematics Session</p>
                            <p className="text-xs text-gray-500">02:00 PM - 03:00 PM</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold shadow-md">
                            00:15:30
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full">
                <div className={mainGridClasses}>
                    {/* Main Content Area (Video Feed + Controls) */}
                    <div className={videoFeedClasses}>
                        {/* Main Video/Screen Share Feed */}
                        <div className={`bg-gray-900 rounded-2xl shadow-xl aspect-video relative overflow-hidden transition-all duration-300 ${isScreenSharing ? 'border-4 border-yellow-400' : ''}`}>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center mx-auto mb-4 border-2 border-white">
                                        <span className="text-2xl font-bold text-white">SM</span>
                                    </div>
                                    <p className="text-white font-medium text-xl">Sarah Mitchell</p>
                                    <p className="text-gray-400 text-sm">{isScreenSharing ? "Sharing Screen: Quadratic Equations" : "Tutor"}</p>
                                </div>
                            </div>
                            
                            {/* Student Video (Small PiP) */}
                            <div className="absolute bottom-4 right-4 w-32 h-20 sm:w-40 sm:h-24 bg-gray-700 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-1">
                                            <span className="text-xs font-bold text-white">Y</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 flex justify-center space-x-3 sm:space-x-6">
                            <button 
                                onClick={toggleMic}
                                className={`${baseControlClass} ${isMicOn ? 'bg-blue-600 text-white shadow-blue-500/50' : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-red-500/50'}`}
                                title={isMicOn ? "Mute" : "Unmute"}
                            >
                                <MicIcon isToggled={isMicOn} />
                            </button>

                            <button 
                                onClick={toggleVideo}
                                className={`${baseControlClass} ${isVideoOn ? 'bg-blue-600 text-white shadow-blue-500/50' : 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-300 shadow-red-500/50'}`}
                                title={isVideoOn ? "Turn Off Camera" : "Turn On Camera"}
                            >
                                <VideoIcon isToggled={isVideoOn} />
                            </button>

                            <button 
                                onClick={toggleSharing}
                                className={`${baseControlClass} ${isScreenSharing ? 'bg-yellow-500 text-white focus:ring-yellow-300 shadow-yellow-500/50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300'}`}
                                title={isScreenSharing ? "Stop Sharing" : "Start Sharing"}
                            >
                                <ScreenShareIcon isToggled={isScreenSharing} />
                            </button>
                            
                            <button 
                                onClick={toggleChat}
                                className={`lg:hidden ${baseControlClass} ${isChatOpen ? 'bg-blue-600 text-white shadow-blue-500/50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-300'}`}
                                title={isChatOpen ? "Hide Chat" : "Show Chat"}
                            >
                                <ChatIcon />
                            </button>

                            <button 
                                onClick={onEndCall}
                                className={`${baseControlClass} bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-red-500/50`}
                                title="End Call"
                            >
                                <EndCallIcon />
                            </button>
                        </div>
                    </div>

                    {/* Chat Sidebar (Same as before) */}
                    <div className={`fixed inset-y-0 right-0 z-20 w-80 lg:w-auto lg:static lg:block transition-transform duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} bg-white rounded-xl shadow-2xl lg:shadow-md flex flex-col max-h-full lg:max-h-full`}>
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <ChatIcon className="text-blue-600" />
                                <h2 className="font-extrabold text-lg text-gray-800">Session Chat</h2>
                            </div>
                            <button 
                                onClick={toggleChat}
                                className="lg:hidden p-1 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-100"
                                aria-label="Close Chat"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex-1 p-4 overflow-y-auto space-y-4">
                            {messages.map((msg, index) => (
                                <div 
                                    key={index}
                                    className={`flex items-start space-x-2 ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.sender !== 'You' && (
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-medium text-blue-600">
                                                {msg.sender.charAt(0)}
                                            </span>
                                        </div>
                                    )}
                                    <div className={`rounded-xl p-3 max-w-[75%] shadow-sm ${msg.sender === 'You' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                                        <p className="text-sm leading-snug">{msg.text}</p>
                                        <p className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-blue-200' : 'text-gray-500'} ${msg.sender === 'You' ? 'text-right' : 'text-left'}`}>
                                            {msg.time}
                                        </p>
                                    </div>
                                    {msg.sender === 'You' && (
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-medium text-gray-600">
                                                Y
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <div className="p-4 border-t border-gray-200">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150"
                                />
                                <button 
                                    onClick={handleSendMessage}
                                    className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition duration-150 shadow-md"
                                    aria-label="Send Message"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-extrabold text-gray-800 mb-4 border-b pb-2">Session Summary</h2>
                    <dl className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 text-sm">
                        <div>
                            <dt className="font-medium text-gray-500">Tutor</dt>
                            <dd className="mt-1 text-gray-900 font-semibold">Sarah Mitchell</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Subject</dt>
                            <dd className="mt-1 text-gray-900 font-semibold">Mathematics</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Date/Time</dt>
                            <dd className="mt-1 text-gray-900">Oct 20, 2025 at 2:00 PM</dd>
                        </div>
                        <div>
                            <dt className="font-medium text-gray-500">Duration</dt>
                            <dd className="mt-1 text-gray-900">1 hour</dd>
                        </div>
                    </dl>
                </div>

                {!isChatOpen && (
                    <button 
                        onClick={toggleChat}
                        className="fixed bottom-4 right-4 p-4 bg-blue-600 text-white rounded-full shadow-2xl z-30 lg:hidden hover:bg-blue-700 transition duration-150"
                        title="Open Chat"
                    >
                        <ChatIcon />
                    </button>
                )}
            </main>
            {isChatOpen && (
                <div 
                    onClick={toggleChat}
                    className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
                    aria-hidden="true"
                ></div>
            )}
        </div>
    );
};

// --- New Pre-Session Page Component (Matches User Image) ---

const PreSessionPage = ({ onJoinSession, onBack }) => {
    // Mock state for checklist items
    const [checklist, setChecklist] = useState({
        camera: true,
        microphone: false,
        internet: true,
        materials: false,
    });

    const isJoinEnabled = Object.values(checklist).every(item => item === true);

    const toggleChecklistItem = (key) => {
        setChecklist(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };
    
    // Placeholder image for the tutor's profile picture
    const tutorProfileUrl = "https://placehold.co/80x80/2563EB/FFFFFF?text=SM";

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Header section (Blue Gradient) */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white pt-8 pb-32 rounded-b-xl shadow-lg">
                <div className="max-w-6xl mx-auto px-4">
                    <button 
                        onClick={onBack}
                        className="flex items-center text-sm font-medium hover:text-blue-200 transition duration-150 mb-8"
                    >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to My Sessions
                    </button>
                    <h1 className="text-4xl font-extrabold text-center mt-4">Join Session</h1>
                    <p className="text-blue-100 text-center mt-1">Get ready for your learning session</p>
                </div>
            </div>

            {/* Main Content (Offset from header) */}
            <div className="max-w-6xl mx-auto px-4 -mt-24 pb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column (Session Details) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tutor and Session Overview Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl">
                            <div className="flex items-center space-x-4 border-b pb-4 mb-4">
                                <img src={tutorProfileUrl} 
                                     alt="Sarah Mitchell" 
                                     className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 shadow-md"
                                     onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/80x80/2563EB/FFFFFF?text=SM" }}
                                />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Sarah Mitchell</h2>
                                    <div className="flex space-x-2 mt-1">
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">Mathematics</span>
                                        <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Physics</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 mt-2 space-x-3">
                                        <span className="flex items-center">
                                            <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h.01M16 11h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Monday, October 20, 2025
                                        </span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-sm">2:30 p.m. EST</span>
                                        <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full ml-auto">60 minutes</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Session Countdown */}
                            <div className="flex items-center bg-blue-50 p-3 rounded-lg text-blue-800 font-semibold text-sm shadow-inner mt-4">
                                <InfoIcon />
                                <span className="ml-3">Session starts in <span className="font-extrabold">74 hours 47 minutes</span></span>
                            </div>
                        </div>

                        {/* Session Notes Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl">
                            <h3 className="flex items-center text-lg font-bold text-gray-800 mb-3">
                                <BookIcon />
                                <span className="ml-2">Session Notes</span>
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                Today we will cover **quadratic equations** and practice solving problems. Please have your notebook and calculator ready.
                            </p>
                        </div>
                        
                        {/* Materials Needed Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl">
                            <h3 className="flex items-center text-lg font-bold text-gray-800 mb-3">
                                <BookIcon />
                                <span className="ml-2">Materials Needed</span>
                            </h3>
                            <ul className="space-y-2 text-gray-700 list-disc list-inside ml-2">
                                <li>Algebra textbook - Chapter 5</li>
                                <li>Practice worksheet (sent via email)</li>
                                <li>Calculator</li>
                                <li>Notebook and pen</li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column (Checklist and Join Button) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Pre-Session Checklist Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-xl">
                            <h3 className="flex items-center text-lg font-bold text-gray-800 mb-4">
                                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Pre-Session Checklist
                            </h3>
                            <div className="space-y-2">
                                <div onClick={() => toggleChecklistItem('camera')} className="cursor-pointer">
                                    <RadioIcon checked={checklist.camera} label="Camera is working" />
                                </div>
                                <div onClick={() => toggleChecklistItem('microphone')} className="cursor-pointer">
                                    <RadioIcon checked={checklist.microphone} label="Microphone is working" />
                                </div>
                                <div onClick={() => toggleChecklistItem('internet')} className="cursor-pointer">
                                    <RadioIcon checked={checklist.internet} label="Stable internet connection" />
                                </div>
                                <div onClick={() => toggleChecklistItem('materials')} className="cursor-pointer">
                                    <RadioIcon checked={checklist.materials} label="Materials ready" />
                                </div>
                            </div>
                        </div>

                        {/* Join Button */}
                        <div>
                            <button
                                onClick={onJoinSession}
                                disabled={!isJoinEnabled}
                                className={`w-full py-3 px-4 text-white font-bold rounded-xl text-lg transition duration-200 shadow-lg ${isJoinEnabled 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-500/50' 
                                    : 'bg-gray-400 cursor-not-allowed shadow-gray-300/50'
                                }`}
                            >
                                Join Zoom Session
                            </button>
                            <p className="text-center text-sm text-gray-500 mt-3">
                                Complete the checklist to join
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main App Component (Handles "Routing") ---
const App = () => {
    // Start on the pre-session page
    const [currentPage, setCurrentPage] = useState('pre-session'); 

    const handleJoinSession = () => {
        // Transition from pre-session page to live session room
        setCurrentPage('live-session');
    };

    const handleEndCall = () => {
        // Transition from live session room back to the pre-session page for continuity
        setCurrentPage('pre-session');
    };

    const handleBack = () => {
        // In a real app, this would navigate to a 'My Sessions' list. 
        // We'll keep it on the pre-session page for simulation purposes.
        setCurrentPage('pre-session');
    }

    // Simple page switching logic (simulating react-router-dom)
    switch (currentPage) {
        case 'live-session':
            return <SessionRoom onEndCall={handleEndCall} onBackToDashboard={handleBack} />;
        case 'pre-session':
        default:
            return <PreSessionPage onJoinSession={handleJoinSession} onBack={handleBack} />;
    }
}

export default App;
