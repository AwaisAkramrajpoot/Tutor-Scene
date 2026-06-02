import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send } from 'lucide-react';
import { debounce } from '../../utils/messagingHelpers';

const MessageInput = ({
  onSend,
  onTyping,
  disabled = false,
  placeholder = 'Type a message...',
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);

  // Debounced typing indicator - memoized to prevent recreation
  const debouncedStopTyping = useMemo(
    () => debounce(() => {
      setIsTyping(false);
      if (onTyping) onTyping(false);
    }, 2000),
    [onTyping]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Emit typing event
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      if (onTyping) onTyping(true);
    }

    // Reset typing timeout
    if (value.trim()) {
      debouncedStopTyping();
    } else if (isTyping) {
      setIsTyping(false);
      if (onTyping) onTyping(false);
    }
  };

  const handleSend = useCallback(() => {
    const trimmedMessage = message.trim();
    
    if (!trimmedMessage || disabled) return;

    onSend(trimmedMessage);
    setMessage('');
    setIsTyping(false);
    if (onTyping) onTyping(false);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [message, disabled, onSend, onTyping]);

  const handleKeyDown = useCallback((e) => {
    // Enter to send, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div className="safe-bottom flex-shrink-0 border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-end gap-2">
        {/* Message textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          aria-label="Type a message"
          style={{ maxHeight: '120px', fontSize: '16px' }}
        />

        {/* Send button - Touch-friendly size (min 44px) */}
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors touch-manipulation"
          aria-label="Send message"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>

      {/* Helper text - Hidden on mobile */}
      <p className="hidden sm:block text-xs text-gray-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
