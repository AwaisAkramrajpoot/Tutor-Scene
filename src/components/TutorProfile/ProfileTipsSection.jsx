import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { uploadOnboardingFile, apiRequest } from "../../utils/api";
import { getTutorOnboarding, setTutorOnboarding } from "../../utils/onboarding";

export const ProfileTipsSection = () => {
  const SUBJECT_CATEGORIES = [
    "Biology",
    "Business & Economics",
    "Chemistry",
    "Computer Science & Technology",
    "Mathematics",
    "Physics",
    "Study Skills & Executive Function",
    "Test Prep",
    "Writing & Humanities",
  ];
  const SUBJECT_GRADE_LEVELS = ["Elementary", "Middle", "High", "College", "Adult Learners"];

  const navigate = useNavigate();
  const [aboutMe, setAboutMe] = useState("");
  const [subjects, setSubjects] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [isSubjectsModalOpen, setIsSubjectsModalOpen] = useState(false);
  const [subjectKeyword, setSubjectKeyword] = useState("");
  const [subjectCategory, setSubjectCategory] = useState("all");
  const [subjectGradeLevel, setSubjectGradeLevel] = useState("all");
  const [subjectSelectionDraft, setSubjectSelectionDraft] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [dateOfBirthText, setDateOfBirthText] = useState("");
  const [dateOfBirthIso, setDateOfBirthIso] = useState("");
  const [dateOfBirthError, setDateOfBirthError] = useState("");
  const [dateOfBirthPickerValue, setDateOfBirthPickerValue] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedCV, setSelectedCV] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, cv: false });
  const [uploadedUrls, setUploadedUrls] = useState({ profilePic: "", cv: "" });

  const parseMmDdYyyyToIso = (value) => {
    const v = String(value || "").trim();
    const m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return { iso: "", error: "Use MM/DD/YYYY format." };
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    const yyyy = Number(m[3]);
    if (mm < 1 || mm > 12) return { iso: "", error: "Month must be 01-12." };
    if (dd < 1 || dd > 31) return { iso: "", error: "Day must be 01-31." };
    if (yyyy < 1900 || yyyy > new Date().getFullYear()) return { iso: "", error: "Enter a valid year." };

    const iso = `${String(yyyy).padStart(4, "0")}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    const d = new Date(`${iso}T00:00:00`);
    // Validate real date (e.g. 02/30 invalid)
    const isReal =
      d.getFullYear() === yyyy &&
      d.getMonth() + 1 === mm &&
      d.getDate() === dd;
    if (!isReal) return { iso: "", error: "Enter a real calendar date." };

    return { iso, error: "" };
  };

  const formatIsoToMmDdYyyy = (iso) => {
    const v = String(iso || "").trim();
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    return `${m[2]}/${m[3]}/${m[1]}`;
  };

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

    fetchSubjects();

    const saved = getTutorOnboarding();
    if (saved.teachingPhilosophy) setAboutMe(saved.teachingPhilosophy);
    if (saved.subjects) {
      setSubjects(saved.subjects);
      // Parse saved subjects and match with available subjects
      const savedSubjectNames = saved.subjects.split(',').map(s => s.trim());
      setSelectedSubjects(savedSubjectNames);
    }
    if (saved.yearsOfExperience) setYearsOfExperience(String(saved.yearsOfExperience));
    if (saved.legalFirstName) setLegalFirstName(saved.legalFirstName);
    if (saved.legalLastName) setLegalLastName(saved.legalLastName);
    if (!saved.legalFirstName || !saved.legalLastName) {
      if (saved.fullName) {
        const parts = String(saved.fullName).trim().split(/\s+/);
        if (parts.length > 0 && !saved.legalFirstName) setLegalFirstName(parts[0]);
        if (parts.length > 1 && !saved.legalLastName) setLegalLastName(parts.slice(1).join(" "));
      }
    }
    const dobFromSaved = saved.dateOfBirthDisplay || (saved.dateOfBirth ? formatIsoToMmDdYyyy(saved.dateOfBirth) : "");
    if (dobFromSaved) {
      setDateOfBirthText(dobFromSaved);
      const parsed = parseMmDdYyyyToIso(dobFromSaved);
      setDateOfBirthIso(parsed.iso);
      setDateOfBirthPickerValue(parsed.iso);
      setDateOfBirthError(parsed.error);
    }
    if (saved.profilePic) { setUploadedUrls((u)=>({ ...u, profilePic: saved.profilePic })); setPhotoPreview(saved.profilePic); }
    if (saved.cv) setUploadedUrls((u)=>({ ...u, cv: saved.cv }));
    

    // Autopopulate legal name from Create Account (localStorage user), unless already set
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        if (!saved.legalFirstName && !saved.fullName && u?.firstName) setLegalFirstName(u.firstName);
        if (!saved.legalLastName && !saved.fullName && u?.lastName) setLegalLastName(u.lastName);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Update subjects string when selectedSubjects changes
  useEffect(() => {
    const subjectsString = selectedSubjects.join(', ');
    setSubjects(subjectsString);
  }, [selectedSubjects]);


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

  const normalizedSubjects = availableSubjects.map((subject, idx) => {
    const gradeLevelsFromName = (() => {
      const n = String(subject?.name || subject || "");
      const match = n.match(/\(([^)]+)\)/);
      return match ? match[1].split(",").map((v) => v.trim()) : [];
    })();
    return {
      id: subject?.id || idx + 1,
      name: subject?.name || String(subject || ""),
      category: subject?.category || "General",
      gradeLevels: subject?.gradeLevels || gradeLevelsFromName,
    };
  });

  const filteredSubjects = normalizedSubjects.filter((subject) => {
    const keyword = subjectKeyword.trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      subject.name.toLowerCase().includes(keyword) ||
      subject.category.toLowerCase().includes(keyword);
    const matchesCategory = subjectCategory === "all" || subject.category === subjectCategory;
    const matchesGrade =
      subjectGradeLevel === "all" ||
      subject.gradeLevels.some((grade) => grade === subjectGradeLevel);

    return matchesKeyword && matchesCategory && matchesGrade;
  });

  const openSubjectsModal = () => {
    setSubjectSelectionDraft(selectedSubjects);
    setIsSubjectsModalOpen(true);
  };

  const closeSubjectsModal = () => {
    setIsSubjectsModalOpen(false);
  };

  const toggleDraftSubject = (subjectName) => {
    setSubjectSelectionDraft((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName],
    );
  };

  const saveSubjectsFromModal = () => {
    setSelectedSubjects(subjectSelectionDraft);
    setIsSubjectsModalOpen(false);
  };

  const handlePhotoClick = () => {
    document.getElementById('profile-photo').click();
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
    "Highlight your qualifications, experience, teaching philosophy, and tutoring style",
    "Intro videos increase booking rates by 60% — show your personality!",
    "Research competitive rates for your subject and experience level",
  ];

  return (
    <div className="grid grid-cols-2 gap-8 w-full">
      {/* Left Column - Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        {/* Title */}
        <h2 className="text-2xl font-normal text-[#101727] mb-8 text-center">
          Your Profile Information
        </h2>

        {/* Profile Photo */}
        <div className="mb-6 relative">
          <label htmlFor="profile-photo" className="block text-base text-[#101727] mb-3 font-normal">
            Profile Photo
          </label>
          <div
            className={`relative w-64 h-64 mx-auto rounded-xl border-2 ${selectedPhoto
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
            placeholder="Tell learners about your teaching experience, approach, and what makes you a great tutor..."
            className="w-full h-32 px-4 py-3 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base resize-none focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
            maxLength={maxAboutMeLength}
            aria-describedby="about-me-count"
          />
          <div id="about-me-count" className="text-sm text-[#697282] mt-2">
            {aboutMe.length}/{maxAboutMeLength} characters
          </div>
        </div>

        {/* Legal Name */}
        <div className="mb-6"> 
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="legal-first-name" className="block text-sm text-[#495565] mb-2 font-normal">
                Legal First Name
              </label>
              <input
                type="text"
                id="legal-first-name"
                value={legalFirstName}
                onChange={(e) => setLegalFirstName(e.target.value)}
                placeholder="e.g., John"
                className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="legal-last-name" className="block text-sm text-[#495565] mb-2 font-normal">
                Legal Last Name
              </label>
              <input
                type="text"
                id="legal-last-name"
                value={legalLastName}
                onChange={(e) => setLegalLastName(e.target.value)}
                placeholder="e.g., Smith"
                className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Date of Birth */}
        <div className="mb-6">
          <label htmlFor="dob" className="block text-base text-[#101727] mb-3 font-normal">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="dob"
            value={dateOfBirthText}
            onChange={(e) => {
              const next = e.target.value;
              setDateOfBirthText(next);
              const parsed = parseMmDdYyyyToIso(next);
              setDateOfBirthIso(parsed.iso);
              setDateOfBirthPickerValue(parsed.iso);
              setDateOfBirthError(parsed.error);
            }}
            required
            placeholder="MM/DD/YYYY"
            className="w-full h-12 pl-4 pr-12 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
          <input
            type="date"
            value={dateOfBirthPickerValue}
            onChange={(e) => {
              const iso = e.target.value;
              const mmddyyyy = formatIsoToMmDdYyyy(iso);
              const parsed = parseMmDdYyyyToIso(mmddyyyy);
              setDateOfBirthPickerValue(iso);
              setDateOfBirthText(mmddyyyy);
              setDateOfBirthIso(parsed.iso);
              setDateOfBirthError(parsed.error);
            }}
            className="absolute opacity-0 pointer-events-none"
            tabIndex={-1}
            aria-hidden="true"
            id="dob-picker-hidden"
          />
          <button
            type="button"
            onClick={() => {
              const picker = document.getElementById('dob-picker-hidden');
              if (picker && typeof picker.showPicker === 'function') {
                picker.showPicker();
              } else if (picker) {
                picker.focus();
              }
            }}
            className="absolute right-3 top-[42px] -translate-y-1/2 text-[#697282] hover:text-[#4A8FCC]"
            aria-label="Open date picker"
          >
            📅
          </button>
          {dateOfBirthError && (
            <p className="text-sm text-red-600 mt-2">{dateOfBirthError}</p>
          )}
        </div>

        {/* Subjects You Tutor */}
        <div className="mb-6">
          <label htmlFor="subjects" className="block text-base text-[#101727] mb-3 font-normal">
            Subjects You Tutor
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

          <button
            type="button"
            onClick={openSubjectsModal}
            className="w-full h-12 px-4 rounded-xl bg-[#B38A1B] text-white text-sm font-medium hover:opacity-95 transition-opacity"
          >
            Select Subjects
          </button>
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


        {/* Upload CV */}
        <div className="mb-6">
          <label htmlFor="cv-upload" className="block text-base text-[#101727] mb-3 font-normal">
            Upload Resume/CV
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
                    {uploading.cv ? 'Uploading...' : 'Resume/CV Selected'}
                  </p>
                  <p className="text-sm text-[#495565] mb-2 px-4 text-center">
                    {selectedCV.name}
                  </p>
                  <p className="text-xs text-[#697282]">
                    {(selectedCV.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-xs text-[#697282] mt-2">
                    {uploadedUrls.cv ? 'Uploaded ✅' : 'Click to change Resume/CV'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 flex items-center justify-center mb-3">
                    <span className="text-5xl">📄</span>
                  </div>
                  <p className="text-base text-[#495565] mb-1">
                    Upload your Resume/CV
                  </p>
                  <p className="text-sm text-[#697282]">
                    PDF, JPG, PNG up to 10MB
                  </p>
                </>
              )}
            </div>
            <input
              type="file"
              id="cv-upload"
              className="hidden"
              accept="application/pdf,image/jpeg,image/jpg,image/png"
              aria-label="Upload Resume/CV"
              onChange={(e) => {
                if (e.target.files.length > 0) {
                  handleCVFile(e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        <p className="text-sm text-[#495565] mb-4">
          🔒 All documents are encrypted and stored securely. We never share your personal information.
        </p>

        {/* Submit Button */}
        <button
          type="button"
          onClick={() => {
            if (!dateOfBirthText.trim()) {
              setDateOfBirthError("Date of Birth is required in MM/DD/YYYY format.");
              return;
            }
            const parsedDob = parseMmDdYyyyToIso(dateOfBirthText);
            if (parsedDob.error) {
              setDateOfBirthError(parsedDob.error);
              return;
            }
            setDateOfBirthError("");
            const combinedFullName = `${String(legalFirstName || "").trim()} ${String(legalLastName || "").trim()}`.trim();
            setTutorOnboarding({
              legalFirstName: String(legalFirstName || "").trim(),
              legalLastName: String(legalLastName || "").trim(),
              fullName: combinedFullName,
              dateOfBirth: parsedDob.iso,
              dateOfBirthDisplay: dateOfBirthText,
              subjects,
              gradeLevels: "",
              yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
              teachingPhilosophy: aboutMe,
              profilePic: uploadedUrls.profilePic || undefined,
              cv: uploadedUrls.cv || undefined,
            });
            navigate('/interviews');
          }}
          className="w-full h-14 rounded-xl bg-gradient-to-r from-[#5BA3D8] to-[#1B5A94] text-white text-base font-medium hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            uploading.photo ||
            uploading.cv
          }
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

        {/* Subjects Selected */}
        <div className="bg-[#EEF1F5] rounded-2xl p-4 min-h-[240px] flex flex-col">
          <h3 className="text-white text-sm font-medium bg-[#2E7DDB] rounded-md px-3 py-2 mb-3">
            Subjects Selected
          </h3>
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {selectedSubjects.length === 0 ? (
              <p className="text-sm text-[#6B7280] px-1">No subjects selected yet.</p>
            ) : (
              selectedSubjects.map((subject) => (
                <div
                  key={subject}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-[#D6DCE5]"
                >
                  <span className="text-sm text-[#1F2937]">{subject}</span>
                  <button
                    type="button"
                    onClick={() => removeSubject(subject)}
                    className="text-xs px-2 py-1 rounded border border-[#CBD5E1] bg-[#F8FAFC] hover:bg-[#EEF2F7]"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-3xl font-semibold text-[#2563eb]">Subjects You Tutor</h3>
              <button
                type="button"
                onClick={closeSubjectsModal}
                className="text-[#6b7280] hover:text-[#111827] text-2xl leading-none"
                aria-label="Close subjects modal"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap gap-3 items-center">
              <input
                type="text"
                value={subjectKeyword}
                onChange={(e) => setSubjectKeyword(e.target.value)}
                placeholder="Search by keyword, subject, or category"
                className="flex-1 min-w-[240px] h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
              <select
                value={subjectCategory}
                onChange={(e) => setSubjectCategory(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="all">All Categories</option>
                {SUBJECT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={subjectGradeLevel}
                onChange={(e) => setSubjectGradeLevel(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white"
              >
                <option value="all">All Grade Levels</option>
                {SUBJECT_GRADE_LEVELS.map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setSubjectKeyword("");
                  setSubjectCategory("all");
                  setSubjectGradeLevel("all");
                }}
                className="h-10 px-3 rounded-lg text-sm text-[#2563eb] hover:bg-blue-50"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="border border-gray-200 rounded-xl">
                <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-[#111827]">
                  Available Subjects ({filteredSubjects.length})
                </div>
                <div className="max-h-[320px] overflow-y-auto px-2 py-2">
                  {loadingSubjects ? (
                    <p className="px-3 py-2 text-sm text-[#6b7280]">Loading subjects...</p>
                  ) : filteredSubjects.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-[#6b7280]">No subjects match your filters.</p>
                  ) : (
                    filteredSubjects.map((subject) => {
                      const isChecked = subjectSelectionDraft.includes(subject.name);
                      return (
                        <label
                          key={`${subject.id}-${subject.name}`}
                          className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleDraftSubject(subject.name)}
                            className="mt-1"
                          />
                          <span className="text-sm text-[#1f2937]">
                            {subject.name}
                            <span className="text-[#2563eb]"> ({subject.category})</span>
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl">
                <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-[#111827]">
                  Selected Subjects ({subjectSelectionDraft.length})
                </div>
                <div className="max-h-[320px] overflow-y-auto px-2 py-2">
                  {subjectSelectionDraft.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-[#6b7280]">No subjects selected yet.</p>
                  ) : (
                    subjectSelectionDraft.map((name) => (
                      <div key={name} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-blue-50 mb-2">
                        <span className="text-sm text-[#1f2937]">{name}</span>
                        <button
                          type="button"
                          onClick={() => toggleDraftSubject(name)}
                          className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeSubjectsModal}
                className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-[#374151] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveSubjectsFromModal}
                className="h-10 px-4 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:opacity-95"
              >
                Save Subjects
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
