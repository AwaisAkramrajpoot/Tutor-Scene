import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  uploadOnboardingFile,
  apiRequest,
  getCurrentUser,
  submitTutorOnboarding,
  resolveApiAssetUrl,
  fetchMyTutorProspect,
} from "../../utils/api";
import { getTutorOnboarding, setTutorOnboarding } from "../../utils/onboarding";
import { mergeOnboardingSubmitIntoUser } from "../../utils/tutorProspectStatus";

export const ProfileTipsSection = () => {
  const tutorLsUserKey = (() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return "";
      const u = JSON.parse(raw);
      return String(u.userId || u.id || "");
    } catch {
      return "";
    }
  })();

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
  const [modalLeftChecked, setModalLeftChecked] = useState([]);
  const [modalRightList, setModalRightList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [dateOfBirthText, setDateOfBirthText] = useState("");
  const [dateOfBirthIso, setDateOfBirthIso] = useState("");
  const [dateOfBirthError, setDateOfBirthError] = useState("");
  const [profilePhotoError, setProfilePhotoError] = useState("");
  const [subjectsFieldError, setSubjectsFieldError] = useState("");
  const [yearsOfExperienceError, setYearsOfExperienceError] = useState("");
  const [cvFieldError, setCvFieldError] = useState("");
  const [dateOfBirthPickerValue, setDateOfBirthPickerValue] = useState("");
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedCV, setSelectedCV] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isDraggingCV, setIsDraggingCV] = useState(false);
  const [uploading, setUploading] = useState({ photo: false, cv: false });
  const [uploadedUrls, setUploadedUrls] = useState({ profilePic: "", cv: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const formatMmDdYyyyInput = (value) => {
    const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };

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

  const sortSubjectNames = (names) =>
    [...names].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: "base" }),
    );

  useEffect(() => {
    let cancelled = false;

    const cvNameFromUrl = (url) => {
      const s = String(url || "");
      try {
        const p = new URL(s).pathname;
        return p.split("/").filter(Boolean).pop() || "Uploaded CV";
      } catch {
        return s.split("/").filter(Boolean).pop() || "Uploaded CV";
      }
    };

    const hydrate = async () => {
      try {
        setLoadingSubjects(true);
        const [response, prospectWrap] = await Promise.all([
          apiRequest("/api/v1/subjects?databaseOnly=true"),
          fetchMyTutorProspect().catch(() => ({ prospect: null })),
        ]);
        const subjectsList = response.subjects || response.data || response || [];
        if (cancelled) return;
        setAvailableSubjects(subjectsList);

        const prospect = prospectWrap?.prospect ?? null;
        const local = getTutorOnboarding();
        const merged = { ...local, ownerUserId: local.ownerUserId };
        if (prospect && typeof prospect === "object") {
          if (prospect.fullName) merged.fullName = prospect.fullName;
          if (prospect.subjects != null && prospect.subjects !== "") merged.subjects = prospect.subjects;
          if (prospect.teachingPhilosophy != null && prospect.teachingPhilosophy !== "")
            merged.teachingPhilosophy = prospect.teachingPhilosophy;
          if (prospect.yearsOfExperience != null && !Number.isNaN(Number(prospect.yearsOfExperience)))
            merged.yearsOfExperience = prospect.yearsOfExperience;
          if (prospect.profilePic) merged.profilePic = prospect.profilePic;
          if (prospect.cv) merged.cv = prospect.cv;
          const dobRaw = prospect.dateOfBirth;
          const dobIso =
            typeof dobRaw === "string"
              ? dobRaw.slice(0, 10)
              : dobRaw && typeof dobRaw === "object" && dobRaw.toISOString
                ? dobRaw.toISOString().slice(0, 10)
                : "";
          if (dobIso && /^\d{4}-\d{2}-\d{2}$/.test(dobIso)) {
            merged.dateOfBirth = dobIso;
            merged.dateOfBirthDisplay = formatIsoToMmDdYyyy(dobIso);
          }
          const fnParts = String(prospect.fullName || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean);
          if (fnParts.length && !merged.legalFirstName) merged.legalFirstName = fnParts[0];
          if (fnParts.length > 1 && !merged.legalLastName)
            merged.legalLastName = fnParts.slice(1).join(" ");
        }
        setTutorOnboarding(merged);

        setAboutMe(merged.teachingPhilosophy || "");
        if (merged.subjects) {
          setSubjects(merged.subjects);
          setSelectedSubjects(
            sortSubjectNames(merged.subjects.split(",").map((s) => s.trim()).filter(Boolean)),
          );
        } else {
          setSubjects("");
          setSelectedSubjects([]);
        }
        setYearsOfExperience(
          merged.yearsOfExperience !== undefined && merged.yearsOfExperience !== null && merged.yearsOfExperience !== ""
            ? String(merged.yearsOfExperience)
            : "",
        );
        setLegalFirstName(merged.legalFirstName || "");
        setLegalLastName(merged.legalLastName || "");
        if (!merged.legalFirstName || !merged.legalLastName) {
          if (merged.fullName) {
            const parts = String(merged.fullName).trim().split(/\s+/);
            if (parts.length > 0 && !merged.legalFirstName) setLegalFirstName(parts[0]);
            if (parts.length > 1 && !merged.legalLastName) setLegalLastName(parts.slice(1).join(" "));
          }
        }
        const dobFromSaved =
          merged.dateOfBirthDisplay ||
          (merged.dateOfBirth ? formatIsoToMmDdYyyy(String(merged.dateOfBirth).slice(0, 10)) : "");
        if (dobFromSaved) {
          setDateOfBirthText(dobFromSaved);
          const parsed = parseMmDdYyyyToIso(dobFromSaved);
          setDateOfBirthIso(parsed.iso);
          setDateOfBirthPickerValue(parsed.iso);
          setDateOfBirthError(parsed.error);
        } else {
          setDateOfBirthText("");
          setDateOfBirthIso("");
          setDateOfBirthPickerValue("");
          setDateOfBirthError("");
        }
        setSelectedPhoto(null);
        setSelectedCV(null);
        setUploadedUrls({ profilePic: "", cv: "" });
        setPhotoPreview(null);
        if (merged.profilePic) {
          const picUrl = resolveApiAssetUrl(merged.profilePic);
          setUploadedUrls((u) => ({ ...u, profilePic: picUrl }));
          setPhotoPreview(picUrl);
          setProfilePhotoError("");
        }
        if (merged.cv) {
          const cvUrl = resolveApiAssetUrl(merged.cv);
          setUploadedUrls((u) => ({ ...u, cv: cvUrl }));
          setSelectedCV({ name: cvNameFromUrl(merged.cv), size: 0, fromServer: true });
          setCvFieldError("");
        }

        try {
          const rawUser = localStorage.getItem("user");
          if (rawUser) {
            const u = JSON.parse(rawUser);
            if (!merged.legalFirstName && !merged.fullName && u?.firstName) setLegalFirstName(u.firstName);
            if (!merged.legalLastName && !merged.fullName && u?.lastName) setLegalLastName(u.lastName);
          }
        } catch {}
      } catch (error) {
        console.error("Failed to fetch subjects:", error);
      } finally {
        if (!cancelled) setLoadingSubjects(false);
      }
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, [tutorLsUserKey]);

  // Update subjects string when selectedSubjects changes
  useEffect(() => {
    const subjectsString = selectedSubjects.join(', ');
    setSubjects(subjectsString);
    if (selectedSubjects.length > 0) setSubjectsFieldError("");
  }, [selectedSubjects]);


  const maxAboutMeLength = 250;

  const removeSubject = (subjectName) => {
    setSelectedSubjects((prev) => sortSubjectNames(prev.filter((s) => s !== subjectName)));
  };

  const normalizedSubjects = useMemo(
    () =>
      availableSubjects.map((subject, idx) => {
        const gradeLevelsFromName = (() => {
          const n = String(subject?.name || subject || "");
          const match = n.match(/\(([^)]+)\)/);
          return match ? match[1].split(",").map((v) => v.trim()) : [];
        })();
        const rawGl = subject?.gradeLevels ?? subject?.grade_levels;
        const gl = Array.isArray(rawGl) ? rawGl.filter(Boolean) : [];
        return {
          id: subject?.id || idx + 1,
          name: subject?.name || String(subject || ""),
          category: subject?.category || "General",
          gradeLevels: gl.length > 0 ? gl : gradeLevelsFromName,
        };
      }),
    [availableSubjects],
  );

  const levelsByName = useMemo(() => {
    const m = new Map();
    normalizedSubjects.forEach((s) => {
      m.set(String(s.name).trim().toLowerCase(), s.gradeLevels || []);
    });
    return m;
  }, [normalizedSubjects]);

  const sortedSelectedSubjects = useMemo(
    () => sortSubjectNames(selectedSubjects),
    [selectedSubjects],
  );

  const modalCategoryOptions = useMemo(() => {
    const fromDb = new Set(normalizedSubjects.map((s) => s.category).filter(Boolean));
    SUBJECT_CATEGORIES.forEach((c) => fromDb.add(c));
    return Array.from(fromDb).sort((a, b) => a.localeCompare(b));
  }, [normalizedSubjects]);

  const filteredSubjects = useMemo(() => {
    const keyword = subjectKeyword.trim().toLowerCase();
    return normalizedSubjects.filter((subject) => {
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
  }, [normalizedSubjects, subjectKeyword, subjectCategory, subjectGradeLevel]);

  const filteredAvailableSubjects = useMemo(() => {
    const selectedSet = new Set(
      modalRightList.map((name) => String(name).trim().toLowerCase()),
    );
    return filteredSubjects.filter(
      (subject) => !selectedSet.has(String(subject.name).trim().toLowerCase()),
    );
  }, [filteredSubjects, modalRightList]);

  const totalAvailableSubjectCount = useMemo(() => {
    const selectedSet = new Set(
      modalRightList.map((name) => String(name).trim().toLowerCase()),
    );
    return normalizedSubjects.filter(
      (subject) => !selectedSet.has(String(subject.name).trim().toLowerCase()),
    ).length;
  }, [normalizedSubjects, modalRightList]);

  const isProfileComplete = useMemo(() => {
    if (!String(uploadedUrls.profilePic || "").trim()) return false;
    if (!dateOfBirthIso) return false;
    if (selectedSubjects.length === 0) return false;
    const yoeStr = String(yearsOfExperience ?? "").trim();
    if (!yoeStr) return false;
    const yoeNum = Number(yearsOfExperience);
    if (Number.isNaN(yoeNum) || yoeNum < 0) return false;
    if (!String(uploadedUrls.cv || "").trim()) return false;
    return true;
  }, [
    uploadedUrls.profilePic,
    uploadedUrls.cv,
    dateOfBirthIso,
    selectedSubjects.length,
    yearsOfExperience,
  ]);

  const openSubjectsModal = () => {
    setModalRightList(sortSubjectNames([...selectedSubjects]));
    setModalLeftChecked([]);
    setIsSubjectsModalOpen(true);
  };

  const closeSubjectsModal = () => {
    setIsSubjectsModalOpen(false);
    setModalLeftChecked([]);
  };

  const toggleModalLeftCheck = (subjectName) => {
    setModalLeftChecked((prev) =>
      prev.includes(subjectName) ? prev.filter((s) => s !== subjectName) : [...prev, subjectName],
    );
  };

  const addCheckedSubjectsToRight = () => {
    setModalRightList((prev) => {
      const next = new Set(prev);
      modalLeftChecked.forEach((n) => next.add(n));
      return sortSubjectNames(Array.from(next));
    });
    setModalLeftChecked([]);
  };

  const deselectAllLeft = () => {
    setModalLeftChecked([]);
  };

  const removeFromModalRight = (subjectName) => {
    setModalRightList((prev) => sortSubjectNames(prev.filter((s) => s !== subjectName)));
  };

  const saveSubjectsFromModal = () => {
    setSelectedSubjects(sortSubjectNames(modalRightList));
    setIsSubjectsModalOpen(false);
    setModalLeftChecked([]);
  };

  useEffect(() => {
    if (!isSubjectsModalOpen) return undefined;
    const scrollY = window.scrollY;
    const { overflow, position, top, width } = document.body.style;
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.position = position;
      document.body.style.top = top;
      document.body.style.width = width;
      window.scrollTo(0, scrollY);
    };
  }, [isSubjectsModalOpen]);

  const gradeBadgeClass =
    "inline-flex items-center rounded-full bg-[#E8F0FE] text-[#1a56b5] border border-[#c5daf7] px-2 py-0.5 text-xs font-medium";

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
  const maxPhotoSize = 5 * 1024 * 1024; 
  if (file.size > maxPhotoSize) {
    setProfilePhotoError("Profile photo must be 5MB or less. Please upload a smaller image.");
    return;  
  }
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
    const rawUrl = res.url || res.Location || res.fileUrl || res.data?.url;
    if (!rawUrl) throw new Error('No URL returned from upload');
    const url = resolveApiAssetUrl(rawUrl);
    setUploadedUrls((u) => ({ ...u, profilePic: url }));
    setTutorOnboarding({ profilePic: url });
    setProfilePhotoError("");
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
  const maxCvSize = 10 * 1024 * 1024;
  if (file.size > maxCvSize) {
    setCvFieldError("Resume/CV must be 10MB or less. Please upload a smaller file.");
    return;  
  }
  setSelectedCV(file);
  try {
    setUploading((u) => ({ ...u, cv: true }));
    const res = await uploadOnboardingFile(file);
    const rawUrl = res.url || res.Location || res.fileUrl || res.data?.url;
    if (!rawUrl) throw new Error('No URL returned from upload');
    const url = resolveApiAssetUrl(rawUrl);
    setUploadedUrls((u) => ({ ...u, cv: url }));
    setTutorOnboarding({ cv: url });
    setCvFieldError("");
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
            Profile Photo <span className="text-red-500">*</span>
          </label>
          <div
            className={`relative w-64 h-64 mx-auto rounded-xl border-2 ${
              selectedPhoto
                ? "border-solid border-green-500 bg-green-50"
                : photoPreview
                  ? "border-solid border-[#5b8fd4] bg-[#f0f7ff]"
                  : isDraggingPhoto
                    ? "border-dashed border-brand-medium-blue bg-brand-light-blue"
                    : "border-dashed border-[#d0d5db] bg-white"
            } hover:border-brand-medium-blue transition-colors cursor-pointer overflow-hidden`}
            onClick={handlePhotoClick}
            onDragOver={handlePhotoDragOver}
            onDragLeave={handlePhotoDragLeave}
            onDrop={handlePhotoDrop}
          >
            {photoPreview ? (
              <div className="absolute inset-0 w-full h-full">
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="text-white text-center">
                    <p className="text-lg font-medium mb-2">
                      {uploading.photo ? "Uploading..." : selectedPhoto ? "Photo Selected" : "Saved profile photo"}
                    </p>
                    <p className="text-sm">{selectedPhoto?.name || "Profile Picture"}</p>
                    <p className="text-xs mt-1">{uploadedUrls.profilePic ? "Uploaded ✅" : "Click to change"}</p>
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
          {profilePhotoError ? (
            <p className="text-sm text-red-600 mt-2 text-center">{profilePhotoError}</p>
          ) : null}
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
            inputMode="numeric"
            maxLength={10}
            value={dateOfBirthText}
            onChange={(e) => {
              const formatted = formatMmDdYyyyInput(e.target.value);
              setDateOfBirthText(formatted);
              if (formatted.length < 10) {
                setDateOfBirthIso("");
                setDateOfBirthPickerValue("");
                setDateOfBirthError("");
                return;
              }
              const parsed = parseMmDdYyyyToIso(formatted);
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
            Subjects You Tutor <span className="text-red-500">*</span>
          </label>
          
          {/* Selected Subjects Display */}
          <div className="mb-2">
            {sortedSelectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {sortedSelectedSubjects.map((subject) => {
                  const lvls = levelsByName.get(String(subject).trim().toLowerCase()) || [];
                  return (
                    <span
                      key={subject}
                      className="inline-flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#D6DCE5] text-sm text-[#1F2937]"
                    >
                      <span className="font-medium">{subject}</span>
                      {lvls.map((lvl) => (
                        <span key={`${subject}-${lvl}`} className={gradeBadgeClass}>
                          {lvl}
                        </span>
                      ))}
                      <button
                        type="button"
                        onClick={() => removeSubject(subject)}
                        className="ml-1 p-0.5 rounded hover:bg-[#EEF2F7] text-[#64748b] hover:text-[#1e293b] focus:outline-none"
                        aria-label={`Remove ${subject}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  );
                })}
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
          {subjectsFieldError ? (
            <p className="text-sm text-red-600 mt-2">{subjectsFieldError}</p>
          ) : null}
        </div>


        {/* Years of Experience */}
        <div className="mb-6">
          <label htmlFor="yoe" className="block text-base text-[#101727] mb-3 font-normal">
            Years of Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="yoe"
            value={yearsOfExperience}
            onChange={(e) => {
              setYearsOfExperience(e.target.value);
              setYearsOfExperienceError("");
            }}
            min="0"
            className="w-full h-12 px-4 py-2 bg-[#f3f3f5] rounded-xl border border-transparent text-[#717182] text-base focus:outline-none focus:border-[#4A8FCC] focus:ring-1 focus:ring-[#4A8FCC] transition-colors"
          />
          {yearsOfExperienceError ? (
            <p className="text-sm text-red-600 mt-2">{yearsOfExperienceError}</p>
          ) : null}
        </div>


        {/* Upload CV */}
        <div className="mb-6">
          <label htmlFor="cv-upload" className="block text-base text-[#101727] mb-3 font-normal">
            Upload Resume/CV <span className="text-red-500">*</span>
          </label>
          <div
            className={`relative w-full h-48 rounded-xl border-2 ${
              selectedCV && !selectedCV.fromServer
                ? "border-solid border-green-500 bg-green-50"
                : uploadedUrls.cv
                  ? "border-solid border-[#5b8fd4] bg-[#f0f7ff]"
                  : isDraggingCV
                    ? "border-dashed border-brand-medium-blue bg-brand-light-blue"
                    : "border-dashed border-[#d0d5db] bg-white"
            } hover:border-brand-medium-blue transition-colors cursor-pointer`}
            onClick={handleCVClick}
            onDragOver={handleCVDragOver}
            onDragLeave={handleCVDragLeave}
            onDrop={handleCVDrop}
          >
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
              {selectedCV || uploadedUrls.cv ? (
                <>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-4xl">✓</span>
                  </div>
                  <p className="text-base text-green-700 font-medium mb-1">
                    {uploading.cv ? "Uploading..." : selectedCV?.fromServer ? "Resume/CV on file" : "Resume/CV Selected"}
                  </p>
                  <p className="text-sm text-[#495565] mb-2 px-4 text-center">
                    {selectedCV?.name || "Uploaded document"}
                  </p>
                  {selectedCV && selectedCV.size > 0 ? (
                    <p className="text-xs text-[#697282]">{(selectedCV.size / 1024).toFixed(2)} KB</p>
                  ) : null}
                  <p className="text-xs text-[#697282] mt-2">
                    {uploadedUrls.cv ? "Uploaded ✅" : "Click to change Resume/CV"}
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
          {cvFieldError ? <p className="text-sm text-red-600 mt-2">{cvFieldError}</p> : null}
        </div>

        <p className="text-sm text-[#495565] mb-4">
          🔒 All documents are encrypted and stored securely. We never share your personal information.
        </p>

        {/* Submit Button */}
        <button
          type="button"
          onClick={async () => {
            setProfilePhotoError("");
            setSubjectsFieldError("");
            setYearsOfExperienceError("");
            setCvFieldError("");
            if (!String(uploadedUrls.profilePic || "").trim()) {
              setProfilePhotoError("Profile photo is required.");
              return;
            }
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
            if (selectedSubjects.length === 0) {
              setSubjectsFieldError("Select at least one subject you tutor.");
              return;
            }
            const yoeStr = String(yearsOfExperience ?? "").trim();
            if (!yoeStr) {
              setYearsOfExperienceError("Years of experience is required.");
              return;
            }
            const yoeNum = Number(yearsOfExperience);
            if (Number.isNaN(yoeNum) || yoeNum < 0) {
              setYearsOfExperienceError("Enter a valid number of years (0 or greater).");
              return;
            }
            if (!String(uploadedUrls.cv || "").trim()) {
              setCvFieldError("Resume/CV upload is required.");
              return;
            }
            const combinedFullName = `${String(legalFirstName || "").trim()} ${String(legalLastName || "").trim()}`.trim();
            const onboardingPayload = {
              legalFirstName: String(legalFirstName || "").trim(),
              legalLastName: String(legalLastName || "").trim(),
              fullName: combinedFullName,
              dateOfBirth: parsedDob.iso,
              dateOfBirthDisplay: dateOfBirthText,
              subjects,
              gradeLevels: "",
              yearsOfExperience: yoeNum,
              teachingPhilosophy: aboutMe,
              profilePic: uploadedUrls.profilePic || undefined,
              cv: uploadedUrls.cv || undefined,
            };
            setTutorOnboarding(onboardingPayload);
            try {
              setSavingProfile(true);
              const user = getCurrentUser();
              const userId = user?.id || user?._id || user?.userId;
              if (!userId) throw new Error("User session missing. Please sign in again.");
              const submitResponse = await submitTutorOnboarding({
                userId,
                fullName: onboardingPayload.fullName,
                dateOfBirth: onboardingPayload.dateOfBirth,
                subjects: onboardingPayload.subjects || "",
                gradeLevels: "",
                yearsOfExperience: onboardingPayload.yearsOfExperience || 0,
                teachingPhilosophy: onboardingPayload.teachingPhilosophy || "",
                profilePic: onboardingPayload.profilePic,
                cv: onboardingPayload.cv,
              });
              const prospect = submitResponse?.prospect;
              const persistedPic = prospect?.profilePic || onboardingPayload.profilePic;
              const persistedCv = prospect?.cv || onboardingPayload.cv;
              setTutorOnboarding({
                ...onboardingPayload,
                profilePic: persistedPic,
                cv: persistedCv,
              });
              if (persistedPic) {
                const picUrl = resolveApiAssetUrl(persistedPic);
                setUploadedUrls((u) => ({ ...u, profilePic: picUrl }));
                setPhotoPreview(picUrl);
              }
              if (persistedCv) {
                const cvUrl = resolveApiAssetUrl(persistedCv);
                setUploadedUrls((u) => ({ ...u, cv: cvUrl }));
                const cvLabel = (() => {
                  try {
                    return new URL(cvUrl).pathname.split("/").filter(Boolean).pop() || "Uploaded CV";
                  } catch {
                    return String(persistedCv).split("/").filter(Boolean).pop() || "Uploaded CV";
                  }
                })();
                setSelectedCV({ name: cvLabel, size: 0, fromServer: true });
              }
              const sessionUser = getCurrentUser();
              if (sessionUser) {
                const next = mergeOnboardingSubmitIntoUser(sessionUser, submitResponse);
                next.firstName =
                  String(onboardingPayload.legalFirstName || "").trim() || sessionUser.firstName;
                next.lastName =
                  String(onboardingPayload.legalLastName || "").trim() || sessionUser.lastName;
                next.fullName = onboardingPayload.fullName || sessionUser.fullName;
                localStorage.setItem("user", JSON.stringify(next));
              }
            } catch (err) {
              alert(err?.message || "Failed to save profile information.");
              setSavingProfile(false);
              return;
            }
            setSavingProfile(false);
            navigate('/interviews');
          }}
          className={`w-full h-14 rounded-xl text-base font-medium transition-opacity shadow-sm disabled:cursor-not-allowed ${
            isProfileComplete && !uploading.photo && !uploading.cv && !savingProfile
              ? "bg-gradient-to-r from-[#5BA3D8] to-[#1B5A94] text-white hover:opacity-90"
              : "bg-[#d1d5db] text-[#9ca3af]"
          }`}
          disabled={
            !isProfileComplete ||
            uploading.photo ||
            uploading.cv ||
            savingProfile
          }
        >
          {savingProfile ? "Saving..." : "Save and Continue"}
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

        <div className="rounded-2xl border border-[#E8D5A0] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FE]" aria-hidden>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 3h9c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2H4V3z"
                  fill="#ffffff"
                  stroke="#4A8FCC"
                  strokeWidth="1.2"
                />
                <path
                  d="M15 3h9c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2h-9V3z"
                  fill="#4A8FCC"
                  fillOpacity="0.15"
                  stroke="#4A8FCC"
                  strokeWidth="1.2"
                />
                <path d="M14 3v16" stroke="#4A8FCC" strokeWidth="1.2" />
              </svg>
            </span>
            <h3 className="text-lg font-medium text-[#374151]">Why This Matters</h3>
          </div>
          <p className="text-sm leading-relaxed text-[#495565]">
            Your profile is the first impression{" "}
            <strong className="font-semibold text-[#101727]">learners</strong> have of you. A complete, professional
            profile helps you stand out and attracts more bookings.
          </p>
        </div>
      </div>

      {isSubjectsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-hidden overscroll-none">
          <div
            className="bg-white w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subjects-modal-title"
          >
            <div className="relative px-6 pt-8 pb-5 border-b border-gray-200 shrink-0">
              <button
                type="button"
                onClick={closeSubjectsModal}
                className="absolute right-4 top-4 text-[#6b7280] hover:text-[#111827] text-2xl leading-none w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
                aria-label="Close subjects modal"
              >
                ×
              </button>
              <h3
                id="subjects-modal-title"
                className="text-center text-2xl sm:text-3xl font-semibold text-[#1e4fa3] tracking-tight pr-8"
              >
                Subjects You Tutor
              </h3>
              <p className="text-center text-sm text-[#5c6570] mt-3 max-w-2xl mx-auto leading-relaxed px-2">
                Search by keyword, filter by category or grade level, and select multiple subjects at once.
              </p>
            </div>

            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap gap-3 items-center shrink-0 bg-[#fafbfc]">
              <div className="flex-1 min-w-[220px] relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" aria-hidden>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={subjectKeyword}
                  onChange={(e) => setSubjectKeyword(e.target.value)}
                  placeholder="Search subjects, topics, or keywords"
                  className="w-full h-10 pl-9 pr-3 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb]"
                />
              </div>
              <select
                value={subjectCategory}
                onChange={(e) => setSubjectCategory(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white min-w-[160px]"
              >
                <option value="all">All Categories</option>
                {modalCategoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={subjectGradeLevel}
                onChange={(e) => setSubjectGradeLevel(e.target.value)}
                className="h-10 px-3 rounded-lg border border-gray-300 text-sm bg-white min-w-[160px]"
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
                className="h-10 px-3 rounded-lg text-sm font-medium text-[#2563eb] hover:bg-blue-50 whitespace-nowrap"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 min-h-0 flex-1 overflow-hidden">
              <div className="border border-[#d9e0ea] rounded-xl flex flex-col min-h-[280px] max-h-[52vh] bg-white">
                <div className="px-4 py-3 border-b border-[#e5eaf2] shrink-0">
                  <div className="text-sm font-semibold text-[#1e3a8a]">Available Subjects</div>
                  <div className="text-xs text-[#64748b] mt-0.5">
                    Showing {filteredAvailableSubjects.length} of {totalAvailableSubjectCount} subjects
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 overscroll-contain">
                  {loadingSubjects ? (
                    <p className="px-3 py-4 text-sm text-[#6b7280]">Loading subjects…</p>
                  ) : filteredAvailableSubjects.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-[#6b7280]">No subjects match your filters.</p>
                  ) : (
                    filteredAvailableSubjects.map((subject) => {
                      const isChecked = modalLeftChecked.includes(subject.name);
                      return (
                        <label
                          key={`${subject.id}-${subject.name}`}
                          className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer border border-transparent ${
                            isChecked ? "bg-[#eef5ff] border-[#c5daf7]" : "hover:bg-gray-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleModalLeftCheck(subject.name)}
                            className="mt-1.5 shrink-0 rounded border-gray-300 text-[#2563eb] focus:ring-[#2563eb]"
                          />
                          <div className="flex-1 min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-sm text-[#0f172a] font-medium leading-snug">{subject.name}</span>
                            <span className="flex flex-wrap gap-1">
                              {(subject.gradeLevels || []).map((lvl) => (
                                <span key={`${subject.name}-${lvl}`} className={gradeBadgeClass}>
                                  {lvl}
                                </span>
                              ))}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-3 border-t border-[#e5eaf2] flex flex-wrap gap-2 shrink-0 bg-[#fafbfc]">
                  <button
                    type="button"
                    onClick={addCheckedSubjectsToRight}
                    disabled={modalLeftChecked.length === 0}
                    className="h-10 px-4 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Add Selected Subjects
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllLeft}
                    disabled={modalLeftChecked.length === 0}
                    className="h-10 px-4 rounded-lg border border-gray-300 text-sm text-[#374151] bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="border border-[#d9e0ea] rounded-xl flex flex-col min-h-[280px] max-h-[52vh] bg-white">
                <div className="px-4 py-3 border-b border-[#e5eaf2] shrink-0">
                  <div className="text-sm font-semibold text-[#1e3a8a]">Selected Subjects</div>
                  <div className="text-xs text-[#64748b] mt-0.5">{modalRightList.length} Subjects Selected</div>
                </div>
                <div className="flex-1 overflow-y-auto px-2 py-2 min-h-0 overscroll-contain">
                  {modalRightList.length === 0 ? (
                    <p className="px-3 py-4 text-sm text-[#6b7280]">No subjects selected yet.</p>
                  ) : (
                    modalRightList.map((name) => {
                      const lvls = levelsByName.get(String(name).trim().toLowerCase()) || [];
                      return (
                        <div
                          key={name}
                          className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-lg bg-[#f8fbff] border border-[#d9e0ea] mb-2"
                        >
                          <span className="text-sm font-medium text-[#0f172a] flex-1 min-w-[140px]">{name}</span>
                          <div className="flex flex-wrap gap-1">
                            {lvls.map((lvl) => (
                              <span key={`${name}-${lvl}`} className={gradeBadgeClass}>
                                {lvl}
                              </span>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromModalRight(name)}
                            className="shrink-0 p-1 rounded text-[#64748b] hover:bg-white hover:text-[#0f172a] border border-transparent hover:border-[#cbd5e1]"
                            aria-label={`Remove ${name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="px-4 py-3 border-t border-[#e5eaf2] flex justify-end shrink-0 bg-[#fafbfc]">
                  <button
                    type="button"
                    onClick={saveSubjectsFromModal}
                    className="h-10 px-6 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:opacity-95"
                  >
                    Save Subjects
                  </button>
                </div>
              </div>
            </div>

            {/* <div className="px-6 py-4 border-t border-gray-200 flex justify-end shrink-0 bg-white">
              <button
                type="button"
                onClick={closeSubjectsModal}
                className="h-10 px-5 rounded-lg border border-gray-300 text-sm text-[#374151] hover:bg-gray-50"
              >
                Cancel
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};
