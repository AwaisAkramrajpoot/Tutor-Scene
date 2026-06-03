import { useState } from 'react';
import { AVATAR_EMOJI_GALLERY } from '../../../data/learnerProfileConstants';

const EmojiAvatarPicker = ({ value, onChange, disabled = false, size = 'lg' }) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const sizeClass = size === 'lg' ? 'w-28 h-28 text-5xl' : 'w-20 h-20 text-4xl';

  return (
    <div className="flex flex-col items-center sm:items-start">
      <div
        className={`${sizeClass} rounded-full bg-brand-light-blue/30 flex items-center justify-center border-2 border-brand-gold relative`}
      >
        <span>{value || '👤'}</span>
        {!disabled && (
          <span className="absolute bottom-0 right-0 w-9 h-9 bg-brand-medium-blue rounded-full border-2 border-white flex items-center justify-center text-white shadow-md text-sm">
            ✎
          </span>
        )}
      </div>
      {!disabled && (
        <>
          <button
            type="button"
            onClick={() => setGalleryOpen((o) => !o)}
            className="mt-2 text-sm text-brand-medium-blue hover:underline font-medium"
          >
            Choose icon / emoji
          </button>
          {galleryOpen && (
            <div className="mt-3 p-3 border border-gray-200 rounded-xl bg-gray-50 max-w-sm">
              <p className="text-xs text-gray-500 mb-2">Select an icon (no photo upload)</p>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMOJI_GALLERY.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange(emoji);
                      setGalleryOpen(false);
                    }}
                    className={`text-2xl p-2 rounded-lg border transition-colors ${
                      value === emoji
                        ? 'border-brand-gold bg-amber-50'
                        : 'border-transparent hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmojiAvatarPicker;
