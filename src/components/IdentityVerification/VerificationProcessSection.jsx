import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, submitTutorOnboarding, uploadOnboardingFile } from "../../utils/api";
import { getTutorOnboarding, setTutorOnboarding, clearTutorOnboarding } from "../../utils/onboarding";

export const VerificationProcessSection = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [govIdUrl, setGovIdUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedFile(file.name);
    setUploading(true);
    try {
      const res = await uploadOnboardingFile(file);
      const url = res.url || res.Location || res.fileUrl || res.data?.url;
      if (!url) throw new Error('No URL returned');
      setGovIdUrl(url);
      setTutorOnboarding({ govId: url });
    } catch (err) {
      console.error(err);
      alert('Failed to upload ID.');
    } finally {
      setUploading(false);
    }
  };

  const verificationReasons = [
    "Build trust with students and parents who rely on our platform",
    "Maintain the highest safety standards in online education",
    "Protect the integrity of the Tutor Scene community",
    "Stand out with a verified badge on your profile",
  ];

  const nextSteps = [
    {
      number: "1",
      title: "Document Review",
      description: "Our team securely reviews your ID (usually within 2 hours)",
      bgColor: "bg-[#0F3E78]",
    },
    {
      number: "2",
      title: "Background Screening",
      description: "Automated security check runs in the background",
      bgColor: "bg-[#2A66B8]",
    },
    {
      number: "3",
      title: "Verification Complete",
      description: "You'll receive an email when you're approved to teach!",
      bgColor: "bg-[#C89E45]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-8 w-full">
      {/* Left Column - Verification Form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-10 shadow-sm">
        {/* Header with Icon */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-14 h-14 flex items-center justify-center text-4xl text-blue-600">
            🛡️
          </div>
          <h2 className="text-3xl font-normal text-[#101727]">
            Identity Verification
          </h2>
        </div>

        {/* Description */}
        <p className="text-[#495565] text-lg leading-relaxed mb-10">
          To maintain a safe and trusted platform, all tutors must complete identity verification. This process is quick, secure, and confidential.
        </p>

        {/* Upload Section */}
        <div className="mb-8">
          <h3 className="text-xl font-normal text-[#101727] mb-6">
            Upload Government-Issued ID
          </h3>

          <div className="relative w-full h-72 rounded-xl border-2 border-dashed border-[#d0d5db] bg-white hover:border-[#4A8FCC] transition-colors">
            <label
              htmlFor="id-upload"
              className="absolute inset-0 w-full h-full cursor-pointer flex flex-col items-center justify-center"
            >
              <div className="w-20 h-20 flex items-center justify-center mb-4">
                <span className="text-6xl text-gray-400">📎</span>
              </div>
              <p className="text-lg text-[#495565] mb-2">
                Upload Passport or Driver's License
              </p>
              <p className="text-base text-[#697282]">
                PNG, JPG, or PDF up to 10MB
              </p>
              {uploadedFile && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ {uploadedFile}
                </p>
              )}
            </label>
            <input
              type="file"
              id="id-upload"
              className="sr-only"
              accept="image/png,image/jpeg,application/pdf"
              onChange={handleFileUpload}
              aria-label="Upload government ID"
            />
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-3 mt-6">
            <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-gray-500">🔒</span>
            </div>
            <p className="text-[#697282] text-base leading-relaxed">
              All documents are encrypted and stored securely. We never share your personal information.
            </p>
          </div>
        </div>

        {/* Background Check Status */}
        <div className="mb-8">
          <h3 className="text-xl font-normal text-[#101727] mb-6">
            Background Check Status
          </h3>

          <div className="space-y-5">
            {/* Step 1 - Active */}
            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-2xl">✓</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-normal text-[#101727] mb-1">
                  Identity Verification
                </h4>
                <p className="text-base text-[#697282]">
                  Upload government ID
                </p>
              </div>
              <span className="text-base text-[#697282]">
                Pending
              </span>
            </div>

            {/* Step 2 - Inactive */}
            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl opacity-50">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-2xl">⏳</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-normal text-[#101727] mb-1">
                  Background Check
                </h4>
                <p className="text-base text-[#697282]">
                  Automated security screening
                </p>
              </div>
              <span className="text-base text-[#697282]">
                Waiting
              </span>
            </div>

            {/* Step 3 - Inactive */}
            <div className="flex items-center gap-5 p-6 bg-gray-50 rounded-xl opacity-50">
              <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                <span className="text-gray-400 text-2xl">👁️</span>
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-normal text-[#101727] mb-1">
                  Final Review
                </h4>
                <p className="text-base text-[#697282]">
                  Team verification (24-48 hours)
                </p>
              </div>
              <span className="text-base text-[#697282]">
                Waiting
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-2 border-[#2A66B8] rounded-xl p-6 mb-8">
          <p className="text-[#354152] text-base leading-relaxed">
            <strong className="font-bold">Note:</strong> All verifications are processed securely through our trusted partner platform. Most verifications are completed within 24-48 hours.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={async () => {
            try {
              setSubmitting(true);
              const user = getCurrentUser();
              const userId = user?.id || user?._id || user?.userId;
              if (!userId) throw new Error('User not found in local storage');
              const ob = getTutorOnboarding();
              const payload = {
                userId,
                fullName: ob.fullName,
                dateOfBirth: ob.dateOfBirth,
                subjects: ob.subjects,
                gradeLevels: ob.gradeLevels,
                yearsOfExperience: ob.yearsOfExperience,
                teachingPhilosophy: ob.teachingPhilosophy,
                cv: ob.cv,
                introVideo: ob.introVideo,
                interviewTime: ob.interviewTime ? new Date(ob.interviewTime).toISOString() : undefined,
                govId: ob.govId || govIdUrl,
                profilePic: ob.profilePic,
              };
              await submitTutorOnboarding(payload);
              clearTutorOnboarding();
              navigate('/profile-under-review');
            } catch (err) {
              console.error(err);
              alert(err.message || 'Failed to submit onboarding');
            } finally {
              setSubmitting(false);
            }
          }}
          className="w-full h-14 rounded-xl bg-gradient-to-b from-[#2A66B8] to-[#0F3E78] text-white text-base font-normal hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
          disabled={uploading || submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Verification'}
        </button>
      </div>

      {/* Right Column - Image and Info */}
      <div className="flex flex-col gap-6">
        {/* Hero Image */}
        <div className="w-full h-96 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-md">
          <img
            src="https://images.unsplash.com/photo-1588072432836-e10032774350?w=800&h=600&fit=crop"
            alt="Excited female teacher waving"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-6xl text-gray-400">👩‍🏫</div>';
            }}
          />
        </div>

        {/* Why We Verify Tutors */}
        <div className="bg-gradient-to-b from-[#A8C7F0] to-[#2A66B8] rounded-2xl p-8">
          <h3 className="text-white text-2xl font-normal mb-6">
            Why We Verify Tutors
          </h3>
          <ul className="space-y-5 list-none p-0 m-0">
            {verificationReasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-[#2A66B8] text-xl font-medium">✓</span>
                </div>
                <p className="text-white/90 text-base leading-relaxed pt-3">
                  {reason}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* What Happens Next */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200">
          <h3 className="text-[#101727] text-2xl font-normal mb-6">
            What Happens Next?
          </h3>
          <ol className="space-y-5 list-none p-0 m-0">
            {nextSteps.map((step, index) => (
              <li key={step.number} className="flex items-start gap-5">
                <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
                  <span className="text-white text-lg font-normal">
                    {step.number}
                  </span>
                </div>
                <div className="flex-1 pt-1">
                  <h4 className="text-[#101727] text-lg font-normal mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[#495565] text-base leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};