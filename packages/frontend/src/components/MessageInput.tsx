import React, { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  disabled,
  placeholder: customPlaceholder
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!message.trim() || isLoading || disabled) return;
    
    onSendMessage(message.trim());
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const placeholder = customPlaceholder || (disabled
    ? 'Complete the system configuration to start chatting...'
    : 'Type your message here... (Press Enter to send, Shift+Enter for new line)');

  return (
    <div className="message-input-container">
      <div className="message-input-group">
        <label htmlFor="message-input" className="sr-only">
          Your Message
        </label>
        <textarea
          id="message-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          rows={3}
          className="message-input"
        />
        <button
          onClick={handleSubmit}
          disabled={!message.trim() || isLoading || disabled}
          className="send-button"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="loading-spinner"></span>
          ) : (
            <span>Send Message</span>
          )}
        </button>
      </div>
    </div>
  );
};