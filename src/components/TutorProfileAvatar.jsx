import { useState } from "react";
import { resolveApiAssetUrl } from "../utils/api";

const ProfilePlaceholderIcon = () => (
  <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export function getValidProfilePicUrl(profilePic) {
  if (!profilePic || typeof profilePic !== "string") return "";
  const trimmed = profilePic.trim();
  if (!trimmed) return "";
  return resolveApiAssetUrl(trimmed);
}

const TutorProfileAvatar = ({
  profilePic,
  name = "Tutor",
  className = "w-24 h-24",
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const src = getValidProfilePicUrl(profilePic);
  const showPhoto = Boolean(src) && !imageFailed;

  if (showPhoto) {
    return (
      <img
        src={src}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div
      className={`${className} shrink-0 bg-gray-300 rounded-full flex items-center justify-center`}
    >
      <ProfilePlaceholderIcon />
    </div>
  );
};

export default TutorProfileAvatar;
