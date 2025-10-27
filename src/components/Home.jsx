import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-400 via-blue-500 to-blue-700 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-20 h-20 bg-blue-300 rounded-full opacity-20"></div>
          <div className="absolute top-40 right-20 w-16 h-16 bg-blue-300 rounded-full opacity-30"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-blue-300 rounded-full opacity-25"></div>
          <div className="absolute top-60 right-1/3 w-8 h-8 bg-blue-300 rounded-full opacity-40"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Content */}
            <div className="space-y-8">
              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="text-white">Empowering</span>
                  <br />
                  <span className="text-yellow-400">Learning</span>
                  <br />
                  <span className="text-white">Through Connection.</span>
                </h1>
              </div>

              {/* Sub-text */}
              <p className="text-xl text-blue-100 max-w-lg">
                Tutor Scene helps students and tutors connect securely for live, interactive lessons that inspire success.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors">
                  I'm a Student / Parent
                </button>
                <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg border-2 border-blue-600 transition-colors">
                  I'm a Tutor
                </button>
              </div>

              {/* Feature Icons */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Public Speaking</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Career-Oriented</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Creative Thinking</span>
                </div>
              </div>
            </div>

            {/* Right Side - Student Image and Statistics */}
            <div className="relative">
              {/* Student Image Placeholder */}
              <div className="relative">
                <div className="w-full h-96 bg-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    <p className="text-sm">Student Image Placeholder</p>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">20+</div>
                  <div className="text-sm text-gray-600">Verified Tutors</div>
                </div>
              </div>

              <div className="absolute top-1/2 -right-8 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">10K+</div>
                  <div className="text-sm text-gray-600">Successful Lessons</div>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">250+</div>
                  <div className="text-sm text-gray-600">Subjects</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Get started in three simple steps</p>
          </div>

          {/* Three Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 - Search & Browse */}
            <Link to="/find-tutors" className="block bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Search & Browse</h3>
                <p className="text-gray-600 mb-6">
                  Find tutors by subject, price, and availability. Read reviews and compare profiles.
                </p>
                <span className="text-blue-600 hover:text-blue-800 font-medium">
                  Learn More &gt;
                </span>
              </div>
            </Link>

            {/* Card 2 - Book a Session */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Book a Session</h3>
                <p className="text-gray-600 mb-6">
                  Choose a time that works for you and schedule your first lesson instantly.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                  Learn More &gt;
                </a>
              </div>
            </div>

            {/* Card 3 - Start Learning */}
            <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Start Learning</h3>
                <p className="text-gray-600 mb-6">
                  Connect with your tutor online and start your learning journey from anywhere.
                </p>
                <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                  Learn More &gt;
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Features Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-900 mb-4">Our Features</h2>
            <p className="text-xl text-gray-600">Discover powerful tools that make online learning simple, engaging, and effective.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Video Call Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                {/* Video Call Window */}
                <div className="bg-gray-100 rounded-lg p-6">
                  {/* Window Controls */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  
                  {/* Video Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-blue-200 rounded-lg p-2 text-center">
                      <div className="w-8 h-8 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Every How</p>
                    </div>
                    <div className="bg-blue-200 rounded-lg p-2 text-center">
                      <div className="w-8 h-8 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Tavara Clu</p>
                    </div>
                    <div className="bg-blue-200 rounded-lg p-2 text-center">
                      <div className="w-8 h-8 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Adam Levin</p>
                    </div>
                    <div className="bg-blue-200 rounded-lg p-2 text-center">
                      <div className="w-8 h-8 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Herbert Hali</p>
                    </div>
                    <div className="bg-blue-200 rounded-lg p-2 text-center">
                      <div className="w-8 h-8 bg-blue-400 rounded-full mx-auto mb-1"></div>
                      <p className="text-xs text-gray-600">Patricia Mendoza</p>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Present
                    </button>
                    <button className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Call
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Floating Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full opacity-60"></div>
              <div className="absolute top-1/2 -left-4 w-6 h-6 bg-blue-400 rounded-full opacity-40"></div>
              <div className="absolute -bottom-4 left-1/4 w-4 h-4 bg-orange-400 rounded-full opacity-50"></div>
            </div>

            {/* Right Side - User Experience Features */}
            <div className="space-y-8">
              <h3 className="text-3xl font-bold text-blue-900 mb-8">A user experience built for learning</h3>
              
              <div className="space-y-6">
                {/* Students Feature */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Students</h4>
                    <p className="text-gray-600">Students can easily connect with verified tutors in real time.</p>
                  </div>
                </div>

                {/* Tutors Feature */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Tutors</h4>
                    <p className="text-gray-600">Tutors can manage sessions, availability, and lesson plans effortlessly.</p>
                  </div>
                </div>

                {/* Parents Feature */}
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Parents</h4>
                    <p className="text-gray-600">Parents can track progress and communicate directly with tutors.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Tools Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">Smart Tools for Students & Tutors</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Tutor Scene offers powerful tools to make online learning simple and effective. Students can book lessons, access materials, and track progress — while tutors manage sessions, share resources, and communicate seamlessly in real time.
              </p>
            </div>

            {/* Right Side - Thoughtful Student Image */}
            <div className="relative">
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-sm">Thoughtful Student Image Placeholder</p>
                </div>
              </div>
              
              {/* Floating Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-blue-400 rounded-full opacity-60"></div>
              <div className="absolute top-1/2 -left-6 w-8 h-8 bg-yellow-400 rounded-lg opacity-50"></div>
              <div className="absolute -bottom-4 left-1/4 w-6 h-6 bg-orange-400 rounded-full opacity-40"></div>
              <div className="absolute top-1/4 -right-8 w-4 h-4 bg-green-400 rounded-full opacity-70"></div>
            </div>
          </div>
        </div>
      </div>

      {/* One-on-One Learning Sessions Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Private Session Interface */}
            <div className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                {/* Private Session Window */}
                <div className="bg-gray-100 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Private Session</h4>
                    <button className="bg-red-500 text-white px-3 py-1 rounded text-sm">
                      End Session
                    </button>
                  </div>
                  
                  {/* Two Video Feeds */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-200 rounded-lg p-4 text-center">
                      <div className="w-16 h-16 bg-blue-400 rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Student</p>
                    </div>
                    <div className="bg-blue-200 rounded-lg p-4 text-center">
                      <div className="w-16 h-16 bg-blue-400 rounded-full mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Tutor</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background Blurred Window */}
              <div className="absolute -z-10 top-4 left-4 w-full h-full bg-gray-300 rounded-2xl opacity-50"></div>
            </div>

            {/* Right Side - Content */}
            <div>
              <h2 className="text-4xl font-bold text-blue-900 mb-6">One-on-One Learning Sessions</h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Students can connect privately with their tutors for focused, personalized lessons. Each session is secure, distraction-free, and designed to help learners reach their goals faster.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonial Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Side - Content */}
            <div>
              <div className="mb-4">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">TESTIMONIAL</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">What Our Learners Say</h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Tutor Scene has earned the trust of thousands of students and tutors around the world. Our platform has helped learners achieve their goals and tutors grow their teaching careers. Have you joined Tutor Scene yet? We'd love to hear your experience!
              </p>
              <button className="bg-white text-blue-600 hover:bg-gray-50 font-semibold py-3 px-6 rounded-lg border-2 border-blue-600 transition-colors flex items-center">
                Write Your Review
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Side - Testimonial Card and Image */}
            <div className="relative">
              {/* Student Image */}
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                <div className="text-center text-gray-600">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <p className="text-sm">Student Image Placeholder</p>
                </div>
              </div>

              {/* Testimonial Card */}
              <div className="bg-white rounded-lg shadow-lg p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                
                <blockquote className="text-gray-700 mb-4 italic">
                  "Tutor Scene made finding the right tutor so easy! My lessons are interactive, flexible, and actually fun. I've improved more in a few weeks than I expected."
                </blockquote>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">Clara Rose</p>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">Tutor Scene for Students</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Get Started Section */}
      <div className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-8">Join Tutor Scene today and discover the perfect learning experience.</p>
          <button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg transition-colors flex items-center mx-auto">
            Find a Tutor Now
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
