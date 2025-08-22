import React, { useEffect, useRef } from 'react';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(timestamp);
  };

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="message-list">
        <div className="welcome-message">
          <h3>Welcome to MyMonji Chat!</h3>
          <p>Configure your system specification and start chatting with OpenAI.</p>
          <p>Your conversation will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message.id} className={`message message-${message.type}`}>
          <div className="message-content">
            {message.content}
          </div>
          <div className="message-time">
            {formatTime(message.timestamp)}
          </div>
        </div>
      ))}
      
      {isLoading && (
        <div className="message message-assistant loading">
          <div className="message-content">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};