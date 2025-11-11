import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { uploadOnboardingFile, apiRequest } from "../../utils/api";
import { getTutorOnboarding, setTutorOnboarding } from "../../utils/onboarding";

export const ProfileTipsSection = () => {
  const navigate = useNavigate();
  const [aboutMe, setAboutMe] = useState("");
  const [subjects, setSubjects] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isSubjectsDropdownOpen, setIsSubjectsDropdownOpen] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const subjectsDropdownRef = useRef(null);
  const [gradeLevels, setGradeLevels] = useState("");
  const [selectedGradeLevels, setSelectedGradeLevels] = useState([]);
  const [availableGradeLevels, setAvailableGradeLevels] = useState([]);
  const [isGradeLevelsDropdownOpen, setIsGradeLevelsDropdownOpen] = useState(false);
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(false);
  const gradeLevelsDropdownRef = useRef(null);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedCV, setSelectedCV] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, video: false, cv: false });
  const [uploadedUrls, setUploadedUrls] = useState({ profilePic: "", introVideo: "", cv: "" });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        const response = await apiRequest('/api/v1/subjects');
        const subjectsList = response.subjects || response.data || response || [];
        setAvailableSubjects(subjectsList);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      } finally {
        setLoadingSubjects(false);
      }
    };

    const fetchGradeLevels = async () => {
      try {
        setLoadingGradeLevels(true);
        const response = await apiRequest('/api/v1/grade-levels');
        const gradeLevelsList = response.gradeLevels || response.data || response || [];
        setAvailableGradeLevels(gradeLevelsList);
      } catch (error) {
        console.error('Failed to fetch grade levels:', error);
      } finally {
        setLoadingGradeLevels(false);
      }
    };

    fetchSubjects();
    fetchGradeLevels();

    const saved = getTutorOnboarding();
    if (saved.teachingPhilosophy) setAboutMe(saved.teachingPhilosophy);
    if (saved.subjects) {
      setSubjects(saved.subjects);
      // Parse saved subjects and match with available subjects
      const savedSubjectNames = saved.subjects.split(',').map(s => s.trim());
      setSelectedSubjects(savedSubjectNames);
    }
    if (saved.gradeLevels) {
      setGradeLevels(saved.gradeLevels);
      const savedGradeLevelNames = saved.gradeLevels.split(',').map(s => s.trim());
      setSelectedGradeLevels(savedGradeLevelNames);
    }
    if (saved.yearsOfExperience) setYearsOfExperience(String(saved.yearsOfExperience));
    if (saved.fullName) setFullName(saved.fullName);
    if (saved.dateOfBirth) setDateOfBirth(saved.dateOfBirth);
    if (saved.interviewTime) setInterviewTime(saved.interviewTime);
    if (saved.hourlyRate) setHourlyRate(String(saved.hourlyRate));
    if (saved.profilePic) { setUploadedUrls((u)=>({ ...u, profilePic: saved.profilePic })); setPhotoPreview(saved.profilePic); }
    if (saved.cv) setUploadedUrls((u)=>({ ...u, cv: saved.cv }));
    if (saved.introVideo) setUploadedUrls((u)=>({ ...u, introVideo: saved.introVideo }));
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subjectsDropdownRef.current && !subjectsDropdownRef.current.contains(event.target)) {
        setIsSubjectsDropdownOpen(false);
      }
      if (gradeLevelsDropdownRef.current && !gradeLevelsDropdownRef.current.contains(event.target)) {
        setIsGradeLevelsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update subjects string when selectedSubjects changes
  useEffect(() => {
    const subjectsString = selectedSubjects.join(', ');
    setSubjects(subjectsString);
  }, [selectedSubjects]);

  // Update grade levels string when selectedGradeLevels changes
  useEffect(() => {
    const gradeLevelsString = selectedGradeLevels.join(', ');
    setGradeLevels(gradeLevelsString);
  }, [selectedGradeLevels]);

  const maxAboutMeLength = 250;

  const toggleSubject = (subjectName) => {
    setSelectedSubjects(prev => {
      if (prev.includes(subjectName)) {
        return prev.filter(s => s !== subjectName);
      } else {
        return [...prev, subjectName];
      }
    });
  };

  const removeSubject = (subjectName) => {
    setSelectedSubjects(prev => prev.filter(s => s !== subjectName));
  };

  const toggleGradeLevel = (gradeLevelName) => {
    setSelectedGradeLevels(prev => {
      if (prev.includes(gradeLevelName)) {
        return prev.filter(g => g !== gradeLevelName);
      } else {
        return [...prev, gradeLevelName];
      }
    });
  };

  const removeGradeLevel = (gradeLevelName) => {
    setSelectedGradeLevels(prev => prev.filter(g => g !== gradeLevelName));
  };

  const handlePhotoClick = () => {
    document.getElementById('profile-photo').click();
  };

  const handleVideoClick = () => {
    document.getElementById('intro-video').click();
  };

  const handlePhotoDragOver = (e) => {
    e.preventDefault();
    setIsDraggingPhoto(true);
  };

  const handlePhotoDragLeave = () => {
    setIsDraggingPhoto(false);
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setIsDraggingPhoto(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handlePhotoFile(files[0]);
    }
  };

const handlePhotoFile = async (file) => {
  setSelectedPhoto(file);
  // Quick local preview
  const reader = new FileReader();
  reader.onloadend = () => {
    setPhotoPreview(reader.result);
  };
  reader.readAsDataURL(file);
  // Upload to S3 via API
  try {
    setUploading((u) => ({ ...u, photo: true }));
    const res = await uploadOnboardingFile(file);
    const url = res.url || res.Location || res.fileUrl || res.data?.url;
    if (!url) throw new Error('No URL returned from upload');
    setUploadedUrls((u) => ({ ...u, profilePic: url }));
    setTutorOnboarding({ profilePic: url });
  } catch (e) {
    console.error(e);
    alert('Failed to upload profile photo.');
  } finally {
    setUploading((u) => ({ ...u, photo: false }));
  }
};

  const handleVideoDragOver = (e) => {
    e.preventDefault();
    setIsDraggingVideo(true);
  };

  const handleVideoDragLeave = () => {
    setIsDraggingVideo(false);
  };

  const handleVideoDrop = (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleVideoFile(files[0]);
    }
  };

const handleVideoFile = async (file) => {
  setSelectedVideo(file);
  try {
    setUploading((u) => ({ ...u, video: true }));
    const res = await uploadOnboardingFile(file);
    const url = res.url || res.Location || res.fileUrl || res.data?.url;
    if (!url) throw new Error('No URL returned from upload');
    setUploadedUrls((u) => ({ ...u, introVideo: url }));
    setTutorOnboarding({ introVideo: url });
  } catch (e) {
    console.error(e);
    alert('Failed to upload video.');
  } finally {
    setUploading((u) => ({ ...u, video: false }));
  }
};

  const handleCVClick = () => {
    document.getElementById('cv-upload').click();
  };

  const handleCVDragOver = (e) => {
    e.preventDefault();
    setIsDraggingCV(true);
  };

  const handleCVDragLeave = () => {
    setIsDraggingCV(false);
  };

  const handleCVDrop = (e) => {
    e.preventDefault();
    setIsDraggingCV(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleCVFile(files[0]);
    }
  };

const handleCVFile = async (file) => {
  setSelectedCV(file);
  try {
    setUploading((u) => ({ ...u, cv: true }));
    const res = await uploadOnboardingFile(file);
    const url = res.url || res.Location || res.fileUrl || res.data?.url;
    if (!url) throw new Error('No URL returned from upload');
    setUploadedUrls((u) => ({ ...u, cv: url }));
    setTutorOnboarding({ cv: url });
  } catch (e) {
    console.error(e);
    alert('Failed to upload CV.');
  } finally {
    setUploading((u) => ({ ...u, cv: false }));
  }
};

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
          <div
            className={`relative w-full h-64 rounded-xl border-2 ${selectedPhoto
              ? 'border-solid border-green-500 bg-green-50'
              : isDraggingPhoto
                ? 'border-dashed border-brand-medium-blue bg-brand-light-blue'
                : 'border-dashed border-[#d0d5db] bg-white'
              } hover:border-brand-medium-blue transition-colors cursor-pointer overflow-hidden`}
            onClick={handlePhotoClick}
            onDragOver={handlePhotoDragOver}
            onDragLeave={handlePhotoDragLeave}
            onDrop={handlePhotoDrop}
          >
            {selectedPhoto && photoPreview ? (
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="text-white text-center">
                    <p className="text-lg font-medium mb-2">{uploading.photo ? 'Uploading...' : 'Photo Selected'}</p>
                    <p className="text-sm">{selectedPhoto?.name || 'Profile Picture'}</p>
                    <p className="text-xs mt-1">{uploadedUrls.profilePic ? 'Uploaded ✅' : 'Click to change'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl text-gray-400">👤</span>
                </div>
                <p className="text-base text-[#495565] mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-[#697282]">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}
            <input
              type="file"
              id="profile-photo"
              className="hidden"
              accept="image/png,image/jpeg"
              aria-label="Upload profile photo"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  handlePhotoFile(e.target.files[0]);
                }
              }}
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

        {/* Full Name */}
        <div className="mb-6">
          <label htmlFor="full-name" className="block text-base text-[#101727] mb-3 font-normal">
            Full Name
          </label>
          <input
            type="text"
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., John Smith"
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
        </div>

        {/* Date of Birth */}
        <div className="mb-6">
          <label htmlFor="dob" className="block text-base text-[#101727] mb-3 font-normal">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="dob"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
        </div>

        {/* Subjects You Teach */}
        <div className="mb-6" ref={subjectsDropdownRef}>
          <label htmlFor="subjects" className="block text-base text-[#101727] mb-3 font-normal">
            Subjects You Teach
          </label>
          
          {/* Selected Subjects Display */}
          <div className="mb-2">
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedSubjects.map((subject, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-brand-light-blue text-brand-dark-blue rounded-full text-sm font-medium border border-brand-gold"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => removeSubject(subject)}
                      className="ml-1 hover:text-brand-dark-blue focus:outline-none"
                      aria-label={`Remove ${subject}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSubjectsDropdownOpen(!isSubjectsDropdownOpen)}
              className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-left text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors flex items-center justify-between"
              aria-describedby="subjects-help"
            >
              <span className={selectedSubjects.length === 0 ? 'text-[#717182]' : 'text-[#101727]'}>
                {selectedSubjects.length === 0 
                  ? 'Select subjects...' 
                  : `${selectedSubjects.length} subject${selectedSubjects.length > 1 ? 's' : ''} selected`}
              </span>
              <svg 
                className={`w-5 h-5 transition-transform ${isSubjectsDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isSubjectsDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {loadingSubjects ? (
                  <div className="px-4 py-3 text-center text-[#697282]">
                    Loading subjects...
                  </div>
                ) : availableSubjects.length === 0 ? (
                  <div className="px-4 py-3 text-center text-[#697282]">
                    No subjects available
                  </div>
                ) : (
                  availableSubjects.map((subject) => {
                    const subjectName = subject.name || subject;
                    const isSelected = selectedSubjects.includes(subjectName);
                    
                    return (
                      <button
                        key={subject.id || subjectName}
                        type="button"
                        onClick={() => toggleSubject(subjectName)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-brand-light-blue border-l-4 border-brand-gold' : ''
                        }`}
                      >
                        <span className={`text-base ${isSelected ? 'text-[#4A8FCC] font-medium' : 'text-[#101727]'}`}>
                          {subjectName}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-[#4A8FCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <p id="subjects-help" className="text-sm text-[#697282] mt-2">
            Select one or more subjects you teach
          </p>
        </div>

        {/* Grade Levels */}
        <div className="mb-6" ref={gradeLevelsDropdownRef}>
          <label htmlFor="grade-levels" className="block text-base text-[#101727] mb-3 font-normal">
            Grade Levels
          </label>
          
          {/* Selected Grade Levels Display */}
          <div className="mb-2">
            {selectedGradeLevels.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedGradeLevels.map((gradeLevel, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {gradeLevel}
                    <button
                      type="button"
                      onClick={() => removeGradeLevel(gradeLevel)}
                      className="ml-1 hover:text-purple-900 focus:outline-none"
                      aria-label={`Remove ${gradeLevel}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGradeLevelsDropdownOpen(!isGradeLevelsDropdownOpen)}
              className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-left text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors flex items-center justify-between"
              aria-describedby="grade-levels-help"
            >
              <span className={selectedGradeLevels.length === 0 ? 'text-[#717182]' : 'text-[#101727]'}>
                {selectedGradeLevels.length === 0 
                  ? 'Select grade levels...' 
                  : `${selectedGradeLevels.length} grade level${selectedGradeLevels.length > 1 ? 's' : ''} selected`}
              </span>
              <svg 
                className={`w-5 h-5 transition-transform ${isGradeLevelsDropdownOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isGradeLevelsDropdownOpen && (
              <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {loadingGradeLevels ? (
                  <div className="px-4 py-3 text-center text-[#697282]">
                    Loading grade levels...
                  </div>
                ) : availableGradeLevels.length === 0 ? (
                  <div className="px-4 py-3 text-center text-[#697282]">
                    No grade levels available
                  </div>
                ) : (
                  availableGradeLevels.map((gradeLevel) => {
                    const gradeLevelName = gradeLevel.name || gradeLevel;
                    const isSelected = selectedGradeLevels.includes(gradeLevelName);
                    
                    return (
                      <button
                        key={gradeLevel.id || gradeLevelName}
                        type="button"
                        onClick={() => toggleGradeLevel(gradeLevelName)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-purple-50' : ''
                        }`}
                      >
                        <span className={`text-base ${isSelected ? 'text-[#6a3de8] font-medium' : 'text-[#101727]'}`}>
                          {gradeLevelName}
                        </span>
                        {isSelected && (
                          <svg className="w-5 h-5 text-[#6a3de8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <p id="grade-levels-help" className="text-sm text-[#697282] mt-2">
            Select one or more grade levels you teach
          </p>
        </div>

        {/* Years of Experience */}
        <div className="mb-6">
          <label htmlFor="yoe" className="block text-base text-[#101727] mb-3 font-normal">
            Years of Experience
          </label>
          <input
            type="number"
            id="yoe"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value)}
            min="0"
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
        </div>

        {/* Interview Time */}
        <div className="mb-6">
          <label htmlFor="interview" className="block text-base text-[#101727] mb-3 font-normal">
            Preferred Interview Time (UTC)
          </label>
          <input
            type="datetime-local"
            id="interview"
            value={interviewTime}
            onChange={(e) => setInterviewTime(e.target.value)}
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
        </div>

        {/* Hourly Rate */}
        <div className="mb-6">
          <label htmlFor="hourly-rate" className="block text-base text-[#101727] mb-3 font-normal">
            Hourly Rate (USD) <span className="text-red-500">*</span>
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
              placeholder="Enter your hourly rate"
              className="w-full h-12 pl-10 pr-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
              min="1"
              step="1"
              required
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
          <div
            className={`relative w-full h-56 rounded-xl border-2 ${selectedVideo
              ? 'border-solid border-green-500 bg-green-50'
              : isDraggingVideo
                ? 'border-dashed border-brand-medium-blue bg-brand-light-blue'
                : 'border-dashed border-[#d0d5db] bg-white'
              } hover:border-brand-medium-blue transition-colors cursor-pointer`}
            onClick={handleVideoClick}
            onDragOver={handleVideoDragOver}
            onDragLeave={handleVideoDragLeave}
            onDrop={handleVideoDrop}
          >
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
              {selectedVideo ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-4xl">✓</span>
                  </div>
                  <p className="text-base text-green-700 font-medium mb-1">
                    {uploading.video ? 'Uploading...' : 'Video Selected'}
                  </p>
                  <p className="text-sm text-[#495565] mb-2 px-4 text-center">
                    {selectedVideo.name}
                  </p>
                  <p className="text-xs text-[#697282]">
                    {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-[#697282] mt-2">
                    {uploadedUrls.introVideo ? 'Uploaded ✅' : 'Click to change video'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <span className="text-5xl">📤</span>
                  </div>
                  <p className="text-base text-[#495565] mb-1">
                    Upload a 1-minute intro video
                  </p>
                  <p className="text-sm text-[#697282]">
                    MP4, MOV up to 100MB
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              id="intro-video"
              className="hidden"
              accept="video/mp4,video/quicktime"
              aria-label="Upload intro video"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  handleVideoFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {/* Upload CV */}
        <div className="mb-6">
          <label htmlFor="cv-upload" className="block text-base text-[#101727] mb-3 font-normal">
            Upload CV (Optional)
          </label>
          <div
            className={`relative w-full h-48 rounded-xl border-2 ${selectedCV
              ? 'border-solid border-green-500 bg-green-50'
              : isDraggingCV
                ? 'border-dashed border-brand-medium-blue bg-brand-light-blue'
                : 'border-dashed border-[#d0d5db] bg-white'
              } hover:border-brand-medium-blue transition-colors cursor-pointer`}
            onClick={handleCVClick}
            onDragOver={handleCVDragOver}
            onDragLeave={handleCVDragLeave}
            onDrop={handleCVDrop}
          >
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
              {selectedCV ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-4xl">✓</span>
                  </div>
                  <p className="text-base text-green-700 font-medium mb-1">
                    {uploading.cv ? 'Uploading...' : 'CV Selected'}
                  </p>
                  <p className="text-sm text-[#495565] mb-2 px-4 text-center">
                    {selectedCV.name}
                  </p>
                  <p className="text-xs text-[#697282]">
                    {(selectedCV.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-[#697282] mt-2">
                    {uploadedUrls.cv ? 'Uploaded ✅' : 'Click to change CV'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <span className="text-5xl">📄</span>
                  </div>
                  <p className="text-base text-[#495565] mb-1">
                    Upload your CV/Resume
                  </p>
                  <p className="text-sm text-[#697282]">
                    PDF up to 10MB
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              id="cv-upload"
              className="hidden"
              accept="application/pdf"
              aria-label="Upload CV"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  handleCVFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => {
            setTutorOnboarding({
              fullName,
              dateOfBirth,
              subjects,
              gradeLevels,
              yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
              teachingPhilosophy: aboutMe,
              interviewTime,
              fee: hourlyRate ? Number(hourlyRate) : undefined,
              profilePic: uploadedUrls.profilePic || undefined,
              cv: uploadedUrls.cv || undefined,
              introVideo: uploadedUrls.introVideo || undefined,
            });
            navigate('/verify-identity');
          }}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#5BA3D8] to-[#1B5A94] text-white text-base font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={uploading.photo || uploading.video || uploading.cv || !hourlyRate || Number(hourlyRate) < 1 || !dateOfBirth}
        >
          Save and Continue
        </button>
      </div>

      {/* Right Column - Image and Tips */}
      <div className="flex flex-col gap-6">
        {/* Hero Image Placeholder */}
        <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-md">
          <img
            src="/images/TutorProfile.jpg"
            alt="Professional tutor"
            className="w-full h-full object-cover"
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
