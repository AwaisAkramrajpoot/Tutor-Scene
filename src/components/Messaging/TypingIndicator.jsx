import React, { useEffect, useState } from 'react';

const TypingIndicator = ({ userName, autoHideTimeout = 5000 }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (autoHideTimeout > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideTimeout);

      return () => clearTimeout(timer);
    }
  }, [autoHideTimeout]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-2 mb-2 px-2">
      <div className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-2xl rounded-bl-sm">
        <span className="text-sm text-gray-600">{userName} is typing</span>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
