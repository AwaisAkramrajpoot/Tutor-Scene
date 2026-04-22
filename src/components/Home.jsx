import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiRequest } from '../utils/api';

const Home = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [loadingTestimonials, setLoadingTestimonials] = useState(true);

  const goFindTutor = () => {
    const raw = localStorage.getItem('user');
    if (!raw) {
      navigate('/signup');
      return;
    }
    navigate('/find-tutors');
  };

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoadingTestimonials(true);
        const data = await apiRequest('/api/v1/testimonials', { method: 'GET' });
        const testimonialsList = Array.isArray(data) ? data : data.testimonials || data.data || [];
        setTestimonials(testimonialsList);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        // Keep empty array if fetch fails
        setTestimonials([]);
      } finally {
        setLoadingTestimonials(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Navigate to next testimonial
  const handleNextTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentTestimonialIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }
  };

  // Navigate to previous testimonial
  const handlePrevTestimonial = () => {
    if (testimonials.length > 0) {
      setCurrentTestimonialIndex((prevIndex) => 
        prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
      );
    }
  };

  const currentTestimonial = testimonials[currentTestimonialIndex];

  return (
    <div className="min-h-screen">
      <div className="relative bg-brand-dark-blue text-white overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-8 w-32 h-32 rounded-full bg-brand-light-blue/15 blur-2xl" />
          <div className="absolute bottom-16 right-10 w-40 h-40 rounded-full bg-brand-medium-blue/20 blur-3xl" />
          <div className="absolute top-40 right-1/4 w-24 h-24 rounded-full border border-brand-gold/20" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 md:pt-10 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                  <span className="text-white">Empowering </span>
                  <span className="text-brand-gold">Learning</span>
                  <span className="text-white"> Through Connection.</span>
                </h1>
              </div>

              <p className="text-lg sm:text-xl text-white/95 max-w-lg font-normal leading-relaxed">
                Tutor Scene helps learners and tutors connect securely for live, interactive lessons that inspire success.
              </p>

              <div>
                <button
                  type="button"
                  onClick={goFindTutor}
                  className="inline-flex items-center justify-center min-w-[14rem] sm:min-w-[17rem] bg-white text-brand-gold border-2 border-brand-gold px-10 sm:px-14 py-3.5 rounded-lg text-lg font-normal shadow-md hover:bg-brand-medium-blue hover:text-white transition-colors"
                >
                  Find a Tutor
                </button>
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {/* <div
                  className="absolute inset-[4%] rounded-full bg-brand-gold shadow-lg"
                  aria-hidden
                /> */}
                {/* <div className="relative z-10 w-[78%] h-[78%] rounded-full overflow-hidden ring-4 ring-white/40 shadow-2xl"> */}
                <div className="">
                  <img
                    src="/images/homebannerheader.png"
                    alt="Student learning with Tutor Scene"
                    className="w-full h-full object-cover object-center"
                    width={640}
                    height={640}
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white py-8 md:py-10 border-b border-brand-light-blue/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-medium-blue">
            Trusted Tutors
          </h2>
          <p className="mt-2 text-base md:text-lg font-normal text-brand-medium-blue/85">
            Vetted. Experienced. Learner focused.
          </p>
        </div>
      </section>

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
                    <button type="button" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-normal">
                      Present
                    </button>
                    <button type="button" className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-normal">
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
              <img 
                src="/images/studentHome.png" 
                alt="Thoughtful student learning" 
                className="w-full h-auto max-h-96 object-contain rounded-lg"
              />
              
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
                    <button type="button" className="bg-red-500 text-white px-3 py-1 rounded text-sm font-normal">
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
              <button type="button" className="bg-white text-brand-medium-blue hover:bg-gray-50 font-normal py-3 px-6 rounded-lg border-2 border-brand-medium-blue transition-colors flex items-center">
                Write Your Review
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Right Side - Testimonial Card and Image */}
            <div className="relative max-w-lg mx-auto lg:mx-0">
              {loadingTestimonials ? (
                <div className="flex items-center justify-center h-96">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : testimonials.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No testimonials available at the moment.</p>
                </div>
              ) : (
                <>
                  {/* Student Image with rounded corners */}
                  <div className="relative">
                    <img 
                      src="/images/testimonials.jpg" 
                      alt="Happy student with books" 
                      className="w-full h-auto rounded-3xl shadow-xl object-cover"
                    />
                    
                    {/* Navigation Arrows */}
                    <button 
                      onClick={handlePrevTestimonial}
                      className="absolute top-1/2 -left-4 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Previous testimonial"
                    >
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    <button 
                      onClick={handleNextTestimonial}
                      className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                      aria-label="Next testimonial"
                    >
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Testimonial Card - Overlapping bottom */}
                  <div className="relative -mt-32 mx-4 bg-white rounded-2xl shadow-2xl p-8 border-l-4 border-red-500">
                    <blockquote className="text-gray-600 mb-6 text-base leading-relaxed">
                      <i>"{currentTestimonial?.testimonial || 'No testimonial text available.'}"</i>
                    </blockquote>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-bold text-gray-900 text-sm ">
                          <i>{currentTestimonial?.testimonialBy || 'Anonymous'}</i>
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex text-yellow-400 mb-1 justify-end">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">Rated 5 Stars by Students</p>
                      </div>
                    </div>
                    
                    {/* Testimonial Indicator Dots */}
                    {testimonials.length > 1 && (
                      <div className="flex justify-center mt-4 space-x-2">
                        {testimonials.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentTestimonialIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              index === currentTestimonialIndex 
                                ? 'bg-blue-600 w-6' 
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to testimonial ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ready to Get Started Section */}
      <div className="bg-gradient-to-r from-brand-dark-blue via-brand-medium-blue to-brand-dark-blue py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-brand-light-blue mb-8">Join Tutor Scene today and discover the perfect learning experience.</p>
          <button
            type="button"
            onClick={goFindTutor}
            className="bg-white text-brand-dark-blue border-2 border-brand-gold hover:bg-brand-medium-blue hover:text-white font-normal py-4 px-10 sm:px-14 min-w-[14rem] sm:min-w-[17rem] justify-center rounded-lg transition-all shadow-lg inline-flex items-center mx-auto"
          >
            Find a Tutor
            <svg className="w-5 h-5 ml-2 shrink-0 text-inherit" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
