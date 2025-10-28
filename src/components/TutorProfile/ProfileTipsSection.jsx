import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const ProfileTipsSection = () => {
  const navigate = useNavigate();
  const [aboutMe, setAboutMe] = useState("");
  const [subjects, setSubjects] = useState("");
  const [hourlyRate, setHourlyRate] = useState("50");

  const maxAboutMeLength = 250;

  const profileTips = [
    "Use a professional, friendly photo where your face is clearly visible",
    "Highlight your qualifications, experience, and teaching philosophy",
    "Intro videos increase booking rates by 60% — show your personality!",
    "Research competitive rates for your subject and experience level",
  ];

  return (
    <div className="grid grid-cols-2 gap-8 w-full">
      {/* Left Column - Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {/* Title */}
        <h2 className="text-2xl font-normal text-[#101727] mb-8">
          Your Profile Information
        </h2>

        {/* Profile Photo */}
        <div className="mb-6">
          <label htmlFor="profile-photo" className="block text-base text-[#101727] mb-3 font-normal">
            Profile Photo
          </label>
          <div className="relative w-full h-64 rounded-xl border-2 border-dashed border-[#d0d5db] bg-white hover:border-[#4A8FCC] transition-colors">
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center"
              aria-label="Upload profile photo"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-4xl text-gray-400">👤</span>
              </div>
              <p className="text-base text-[#495565] mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-[#697282]">
                PNG, JPG up to 5MB
              </p>
            </button>
            <input
              type="file"
              id="profile-photo"
              className="sr-only"
              accept="image/png,image/jpeg"
              aria-label="Upload profile photo"
            />
          </div>
        </div>

        {/* About Me */}
        <div className="mb-6">
          <label htmlFor="about-me" className="block text-base text-[#101727] mb-3 font-normal">
            About Me
          </label>
          <textarea
            id="about-me"
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value.slice(0, maxAboutMeLength))}
            placeholder="Tell students about your teaching experience, approach, and what makes you a great tutor..."
            className="w-full h-32 px-4 py-3 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base resize-none focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
            maxLength={maxAboutMeLength}
            aria-describedby="about-me-count"
          />
          <div id="about-me-count" className="text-sm text-[#697282] mt-2">
            {aboutMe.length}/{maxAboutMeLength} characters
          </div>
        </div>

        {/* Subjects You Teach */}
        <div className="mb-6">
          <label htmlFor="subjects" className="block text-base text-[#101727] mb-3 font-normal">
            Subjects You Teach
          </label>
          <input
            type="text"
            id="subjects"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="e.g., Mathematics, English, Physics"
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
            aria-describedby="subjects-help"
          />
          <p id="subjects-help" className="text-sm text-[#697282] mt-2">
            Separate multiple subjects with commas
          </p>
        </div>

        {/* Hourly Rate */}
        <div className="mb-6">
          <label htmlFor="hourly-rate" className="block text-base text-[#101727] mb-3 font-normal">
            Hourly Rate (USD)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base font-medium pointer-events-none">
              $
            </span>
            <input
              type="number"
              id="hourly-rate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="w-full h-12 pl-10 pr-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
              min="0"
              step="1"
              aria-describedby="rate-help"
            />
          </div>
          <p id="rate-help" className="text-sm text-[#697282] mt-2">
            Average rate: $40-80/hour
          </p>
        </div>

        {/* Upload Intro Video */}
        <div className="mb-6">
          <label htmlFor="intro-video" className="block text-base text-[#101727] mb-3 font-normal">
            Upload Intro Video (Optional)
          </label>
          <div className="relative w-full h-56 rounded-xl border-2 border-dashed border-[#d0d5db] bg-white hover:border-[#4A8FCC] transition-colors">
            <button
              type="button"
              className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center"
              aria-label="Upload intro video"
            >
              <div className="w-16 h-16 flex items-center justify-center mb-3">
                <span className="text-5xl">📤</span>
              </div>
              <p className="text-base text-[#495565] mb-1">
                Upload a 1-minute intro video
              </p>
              <p className="text-sm text-[#697282]">
                MP4, MOV up to 100MB
              </p>
            </button>
            <input
              type="file"
              id="intro-video"
              className="sr-only"
              accept="video/mp4,video/quicktime"
              aria-label="Upload intro video"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          onClick={() => navigate('/verify-identity')}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#5BA3D8] to-[#1B5A94] text-white text-base font-medium hover:opacity-90 transition-opacity shadow-sm"
        >
          Save and Continue
        </button>
      </div>

      {/* Right Column - Image and Tips */}
      <div className="flex flex-col gap-6">
        {/* Hero Image Placeholder */}
        <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-md">
          <img
            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop"
            alt="Professional tutor"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl text-gray-400">📷</div>';
            }}
          />
        </div>

        {/* Profile Tips */}
        <div className="bg-gradient-to-b from-[#A8C7F0] to-[#4A8FCC] rounded-2xl p-8">
          <h3 className="text-white text-2xl font-normal mb-6">
            Profile Tips
          </h3>
          <ul className="space-y-5 list-none p-0 m-0">
            {profileTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#4A8FCC] text-xl font-medium">✓</span>
                </div>
                <p className="text-white/90 text-base leading-relaxed pt-2">
                  {tip}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Why This Matters */}
        <div className="bg-white border-2 border-[#E5B44C] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 flex items-center justify-center">
              <span className="text-3xl">📖</span>
            </div>
            <h3 className="text-[#101727] text-xl font-normal">
              Why This Matters
            </h3>
          </div>
          <p className="text-[#495565] text-base leading-relaxed">
            Your profile is the first impression students have of you. A complete, professional profile helps you stand out and attracts more bookings.
          </p>
        </div>
      </div>
    </div>
  );
};
