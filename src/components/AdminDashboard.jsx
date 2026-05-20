import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu,
  MenuItem,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import { apiRequest } from "../utils/api";

const SUBJECT_LEVEL_OPTIONS = [
  "Elementary",
  "Middle",
  "High",
  "College",
  "Adult Learners",
];

const clampSortOrder = (value) => {
  const n = Number(value);
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.trunc(n));
};

const sortOrderInputFromString = (raw) => {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits === "" ? 0 : parseInt(digits, 10);
};

const sortOrderKeyDownBlockInvalid = (e) => {
  if (["-", "+", "e", "E", "."].includes(e.key)) {
    e.preventDefault();
  }
};

const blockNegativeNumberKeys = (e) => {
  if (["-", "+", "e", "E"].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveIntInput = (value) => String(value).replace(/\D/g, "");

const sanitizePositiveDecimalInput = (value) => {
  let cleaned = String(value).replace(/-/g, "").replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  return cleaned;
};

const parseApiList = (data, nestedKeys = []) => {
  if (Array.isArray(data)) return data;
  for (const key of nestedKeys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const DotsVerticalIcon = (props) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
    />
  </svg>
);

const StatCard = ({ title, value, subtitle, icon }) => (
  <div className="flex items-center gap-4 rounded-xl border border-brand-gold bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
    <div className="rounded-lg bg-brand-light-blue p-3 text-brand-dark-blue">
      {icon}
    </div>
    <div>
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400">{subtitle}</div>}
    </div>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors whitespace-nowrap ${
      active
        ? "bg-brand-medium-blue text-white border-brand-gold shadow-lg"
        : "bg-white text-gray-700 border-gray-200 hover:bg-brand-light-blue"
    }`}
  >
    {children}
  </button>
);

const SectionHeader = ({ title, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

const FilterDropdown = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-medium-blue focus:border-brand-medium-blue"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const Table = ({ columns, data }) => (
  <div className="overflow-x-auto bg-white border border-gray-200 rounded-xl">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-brand-light-blue">
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              scope="col"
              className="px-4 py-3 text-left text-xs font-semibold text-brand-dark-blue uppercase tracking-wider"
            >
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {data.map((row, idx) => (
          <tr key={row.id ?? idx} className="hover:bg-brand-light-blue/40">
            {columns.map((col) => (
              <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                {col.render ? col.render(row, idx) : row[col.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    () => (location.state?.activeTab === "tutors" ? "tutors" : "students"),
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [tutorStatusFilter, setTutorStatusFilter] = useState("all");
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loadingTutors, setLoadingTutors] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    description: "",
    category: "",
    gradeLevels: [],
  });
  const [subjectMenuAnchor, setSubjectMenuAnchor] = useState(null);
  const [subjectMenuRow, setSubjectMenuRow] = useState(null);
  const [testimonials, setTestimonials] = useState([]);
  const [loadingTestimonials, setLoadingTestimonials] = useState(false);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    testimonial: "",
    testimonialBy: "",
    rating: "",
  });
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [showDeleteTestimonialDialog, setShowDeleteTestimonialDialog] =
    useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState(null);
  const [deletingTestimonial, setDeletingTestimonial] = useState(false);
  const [submittingTestimonial, setSubmittingTestimonial] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [submittingSubject, setSubmittingSubject] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [updatingReview, setUpdatingReview] = useState(null);

  // Students state
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Promo codes state
  const [promoCodes, setPromoCodes] = useState([]);
  const [loadingPromoCodes, setLoadingPromoCodes] = useState(false);
  const [showPromoCodeModal, setShowPromoCodeModal] = useState(false);
  const [promoCodeForm, setPromoCodeForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    validFrom: "",
    validUntil: "",
    usageLimit: "",
  });
  const [submittingPromoCode, setSubmittingPromoCode] = useState(false);

  // Grade levels state
  const [gradeLevels, setGradeLevels] = useState([]);
  const [loadingGradeLevels, setLoadingGradeLevels] = useState(false);
  const [showGradeLevelModal, setShowGradeLevelModal] = useState(false);
  const [gradeLevelForm, setGradeLevelForm] = useState({ name: "" });
  const [submittingGradeLevel, setSubmittingGradeLevel] = useState(false);
  const [editingGradeLevel, setEditingGradeLevel] = useState(null);

  // Suspend tutor state
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspendingTutor, setSuspendingTutor] = useState(false);
  const [tutorToSuspend, setTutorToSuspend] = useState(null);

  const [interviewTopics, setInterviewTopics] = useState([]);
  const [loadingInterview, setLoadingInterview] = useState(false);
  const [showIvTopicModal, setShowIvTopicModal] = useState(false);
  const [ivTopicForm, setIvTopicForm] = useState({
    slug: "",
    title: "",
    sortOrder: 0,
    isActive: true,
  });
  const [editingIvTopicId, setEditingIvTopicId] = useState(null);
  const [showIvQuestionModal, setShowIvQuestionModal] = useState(false);
  const [ivQuestionTopicId, setIvQuestionTopicId] = useState(null);
  const [ivQuestionForm, setIvQuestionForm] = useState({
    optionKey: "",
    body: "",
    sortOrder: 0,
    isActive: true,
  });
  const [editingIvQuestionId, setEditingIvQuestionId] = useState(null);
  const [submittingIv, setSubmittingIv] = useState(false);

  const [summaryStats, setSummaryStats] = useState({
    students: null,
    tutors: null,
    activePromos: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const loadSummaryStats = async () => {
      setSummaryStats((prev) => ({ ...prev, loading: true }));
      try {
        const [studentsData, tutorsData, promoData] = await Promise.all([
          apiRequest("/api/v1/users/students/all?status=all"),
          apiRequest("/api/v1/onboarding/tutors/list?status=all"),
          apiRequest("/api/v1/promo-codes"),
        ]);
        if (cancelled) return;
        const studentList = parseApiList(studentsData, ["students"]);
        const tutorList = parseApiList(tutorsData, ["prospects", "tutors"]);
        const promoList = parseApiList(promoData, ["promoCodes"]);
        setSummaryStats({
          students: studentList.length,
          tutors: tutorList.length,
          activePromos: promoList.filter((p) => p.isActive).length,
          loading: false,
        });
      } catch (err) {
        console.error("Failed to load dashboard summary stats:", err);
        if (!cancelled) {
          setSummaryStats({
            students: 0,
            tutors: 0,
            activePromos: 0,
            loading: false,
          });
        }
      }
    };
    loadSummaryStats();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch tutors when tab is active or filter changes
  useEffect(() => {
    if (activeTab === "tutors") {
      const fetchTutors = async () => {
        setLoadingTutors(true);
        try {
          const data = await apiRequest(
            `/api/v1/onboarding/tutors/list?status=${tutorStatusFilter}`
          );
          // Handle various response shapes
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (Array.isArray(data.prospects)) {
            list = data.prospects;
          } else if (Array.isArray(data.tutors)) {
            list = data.tutors;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }
          setTutors(list);
        } catch (err) {
          console.error("Failed to fetch tutors:", err);
          setTutors([]);
        } finally {
          setLoadingTutors(false);
        }
      };
      fetchTutors();
    }
  }, [activeTab, tutorStatusFilter]);

  const loadDbSubjects = async () => {
    const data = await apiRequest("/api/v1/subjects/admin");
    let list = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (Array.isArray(data.subjects)) {
      list = data.subjects;
    } else if (Array.isArray(data.data)) {
      list = data.data;
    }
    setSubjects(list);
  };

  useEffect(() => {
    if (activeTab === "subjects") {
      const fetchSubjects = async () => {
        setLoadingSubjects(true);
        try {
          await loadDbSubjects();
        } catch (err) {
          console.error("Failed to fetch subjects:", err);
          setSubjects([]);
        } finally {
          setLoadingSubjects(false);
        }
      };
      fetchSubjects();
    }
  }, [activeTab]);

  // Fetch reviews when tab is active
  useEffect(() => {
    if (activeTab === "reviews") {
      const fetchReviews = async () => {
        setLoadingReviews(true);
        try {
          const data = await apiRequest("/api/v1/reviews?status=pending");
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (Array.isArray(data.reviews)) {
            list = data.reviews;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }
          setReviews(list);
        } catch (err) {
          console.error("Failed to fetch reviews:", err);
          setReviews([]);
        } finally {
          setLoadingReviews(false);
        }
      };
      fetchReviews();
    }
  }, [activeTab]);

  // Fetch students when tab is active or filter changes
  useEffect(() => {
    if (activeTab === "students") {
      const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
          const data = await apiRequest(
            `/api/v1/users/students/all?status=${statusFilter}`
          );
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (Array.isArray(data.students)) {
            list = data.students;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }
          setStudents(list);
        } catch (err) {
          console.error("Failed to fetch students:", err);
          setStudents([]);
        } finally {
          setLoadingStudents(false);
        }
      };
      fetchStudents();
    }
  }, [activeTab, statusFilter]);

  // Fetch promo codes when tab is active
  useEffect(() => {
    if (activeTab === "discounts") {
      const fetchPromoCodes = async () => {
        setLoadingPromoCodes(true);
        try {
          const data = await apiRequest("/api/v1/promo-codes");
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (Array.isArray(data.promoCodes)) {
            list = data.promoCodes;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }
          setPromoCodes(list);
        } catch (err) {
          console.error("Failed to fetch promo codes:", err);
          setPromoCodes([]);
        } finally {
          setLoadingPromoCodes(false);
        }
      };
      fetchPromoCodes();
    }
  }, [activeTab]);

  // Fetch grade levels when tab is active
  useEffect(() => {
    if (activeTab === "gradeLevels") {
      const fetchGradeLevels = async () => {
        setLoadingGradeLevels(true);
        try {
          const data = await apiRequest("/api/v1/grade-levels");
          let list = [];
          if (Array.isArray(data)) {
            list = data;
          } else if (Array.isArray(data.gradeLevels)) {
            list = data.gradeLevels;
          } else if (Array.isArray(data.data)) {
            list = data.data;
          }
          setGradeLevels(list);
        } catch (err) {
          console.error("Failed to fetch grade levels:", err);
          setGradeLevels([]);
        } finally {
          setLoadingGradeLevels(false);
        }
      };
      fetchGradeLevels();
    }
  }, [activeTab]);

  const loadInterviewCatalog = async () => {
    const data = await apiRequest(
      "/api/v1/interviews/virtual/questionnaire/admin"
    );
    const list = Array.isArray(data) ? data : [];
    setInterviewTopics(list);
  };

  useEffect(() => {
    if (activeTab === "virtualInterview") {
      const run = async () => {
        setLoadingInterview(true);
        try {
          await loadInterviewCatalog();
        } catch (err) {
          console.error("Failed to load interview questionnaire:", err);
          setInterviewTopics([]);
        } finally {
          setLoadingInterview(false);
        }
      };
      run();
    }
  }, [activeTab]);

  // Fetch testimonials when tab is active
  useEffect(() => {
    if (activeTab === "testimonials") {
      const fetchTestimonials = async () => {
        setLoadingTestimonials(true);
        try {
          const data = await apiRequest("/api/v1/testimonials");
          setTestimonials(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
          console.error("Failed to fetch testimonials:", err);
          setTestimonials([]);
        } finally {
          setLoadingTestimonials(false);
        }
      };
      fetchTestimonials();
    }
  }, [activeTab]);

  const handleOpenTestimonialModal = (testimonial = null) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setTestimonialForm({
        testimonial: testimonial.testimonial,
        testimonialBy: testimonial.testimonialBy,
        rating:
          testimonial.rating != null && testimonial.rating !== ""
            ? String(testimonial.rating)
            : "",
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({ testimonial: "", testimonialBy: "", rating: "" });
    }
    setShowTestimonialModal(true);
  };

  const handleCloseTestimonialModal = () => {
    setShowTestimonialModal(false);
    setTestimonialForm({ testimonial: "", testimonialBy: "", rating: "" });
    setEditingTestimonial(null);
  };

  const handleTestimonialFormChange = (field, value) => {
    setTestimonialForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCloseAlert = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleSaveTestimonial = async () => {
    if (!testimonialForm.testimonial || !testimonialForm.testimonialBy) {
      setSnackbar({
        open: true,
        message: "All fields are required",
        severity: "error",
      });
      return;
    }

    setSubmittingTestimonial(true);
    try {
      const payload = {
        testimonial: testimonialForm.testimonial,
        testimonialBy: testimonialForm.testimonialBy,
      };
      const r = testimonialForm.rating;
      if (r !== "" && r != null) {
        const n = Number(r);
        if (!Number.isNaN(n) && n >= 1 && n <= 5) {
          payload.rating = n;
        }
      }

      if (editingTestimonial) {
        await apiRequest(`/api/v1/testimonials/${editingTestimonial.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setSnackbar({
          open: true,
          message: "Testimonial updated successfully",
          severity: "success",
        });
      } else {
        await apiRequest("/api/v1/testimonials", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setSnackbar({
          open: true,
          message: "Testimonial created successfully",
          severity: "success",
        });
      }

      handleCloseTestimonialModal();

      // Refresh testimonials list
      const data = await apiRequest("/api/v1/testimonials");
      setTestimonials(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to save testimonial:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to save testimonial",
        severity: "error",
      });
    } finally {
      setSubmittingTestimonial(false);
    }
  };

  const handleOpenDeleteTestimonialDialog = (testimonial) => {
    setTestimonialToDelete(testimonial);
    setShowDeleteTestimonialDialog(true);
  };

  const handleCloseDeleteTestimonialDialog = () => {
    setShowDeleteTestimonialDialog(false);
    setTestimonialToDelete(null);
  };

  const handleConfirmDeleteTestimonial = async () => {
    if (!testimonialToDelete) return;

    setDeletingTestimonial(true);
    try {
      await apiRequest(`/api/v1/testimonials/${testimonialToDelete.id}`, {
        method: "DELETE",
      });
      setSnackbar({
        open: true,
        message: "Testimonial deleted successfully",
        severity: "success",
      });

      handleCloseDeleteTestimonialDialog();

      // Refresh testimonials list
      const data = await apiRequest("/api/v1/testimonials");
      setTestimonials(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Failed to delete testimonial:", err);
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete testimonial",
        severity: "error",
      });
    } finally {
      setDeletingTestimonial(false);
    }
  };

  const openMenu = (event, row) => {
    setMenuAnchor(event.currentTarget);
    setMenuRow(row);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuRow(null);
  };

  const viewRow = () => {
    if (menuRow?.id) {
      navigate(`/admin/tutor/${menuRow.id}`);
    }
    closeMenu();
  };

  const handleOpenSuspendModal = () => {
    setTutorToSuspend(menuRow);
    setSuspensionReason("");
    setShowSuspendModal(true);
    closeMenu();
  };

  const handleCloseSuspendModal = () => {
    setShowSuspendModal(false);
    setSuspensionReason("");
    setTutorToSuspend(null);
  };

  const handleSuspendTutor = async () => {
    if (!tutorToSuspend?.userId) {
      alert("Invalid tutor data");
      return;
    }

    setSuspendingTutor(true);
    try {
      await apiRequest(`/api/v1/users/${tutorToSuspend.userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "suspended",
          suspensionReason: suspensionReason,
        }),
      });

      handleCloseSuspendModal();

      // Refresh tutors list
      const data = await apiRequest(
        `/api/v1/onboarding/tutors/list?status=${tutorStatusFilter}`
      );
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.prospects)) {
        list = data.prospects;
      } else if (Array.isArray(data.tutors)) {
        list = data.tutors;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }
      setTutors(list);

      alert("Tutor suspended successfully");
    } catch (err) {
      console.error("Failed to suspend tutor:", err);
      alert(err.message || "Failed to suspend tutor");
    } finally {
      setSuspendingTutor(false);
    }
  };

  const handleOpenSubjectModal = () => {
    setEditingSubjectId(null);
    setSubjectForm({
      name: "",
      description: "",
      category: "",
      gradeLevels: [],
    });
    setShowSubjectModal(true);
  };

  const handleCloseSubjectModal = () => {
    setShowSubjectModal(false);
    setEditingSubjectId(null);
    setSubjectForm({
      name: "",
      description: "",
      category: "",
      gradeLevels: [],
    });
  };

  const handleSubjectFormChange = (field, value) => {
    setSubjectForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSubjectLevel = (level) => {
    setSubjectForm((prev) => {
      const set = new Set(prev.gradeLevels || []);
      if (set.has(level)) {
        set.delete(level);
      } else {
        set.add(level);
      }
      return { ...prev, gradeLevels: Array.from(set) };
    });
  };

  const openSubjectRowMenu = (event, row) => {
    setSubjectMenuAnchor(event.currentTarget);
    setSubjectMenuRow(row);
  };

  const closeSubjectRowMenu = () => {
    setSubjectMenuAnchor(null);
    setSubjectMenuRow(null);
  };

  const handleEditSubjectFromMenu = () => {
    if (!subjectMenuRow) return;
    setEditingSubjectId(subjectMenuRow.id);
    setSubjectForm({
      name: subjectMenuRow.name || "",
      description: subjectMenuRow.description || "",
      category: subjectMenuRow.category || "",
      gradeLevels: Array.isArray(subjectMenuRow.gradeLevels)
        ? [...subjectMenuRow.gradeLevels]
        : [],
    });
    setShowSubjectModal(true);
    closeSubjectRowMenu();
  };

  const handleDeleteSubjectFromMenu = async () => {
    const id = subjectMenuRow?.id;
    closeSubjectRowMenu();
    if (!id) return;
    if (!window.confirm("Delete this subject from the database?")) {
      return;
    }
    try {
      await apiRequest(`/api/v1/subjects/${id}`, { method: "DELETE" });
      await loadDbSubjects();
    } catch (err) {
      console.error("Failed to delete subject:", err);
      alert(err.message || "Failed to delete subject");
    }
  };

  const handleSaveSubject = async () => {
    if (!subjectForm.name || !subjectForm.category) {
      alert("Name and Category are required");
      return;
    }
    setSubmittingSubject(true);
    try {
      const payload = {
        name: subjectForm.name,
        category: subjectForm.category,
        description: subjectForm.description || undefined,
        gradeLevels: subjectForm.gradeLevels?.length
          ? subjectForm.gradeLevels
          : [],
      };
      if (editingSubjectId) {
        await apiRequest(`/api/v1/subjects/${editingSubjectId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest("/api/v1/subjects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      handleCloseSubjectModal();
      await loadDbSubjects();
    } catch (err) {
      console.error("Failed to save subject:", err);
      alert(err.message || "Failed to save subject");
    } finally {
      setSubmittingSubject(false);
    }
  };

  const handleUpdateReviewStatus = async (reviewId, status) => {
    setUpdatingReview(reviewId);
    try {
      await apiRequest(`/api/v1/reviews/${reviewId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      // Remove the review from the list after successful update
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      console.error("Failed to update review status:", err);
      alert(err.message || "Failed to update review status");
    } finally {
      setUpdatingReview(null);
    }
  };

  const handleOpenPromoCodeModal = () => {
    setPromoCodeForm({
      code: "",
      discountType: "percentage",
      discountValue: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
    });
    setShowPromoCodeModal(true);
  };

  const handleClosePromoCodeModal = () => {
    setShowPromoCodeModal(false);
    setPromoCodeForm({
      code: "",
      discountType: "percentage",
      discountValue: "",
      validFrom: "",
      validUntil: "",
      usageLimit: "",
    });
  };

  const handlePromoCodeFormChange = (field, value) => {
    if (field === "discountValue") {
      setPromoCodeForm((prev) => {
        let next = sanitizePositiveDecimalInput(value);
        if (
          prev.discountType === "percentage" &&
          next !== "" &&
          Number(next) > 100
        ) {
          next = "100";
        }
        return { ...prev, discountValue: next };
      });
      return;
    }
    if (field === "usageLimit") {
      setPromoCodeForm((prev) => ({
        ...prev,
        usageLimit: sanitizePositiveIntInput(value),
      }));
      return;
    }
    if (field === "discountType") {
      setPromoCodeForm((prev) => {
        const next = { ...prev, discountType: value };
        if (
          value === "percentage" &&
          next.discountValue !== "" &&
          Number(next.discountValue) > 100
        ) {
          next.discountValue = "100";
        }
        return next;
      });
      return;
    }
    setPromoCodeForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreatePromoCode = async () => {
    if (!promoCodeForm.code || !promoCodeForm.discountValue) {
      alert("Code and Discount Value are required");
      return;
    }
    const discountNum = parseFloat(promoCodeForm.discountValue);
    if (Number.isNaN(discountNum) || discountNum <= 0) {
      alert("Discount value must be greater than 0");
      return;
    }
    if (promoCodeForm.discountType === "percentage" && discountNum > 100) {
      alert("Discount percentage cannot exceed 100");
      return;
    }
    if (promoCodeForm.usageLimit !== "") {
      const usageNum = parseInt(promoCodeForm.usageLimit, 10);
      if (Number.isNaN(usageNum) || usageNum < 1) {
        alert("Usage limit must be a positive whole number (at least 1)");
        return;
      }
    }
    setSubmittingPromoCode(true);
    try {
      const payload = {
        code: promoCodeForm.code,
        discountType: promoCodeForm.discountType,
        discountValue: parseFloat(promoCodeForm.discountValue),
      };

      // Add optional fields only if they have values
      if (promoCodeForm.validFrom) {
        payload.validFrom = new Date(promoCodeForm.validFrom).toISOString();
      }
      if (promoCodeForm.validUntil) {
        payload.validUntil = new Date(promoCodeForm.validUntil).toISOString();
      }
      if (promoCodeForm.usageLimit) {
        payload.usageLimit = parseInt(promoCodeForm.usageLimit);
      }

      await apiRequest("/api/v1/promo-codes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      handleClosePromoCodeModal();
      // Refresh promo codes list
      const data = await apiRequest("/api/v1/promo-codes");
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.promoCodes)) {
        list = data.promoCodes;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }
      setPromoCodes(list);
      setSummaryStats((prev) => ({
        ...prev,
        activePromos: list.filter((p) => p.isActive).length,
      }));
    } catch (err) {
      console.error("Failed to create promo code:", err);
      alert(err.message || "Failed to create promo code");
    } finally {
      setSubmittingPromoCode(false);
    }
  };

  const handleDeactivatePromoCode = async (promoCodeId) => {
    if (
      !window.confirm("Are you sure you want to deactivate this promo code?")
    ) {
      return;
    }
    try {
      await apiRequest(`/api/v1/promo-codes/${promoCodeId}/deactivate`, {
        method: "PATCH",
      });
      // Refresh promo codes list
      const data = await apiRequest("/api/v1/promo-codes");
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.promoCodes)) {
        list = data.promoCodes;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }
      setPromoCodes(list);
      setSummaryStats((prev) => ({
        ...prev,
        activePromos: list.filter((p) => p.isActive).length,
      }));
    } catch (err) {
      console.error("Failed to deactivate promo code:", err);
      alert(err.message || "Failed to deactivate promo code");
    }
  };

  const handleOpenGradeLevelModal = (gradeLevel = null) => {
    if (gradeLevel) {
      setEditingGradeLevel(gradeLevel);
      setGradeLevelForm({ name: gradeLevel.name });
    } else {
      setEditingGradeLevel(null);
      setGradeLevelForm({ name: "" });
    }
    setShowGradeLevelModal(true);
  };

  const handleCloseGradeLevelModal = () => {
    setShowGradeLevelModal(false);
    setGradeLevelForm({ name: "" });
    setEditingGradeLevel(null);
  };

  const handleGradeLevelFormChange = (field, value) => {
    setGradeLevelForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGradeLevel = async () => {
    if (!gradeLevelForm.name) {
      alert("Name is required");
      return;
    }
    setSubmittingGradeLevel(true);
    try {
      if (editingGradeLevel) {
        // Update existing grade level
        await apiRequest(`/api/v1/grade-levels/${editingGradeLevel.id}`, {
          method: "PUT",
          body: JSON.stringify(gradeLevelForm),
        });
      } else {
        // Create new grade level
        await apiRequest("/api/v1/grade-levels", {
          method: "POST",
          body: JSON.stringify(gradeLevelForm),
        });
      }
      handleCloseGradeLevelModal();
      // Refresh grade levels list
      const data = await apiRequest("/api/v1/grade-levels");
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.gradeLevels)) {
        list = data.gradeLevels;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }
      setGradeLevels(list);
    } catch (err) {
      console.error("Failed to save grade level:", err);
      alert(err.message || "Failed to save grade level");
    } finally {
      setSubmittingGradeLevel(false);
    }
  };

  const handleDeleteGradeLevel = async (gradeLevelId) => {
    if (!window.confirm("Are you sure you want to delete this grade level?")) {
      return;
    }
    try {
      await apiRequest(`/api/v1/grade-levels/${gradeLevelId}`, {
        method: "DELETE",
      });
      // Refresh grade levels list
      const data = await apiRequest("/api/v1/grade-levels");
      let list = [];
      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data.gradeLevels)) {
        list = data.gradeLevels;
      } else if (Array.isArray(data.data)) {
        list = data.data;
      }
      setGradeLevels(list);
    } catch (err) {
      console.error("Failed to delete grade level:", err);
      alert(err.message || "Failed to delete grade level");
    }
  };

  const openIvTopicModal = (topic = null) => {
    if (topic) {
      setEditingIvTopicId(topic.id);
      setIvTopicForm({
        slug: topic.slug || "",
        title: topic.title || "",
        sortOrder: clampSortOrder(topic.sortOrder ?? 0),
        isActive: topic.isActive !== false,
      });
    } else {
      setEditingIvTopicId(null);
      setIvTopicForm({ slug: "", title: "", sortOrder: 0, isActive: true });
    }
    setShowIvTopicModal(true);
  };

  const closeIvTopicModal = () => {
    setShowIvTopicModal(false);
    setEditingIvTopicId(null);
    setIvTopicForm({ slug: "", title: "", sortOrder: 0, isActive: true });
  };

  const saveIvTopic = async () => {
    if (!ivTopicForm.slug?.trim() || !ivTopicForm.title?.trim()) {
      alert("Slug and title are required");
      return;
    }
    setSubmittingIv(true);
    try {
      const payload = {
        slug: ivTopicForm.slug.trim(),
        title: ivTopicForm.title.trim(),
        sortOrder: clampSortOrder(ivTopicForm.sortOrder),
        isActive: !!ivTopicForm.isActive,
      };
      if (editingIvTopicId) {
        await apiRequest(
          `/api/v1/interviews/virtual/topics/${editingIvTopicId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest("/api/v1/interviews/virtual/topics", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      closeIvTopicModal();
      await loadInterviewCatalog();
    } catch (err) {
      alert(err.message || "Failed to save topic");
    } finally {
      setSubmittingIv(false);
    }
  };

  const deleteIvTopic = async (id) => {
    if (!window.confirm("Delete this topic and all of its questions?")) return;
    try {
      await apiRequest(`/api/v1/interviews/virtual/topics/${id}`, {
        method: "DELETE",
      });
      await loadInterviewCatalog();
    } catch (err) {
      alert(err.message || "Failed to delete topic");
    }
  };

  const getIvTopicById = (topicId) =>
    interviewTopics.find((t) => t.id === topicId);

  const isIvQuestionSortOrderTaken = (topicId, sortOrder, excludeQuestionId = null) => {
    const topic = getIvTopicById(topicId);
    const questions = topic?.questions || [];
    return questions.some(
      (q) => clampSortOrder(q.sortOrder ?? 0) === sortOrder && q.id !== excludeQuestionId,
    );
  };

  const getNextIvQuestionSortOrder = (topicId) => {
    const topic = getIvTopicById(topicId);
    const used = new Set(
      (topic?.questions || []).map((q) => clampSortOrder(q.sortOrder ?? 0)),
    );
    let n = 0;
    while (used.has(n)) n += 1;
    return n;
  };

  const openIvQuestionModal = (topicId, question = null) => {
    setIvQuestionTopicId(topicId);
    if (question) {
      setEditingIvQuestionId(question.id);
      setIvQuestionForm({
        optionKey: question.optionKey || "",
        body: question.body || "",
        sortOrder: clampSortOrder(question.sortOrder ?? 0),
        isActive: question.isActive !== false,
      });
    } else {
      setEditingIvQuestionId(null);
      setIvQuestionForm({
        optionKey: "",
        body: "",
        sortOrder: getNextIvQuestionSortOrder(topicId),
        isActive: true,
      });
    }
    setShowIvQuestionModal(true);
  };

  const closeIvQuestionModal = () => {
    setShowIvQuestionModal(false);
    setIvQuestionTopicId(null);
    setEditingIvQuestionId(null);
    setIvQuestionForm({
      optionKey: "",
      body: "",
      sortOrder: 0,
      isActive: true,
    });
  };

  const saveIvQuestion = async () => {
    if (!ivQuestionTopicId) return;
    if (!ivQuestionForm.optionKey?.trim() || !ivQuestionForm.body?.trim()) {
      alert("Option key and question text are required");
      return;
    }
    const sortOrder = clampSortOrder(ivQuestionForm.sortOrder);
    if (isIvQuestionSortOrderTaken(ivQuestionTopicId, sortOrder, editingIvQuestionId)) {
      alert(
        `Sort order ${sortOrder} is already used by another question in this topic. Each question must have a unique sort order.`,
      );
      return;
    }
    setSubmittingIv(true);
    try {
      const payload = {
        optionKey: ivQuestionForm.optionKey.trim(),
        body: ivQuestionForm.body.trim(),
        sortOrder,
        isActive: !!ivQuestionForm.isActive,
      };
      if (editingIvQuestionId) {
        await apiRequest(
          `/api/v1/interviews/virtual/questions/${editingIvQuestionId}`,
          {
            method: "PATCH",
            body: JSON.stringify(payload),
          }
        );
      } else {
        await apiRequest(
          `/api/v1/interviews/virtual/topics/${ivQuestionTopicId}/questions`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }
      closeIvQuestionModal();
      await loadInterviewCatalog();
    } catch (err) {
      alert(err.message || "Failed to save question");
    } finally {
      setSubmittingIv(false);
    }
  };

  const deleteIvQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await apiRequest(`/api/v1/interviews/virtual/questions/${id}`, {
        method: "DELETE",
      });
      await loadInterviewCatalog();
    } catch (err) {
      alert(err.message || "Failed to delete question");
    }
  };

  const statIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
    >
      <path d="M3.75 3A.75.75 0 003 3.75v16.5c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75V3.75A.75.75 0 0020.25 3H3.75zM5.25 6h3v12h-3V6zm4.5 6h3v6h-3v-6zm4.5-4h3v10h-3V8z" />
    </svg>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Overview and management of platform entities.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Students"
          value={
            summaryStats.loading
              ? "—"
              : summaryStats.students ?? "—"
          }
          subtitle="All students"
          icon={statIcon}
        />
        <StatCard
          title="Tutors"
          value={
            summaryStats.loading ? "—" : summaryStats.tutors ?? "—"
          }
          subtitle="All tutors"
          icon={statIcon}
        />
        <StatCard
          title="Active Promo Codes"
          value={
            summaryStats.loading ? "—" : summaryStats.activePromos ?? "—"
          }
          subtitle="Active promotions"
          icon={statIcon}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <TabButton
          active={activeTab === "students"}
          onClick={() => setActiveTab("students")}
        >
          Students
        </TabButton>
        <TabButton
          active={activeTab === "tutors"}
          onClick={() => setActiveTab("tutors")}
        >
          Tutors
        </TabButton>
        <TabButton
          active={activeTab === "subjects"}
          onClick={() => setActiveTab("subjects")}
        >
          Subjects
        </TabButton>
        <TabButton
          active={activeTab === "gradeLevels"}
          onClick={() => setActiveTab("gradeLevels")}
        >
          Grade Levels
        </TabButton>
        <TabButton
          active={activeTab === "virtualInterview"}
          onClick={() => setActiveTab("virtualInterview")}
        >
          Virtual Interview
        </TabButton>
        <TabButton
          active={activeTab === "discounts"}
          onClick={() => setActiveTab("discounts")}
        >
          Discounts
        </TabButton>
        <TabButton
          active={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews
        </TabButton>
        <TabButton
          active={activeTab === "testimonials"}
          onClick={() => setActiveTab("testimonials")}
        >
          Testimonials
        </TabButton>
      </div>

      {/* Content */}
      {activeTab === "students" && (
        <section className="space-y-4">
          <SectionHeader
            title="Students"
            right={
              <FilterDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "suspended", label: "Suspended" },
                  { value: "pending", label: "Pending" },
                ]}
              />
            }
          />
          {loadingStudents ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No students found for this status.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                { key: "firstName", header: "First Name" },
                { key: "lastName", header: "Last Name" },
                { key: "email", header: "Email" },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => {
                    const statusColors = {
                      active: "bg-green-50 text-green-700",
                      inactive: "bg-gray-50 text-gray-700",
                      suspended: "bg-red-50 text-red-700",
                      pending: "bg-amber-50 text-amber-700",
                    };
                    return (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          statusColors[row.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.status}
                      </span>
                    );
                  },
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end">
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, row)}
                      >
                        <DotsVerticalIcon />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
              data={students}
            />
          )}

          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={viewRow}>View</MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === "tutors" && (
        <section className="space-y-4">
          <SectionHeader
            title="Tutors"
            right={
              <FilterDropdown
                value={tutorStatusFilter}
                onChange={setTutorStatusFilter}
                options={[
                  { value: "all", label: "All" },
                  { value: "active", label: "Active" },
                  { value: "pending", label: "Pending" },
                  { value: "awaiting_interview", label: "Awaiting Interview" },
                  { value: "suspended", label: "Suspended" },
                  { value: "rejected", label: "Rejected" },
                  { value: "deactivated", label: "Deactivated" },
                ]}
              />
            }
          />
          {loadingTutors ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : tutors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tutors found for this status.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                { key: "fullName", header: "Name" },
                { key: "subjects", header: "Subjects" },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => {
                    const statusColors = {
                      active: "bg-green-50 text-green-700",
                      pending: "bg-amber-50 text-amber-700",
                      awaiting_interview:
                        "bg-brand-light-blue text-brand-dark-blue",
                      suspended: "bg-red-50 text-red-700",
                      rejected: "bg-gray-50 text-gray-700",
                      deactivated: "bg-gray-100 text-gray-600",
                    };
                    return (
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          statusColors[row.status] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {row.status?.replace("_", " ")}
                      </span>
                    );
                  },
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end">
                      <IconButton
                        size="small"
                        onClick={(e) => openMenu(e, row)}
                      >
                        <DotsVerticalIcon />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
              data={tutors}
            />
          )}
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
          >
            <MenuItem onClick={viewRow}>View</MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === "subjects" && (
        <section className="space-y-4">
          <SectionHeader
            title="Subjects"
            right={
              <button
                onClick={handleOpenSubjectModal}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white text-sm px-4 py-2 rounded-md font-medium transition-colors shadow-lg"
              >
                Add Subject
              </button>
            }
          />
          {loadingSubjects ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subjects found.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                { key: "name", header: "Name" },
                { key: "category", header: "Category" },
                {
                  key: "gradeLevels",
                  header: "Levels",
                  render: (row) => (
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(row.gradeLevels) ? row.gradeLevels : [])
                        .length === 0 ? (
                        <span className="text-gray-400 text-xs">—</span>
                      ) : (
                        row.gradeLevels.map((lvl) => (
                          <span
                            key={lvl}
                            className="inline-flex items-center rounded-full bg-blue-50 text-blue-800 border border-blue-100 px-2 py-0.5 text-xs font-medium"
                          >
                            {lvl}
                          </span>
                        ))
                      )}
                    </div>
                  ),
                },
                {
                  key: "description",
                  header: "Description",
                  render: (row) => (
                    <span className="text-gray-600">
                      {row.description || "N/A"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end">
                      <IconButton
                        size="small"
                        onClick={(e) => openSubjectRowMenu(e, row)}
                      >
                        <DotsVerticalIcon />
                      </IconButton>
                    </div>
                  ),
                },
              ]}
              data={subjects}
            />
          )}
          <Menu
            anchorEl={subjectMenuAnchor}
            open={Boolean(subjectMenuAnchor)}
            onClose={closeSubjectRowMenu}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleEditSubjectFromMenu}>Edit</MenuItem>
            <MenuItem
              onClick={handleDeleteSubjectFromMenu}
              className="text-red-600"
            >
              Delete
            </MenuItem>
          </Menu>
        </section>
      )}

      {activeTab === "gradeLevels" && (
        <section className="space-y-4">
          <SectionHeader
            title="Grade Levels"
            right={
              <button
                onClick={() => handleOpenGradeLevelModal()}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white text-sm px-4 py-2 rounded-md font-medium transition-colors shadow-lg"
              >
                Add Grade Level
              </button>
            }
          />
          {loadingGradeLevels ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : gradeLevels.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No grade levels found.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                { key: "name", header: "Name" },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenGradeLevelModal(row)}
                        className="text-brand-medium-blue hover:text-brand-dark-blue text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteGradeLevel(row.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              data={gradeLevels}
            />
          )}
        </section>
      )}

      {activeTab === "virtualInterview" && (
        <section className="space-y-4">
          <SectionHeader
            title="Virtual interview questionnaire"
            right={
              <button
                type="button"
                onClick={() => openIvTopicModal()}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white text-sm px-4 py-2 rounded-md font-medium transition-colors shadow-lg"
              >
                Add topic
              </button>
            }
          />
          <p className="text-sm text-gray-600 max-w-3xl">
            Topics and questions appear on the tutor Virtual Interview step.
            Tutors pick one question per topic and upload a video. Use stable
            slugs when possible so saved tutor progress keeps working.
          </p>
          {loadingInterview ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : interviewTopics.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No topics yet.</div>
          ) : (
            <div className="space-y-4">
              {interviewTopics.map((topic, ti) => (
                <div
                  key={topic.id}
                  className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-brand-light-blue/50 border-b border-gray-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-semibold text-brand-dark-blue shrink-0">
                        {ti + 1}.
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {topic.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          slug:{" "}
                          <code className="bg-gray-100 px-1 rounded">
                            {topic.slug}
                          </code>{" "}
                          · sort {topic.sortOrder} ·{" "}
                          {topic.isActive ? "active" : "inactive"}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openIvTopicModal(topic)}
                        className="text-sm text-brand-medium-blue font-medium hover:underline"
                      >
                        Edit topic
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteIvTopic(topic.id)}
                        className="text-sm text-red-600 font-medium hover:underline"
                      >
                        Delete topic
                      </button>
                      <button
                        type="button"
                        onClick={() => openIvQuestionModal(topic.id)}
                        className="text-sm px-3 py-1 rounded-md bg-brand-medium-blue text-white"
                      >
                        Add question
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 text-left text-xs uppercase text-gray-600">
                        <tr>
                          <th className="px-4 py-2 w-16">Opt</th>
                          <th className="px-4 py-2">Question</th>
                          <th className="px-4 py-2 w-20">Sort</th>
                          <th className="px-4 py-2 w-28">Active</th>
                          <th className="px-4 py-2 w-40"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(topic.questions || []).map((q) => (
                          <tr key={q.id}>
                            <td className="px-4 py-2 font-mono text-gray-800">
                              {q.optionKey}
                            </td>
                            <td className="px-4 py-2 text-gray-700 max-w-xl">
                              {q.body}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {q.sortOrder}
                            </td>
                            <td className="px-4 py-2">
                              {q.isActive ? "Yes" : "No"}
                            </td>
                            <td className="px-4 py-2 text-right space-x-2">
                              <button
                                type="button"
                                className="text-brand-medium-blue text-xs font-medium"
                                onClick={() => openIvQuestionModal(topic.id, q)}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="text-red-600 text-xs font-medium"
                                onClick={() => deleteIvQuestion(q.id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "discounts" && (
        <section className="space-y-4">
          <SectionHeader
            title="Promo Codes"
            right={
              <button
                onClick={handleOpenPromoCodeModal}
                className="bg-amber-600 hover:bg-amber-700 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors"
              >
                Create Promo Code
              </button>
            }
          />
          {loadingPromoCodes ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : promoCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No promo codes found.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                { key: "code", header: "Code" },
                {
                  key: "discountType",
                  header: "Type",
                  render: (row) => (
                    <span className="capitalize">{row.discountType}</span>
                  ),
                },
                {
                  key: "discountValue",
                  header: "Value",
                  render: (row) => (
                    <span>
                      {row.discountType === "percentage"
                        ? `${row.discountValue}%`
                        : `$${row.discountValue}`}
                    </span>
                  ),
                },
                {
                  key: "usedCount",
                  header: "Used",
                  render: (row) => (
                    <span>
                      {row.usedCount || 0} / {row.usageLimit || "∞"}
                    </span>
                  ),
                },
                {
                  key: "validUntil",
                  header: "Expires",
                  render: (row) => (
                    <span className="text-xs">
                      {row.validUntil
                        ? new Date(row.validUntil).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Never"}
                    </span>
                  ),
                },
                {
                  key: "isActive",
                  header: "Status",
                  render: (row) => (
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        row.isActive
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {row.isActive ? "Active" : "Inactive"}
                    </span>
                  ),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      {row.isActive && (
                        <button
                          onClick={() => handleDeactivatePromoCode(row.id)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
              data={promoCodes}
            />
          )}
        </section>
      )}

      {activeTab === "reviews" && (
        <section className="space-y-4">
          <SectionHeader
            title="Pending Reviews"
            right={
              <div className="text-sm text-gray-500">
                Pending: {reviews.length}
              </div>
            }
          />
          {loadingReviews ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No pending reviews to moderate.
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="font-semibold text-gray-900">
                          {review.student?.firstName} {review.student?.lastName}
                        </div>
                        <span className="text-gray-400">→</span>
                        <div className="font-medium text-gray-700">
                          {review.tutor?.fullName || "Unknown Tutor"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-amber-500 font-medium text-lg">
                          {Array.from({ length: review.rating || 0 })
                            .map((_, i) => "★")
                            .join("")}
                          {Array.from({ length: 5 - (review.rating || 0) })
                            .map((_, i) => "☆")
                            .join("")}
                        </div>
                        <span className="text-sm text-gray-500">
                          ({review.rating}/5)
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed">
                        {review.comment}
                      </p>
                      {review.createdAt && (
                        <p className="text-xs text-gray-400 mt-2">
                          Submitted:{" "}
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() =>
                        handleUpdateReviewStatus(review.id, "rejected")
                      }
                      disabled={updatingReview === review.id}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingReview === review.id
                        ? "Processing..."
                        : "Reject"}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateReviewStatus(review.id, "approved")
                      }
                      disabled={updatingReview === review.id}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingReview === review.id
                        ? "Processing..."
                        : "Approve"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      <Dialog
        open={showSubjectModal}
        onClose={handleCloseSubjectModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingSubjectId ? "Edit Subject" : "Add New Subject"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Name"
              required
              fullWidth
              value={subjectForm.name}
              onChange={(e) => handleSubjectFormChange("name", e.target.value)}
              variant="outlined"
            />
            <TextField
              label="Category"
              required
              fullWidth
              value={subjectForm.category}
              onChange={(e) =>
                handleSubjectFormChange("category", e.target.value)
              }
              variant="outlined"
            />
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                Education levels
              </div>
              <FormGroup row>
                {SUBJECT_LEVEL_OPTIONS.map((lvl) => (
                  <FormControlLabel
                    key={lvl}
                    control={
                      <Checkbox
                        size="small"
                        checked={(subjectForm.gradeLevels || []).includes(lvl)}
                        onChange={() => toggleSubjectLevel(lvl)}
                      />
                    }
                    label={lvl}
                  />
                ))}
              </FormGroup>
            </div>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={subjectForm.description}
              onChange={(e) =>
                handleSubjectFormChange("description", e.target.value)
              }
              variant="outlined"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSubjectModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveSubject}
            variant="contained"
            color="primary"
            disabled={
              submittingSubject || !subjectForm.name || !subjectForm.category
            }
          >
            {submittingSubject
              ? editingSubjectId
                ? "Saving..."
                : "Creating..."
              : editingSubjectId
              ? "Save changes"
              : "Create Subject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Grade Level Modal */}
      <Dialog
        open={showGradeLevelModal}
        onClose={handleCloseGradeLevelModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingGradeLevel ? "Edit Grade Level" : "Add New Grade Level"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Name"
              required
              fullWidth
              value={gradeLevelForm.name}
              onChange={(e) =>
                handleGradeLevelFormChange("name", e.target.value)
              }
              variant="outlined"
              placeholder="e.g., High School"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseGradeLevelModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveGradeLevel}
            variant="contained"
            color="primary"
            disabled={submittingGradeLevel || !gradeLevelForm.name}
          >
            {submittingGradeLevel
              ? editingGradeLevel
                ? "Updating..."
                : "Creating..."
              : editingGradeLevel
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showIvTopicModal}
        onClose={closeIvTopicModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingIvTopicId ? "Edit interview topic" : "Add interview topic"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Slug (stable id)"
              required
              fullWidth
              disabled={!!editingIvTopicId}
              value={ivTopicForm.slug}
              onChange={(e) =>
                setIvTopicForm((f) => ({ ...f, slug: e.target.value }))
              }
              variant="outlined"
              helperText={
                editingIvTopicId
                  ? "Slug cannot be changed after create."
                  : "e.g. teachingPhilosophy"
              }
            />
            <TextField
              label="Title"
              required
              fullWidth
              value={ivTopicForm.title}
              onChange={(e) =>
                setIvTopicForm((f) => ({ ...f, title: e.target.value }))
              }
              variant="outlined"
            />
            <TextField
              label="Sort order"
              type="number"
              fullWidth
              value={ivTopicForm.sortOrder}
              onChange={(e) =>
                setIvTopicForm((f) => ({
                  ...f,
                  sortOrder: sortOrderInputFromString(e.target.value),
                }))
              }
              onKeyDown={sortOrderKeyDownBlockInvalid}
              variant="outlined"
              inputProps={{ min: 0, step: 1, inputMode: "numeric" }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!ivTopicForm.isActive}
                  onChange={(e) =>
                    setIvTopicForm((f) => ({
                      ...f,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIvTopicModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={saveIvTopic}
            variant="contained"
            color="primary"
            disabled={submittingIv}
          >
            {submittingIv ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showIvQuestionModal}
        onClose={closeIvQuestionModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingIvQuestionId ? "Edit question" : "Add question"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Option key"
              required
              fullWidth
              disabled={!!editingIvQuestionId}
              value={ivQuestionForm.optionKey}
              onChange={(e) =>
                setIvQuestionForm((f) => ({ ...f, optionKey: e.target.value }))
              }
              variant="outlined"
              helperText={
                editingIvQuestionId
                  ? "Option key cannot be changed."
                  : "e.g. A, B, C"
              }
            />
            <TextField
              label="Question text"
              required
              fullWidth
              multiline
              minRows={4}
              value={ivQuestionForm.body}
              onChange={(e) =>
                setIvQuestionForm((f) => ({ ...f, body: e.target.value }))
              }
              variant="outlined"
            />
            <TextField
              label="Sort order"
              type="number"
              fullWidth
              value={ivQuestionForm.sortOrder}
              onChange={(e) =>
                setIvQuestionForm((f) => ({
                  ...f,
                  sortOrder: sortOrderInputFromString(e.target.value),
                }))
              }
              onKeyDown={sortOrderKeyDownBlockInvalid}
              variant="outlined"
              inputProps={{ min: 0, step: 1, inputMode: "numeric" }}
              helperText="Must be unique within this topic (0, 1, 2, …)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!ivQuestionForm.isActive}
                  onChange={(e) =>
                    setIvQuestionForm((f) => ({
                      ...f,
                      isActive: e.target.checked,
                    }))
                  }
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeIvQuestionModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={saveIvQuestion}
            variant="contained"
            color="primary"
            disabled={submittingIv}
          >
            {submittingIv ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Suspend Tutor Modal */}
      <Dialog
        open={showSuspendModal}
        onClose={handleCloseSuspendModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Suspend Tutor</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-gray-600 mb-4">
              You are about to suspend{" "}
              <strong>{tutorToSuspend?.fullName}</strong>. Please provide a
              reason for this suspension.
            </p>
            <TextField
              label="Suspension Reason"
              required
              fullWidth
              multiline
              rows={4}
              value={suspensionReason}
              onChange={(e) => setSuspensionReason(e.target.value)}
              variant="outlined"
              placeholder="e.g., Violated terms of service"
              helperText="This reason will be recorded and may be shared with the tutor"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSuspendModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSuspendTutor}
            variant="contained"
            color="error"
            disabled={suspendingTutor || !suspensionReason.trim()}
          >
            {suspendingTutor ? "Suspending..." : "Suspend Tutor"}
          </Button>
        </DialogActions>
      </Dialog>

      {activeTab === "testimonials" && (
        <section className="space-y-4">
          <SectionHeader
            title="Testimonials"
            right={
              <button
                onClick={() => handleOpenTestimonialModal()}
                className="bg-brand-medium-blue hover:bg-brand-dark-blue text-white text-sm px-4 py-2 rounded-md font-medium transition-colors"
              >
                Add Testimonial
              </button>
            }
          />
          {loadingTestimonials ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-medium-blue"></div>
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No testimonials found.
            </div>
          ) : (
            <Table
              columns={[
                {
                  key: "index",
                  header: "#",
                  render: (_row, idx) => (
                    <span className="text-gray-500">{idx + 1}</span>
                  ),
                },
                {
                  key: "testimonial",
                  header: "Testimonial",
                  render: (row) => (
                    <div className="max-w-md truncate">{row.testimonial}</div>
                  ),
                },
                { key: "testimonialBy", header: "By" },
                {
                  key: "rating",
                  header: "Rating (internal)",
                  render: (row) => (row.rating != null ? row.rating : "—"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenTestimonialModal(row)}
                        className="text-brand-medium-blue hover:text-brand-dark-blue text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleOpenDeleteTestimonialDialog(row)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              data={testimonials}
            />
          )}
        </section>
      )}

      {/* Testimonial Modal */}
      <Dialog
        open={showTestimonialModal}
        onClose={handleCloseTestimonialModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTestimonial ? "Edit Testimonial" : "Add Testimonial"}
        </DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Testimonial"
              required
              fullWidth
              multiline
              rows={4}
              value={testimonialForm.testimonial}
              onChange={(e) =>
                handleTestimonialFormChange("testimonial", e.target.value)
              }
              variant="outlined"
              placeholder="Enter the testimonial text..."
              disabled={submittingTestimonial}
            />
            <TextField
              label="Testimonial By"
              required
              fullWidth
              value={testimonialForm.testimonialBy}
              onChange={(e) =>
                handleTestimonialFormChange("testimonialBy", e.target.value)
              }
              variant="outlined"
              placeholder="e.g., John Doe"
              disabled={submittingTestimonial}
            />
            <TextField
              label="Star rating (internal only, 1–5)"
              fullWidth
              type="number"
              value={testimonialForm.rating}
              onChange={(e) =>
                handleTestimonialFormChange("rating", e.target.value)
              }
              variant="outlined"
              placeholder="Optional"
              disabled={submittingTestimonial}
              inputProps={{ min: 1, max: 5 }}
              helperText="Not shown on the public website; stored for internal reporting."
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseTestimonialModal}
            color="inherit"
            disabled={submittingTestimonial}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveTestimonial}
            variant="contained"
            color="primary"
            disabled={
              submittingTestimonial ||
              !testimonialForm.testimonial ||
              !testimonialForm.testimonialBy
            }
            startIcon={
              submittingTestimonial && (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )
            }
          >
            {submittingTestimonial
              ? editingTestimonial
                ? "Updating..."
                : "Creating..."
              : editingTestimonial
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Promo Code Modal */}
      <Dialog
        open={showPromoCodeModal}
        onClose={handleClosePromoCodeModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Promo Code</DialogTitle>
        <DialogContent>
          <div className="space-y-4 pt-2">
            <TextField
              label="Promo Code"
              required
              fullWidth
              value={promoCodeForm.code}
              onChange={(e) =>
                handlePromoCodeFormChange("code", e.target.value.toUpperCase())
              }
              variant="outlined"
              placeholder="e.g., WELCOME2025"
            />
            <TextField
              label="Discount Type"
              required
              fullWidth
              select
              value={promoCodeForm.discountType}
              onChange={(e) =>
                handlePromoCodeFormChange("discountType", e.target.value)
              }
              variant="outlined"
              SelectProps={{ native: true }}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </TextField>
            <TextField
              label={
                promoCodeForm.discountType === "percentage"
                  ? "Discount Percentage"
                  : "Discount Amount"
              }
              required
              fullWidth
              type="number"
              value={promoCodeForm.discountValue}
              onChange={(e) =>
                handlePromoCodeFormChange("discountValue", e.target.value)
              }
              onKeyDown={blockNegativeNumberKeys}
              variant="outlined"
              inputProps={{
                min: 0,
                max: promoCodeForm.discountType === "percentage" ? 100 : undefined,
                step: promoCodeForm.discountType === "percentage" ? 1 : "0.01",
              }}
              placeholder={
                promoCodeForm.discountType === "percentage"
                  ? "e.g., 30"
                  : "e.g., 5"
              }
            />
            <TextField
              label="Valid From (Optional)"
              fullWidth
              type="datetime-local"
              value={promoCodeForm.validFrom}
              onChange={(e) =>
                handlePromoCodeFormChange("validFrom", e.target.value)
              }
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              helperText="When the promo code becomes active"
            />
            <TextField
              label="Valid Until (Optional)"
              fullWidth
              type="datetime-local"
              value={promoCodeForm.validUntil}
              onChange={(e) =>
                handlePromoCodeFormChange("validUntil", e.target.value)
              }
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              helperText="When the promo code expires"
            />
            <TextField
              label="Usage Limit (Optional)"
              fullWidth
              type="number"
              value={promoCodeForm.usageLimit}
              onChange={(e) =>
                handlePromoCodeFormChange("usageLimit", e.target.value)
              }
              onKeyDown={blockNegativeNumberKeys}
              variant="outlined"
              inputProps={{ min: 1, step: 1 }}
              placeholder="Leave empty for unlimited"
              helperText="Maximum number of times this code can be used (minimum 1)"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePromoCodeModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleCreatePromoCode}
            variant="contained"
            color="primary"
            disabled={
              submittingPromoCode ||
              !promoCodeForm.code ||
              !promoCodeForm.discountValue
            }
          >
            {submittingPromoCode ? "Creating..." : "Create Promo Code"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Testimonial Confirmation Dialog */}
      <Dialog
        open={showDeleteTestimonialDialog}
        onClose={handleCloseDeleteTestimonialDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Testimonial</DialogTitle>
        <DialogContent>
          <p className="text-gray-700">
            Are you sure you want to delete this testimonial? This action cannot
            be undone.
          </p>
          {testimonialToDelete && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600 italic">
                "{testimonialToDelete.testimonial}"
              </p>
              <p className="text-sm text-gray-500 mt-2">
                - {testimonialToDelete.testimonialBy}
              </p>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDeleteTestimonialDialog}
            color="inherit"
            disabled={deletingTestimonial}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteTestimonial}
            variant="contained"
            color="error"
            disabled={deletingTestimonial}
            startIcon={
              deletingTestimonial && (
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )
            }
          >
            {deletingTestimonial ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
