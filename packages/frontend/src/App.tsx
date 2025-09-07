import { useState, useCallback } from 'react';
import './App.css';
import { SystemPanel, MessageList, MessageInput, FirebaseTestPanel } from './components';
import { ApiService } from './services/api.service';
import type { SystemSpecification, ChatMessage, UserMessage } from './types/index';

function App() {
  // State for tab management
  const [activeTab, setActiveTab] = useState<'chat' | 'firebase'>('chat');

  // State for system specification
  const [systemSpec, setSystemSpec] = useState<SystemSpecification>({
    role: 'Helpful AI Assistant',
    background: 'You are a knowledgeable and helpful AI assistant designed to provide accurate information and assistance to users.',
    rules: [
      'Be polite and respectful',
      'Provide accurate and helpful information',
      'Ask for clarification when needed',
      'Stay on topic and be concise'
    ],
    personality: 'Friendly, professional, and knowledgeable'
  });

  // State for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique ID for messages
  const generateId = () => `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add a message to the chat
  const addMessage = useCallback((content: string, type: ChatMessage['type']): ChatMessage => {
    const newMessage: ChatMessage = {
      id: generateId(),
      content,
      type,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  // Handle sending a message
  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Validate system specification
    if (!systemSpec.role || !systemSpec.background || !systemSpec.personality) {
      setError('Please fill in all system specification fields (Role, Background, and Personality)');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    addMessage(content, 'user');

    try {
      // Create user message object
      const userMessage: UserMessage = {
        content,
        timestamp: new Date()
      };

      // Send to API
      const response = await ApiService.sendMessage({
        systemSpec,
        userMessage
      });

      if (response.success && response.data) {
        // Add AI response
        addMessage(response.data.content, 'assistant');
      } else {
        throw new Error(response.error || 'Failed to get response from AI');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(errorMessage);
      addMessage(`Error: ${errorMessage}`, 'system');
    } finally {
      setIsLoading(false);
    }
  }, [systemSpec, addMessage]);

  // Check if system configuration is complete
  const isSystemConfigComplete = systemSpec.role && systemSpec.background && systemSpec.personality;

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>MyMonji Backend Service</h1>
        <p>Test the chat interface and Firebase endpoints</p>
        
        <nav className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat Interface
          </button>
          <button 
            className={`tab-btn ${activeTab === 'firebase' ? 'active' : ''}`}
            onClick={() => setActiveTab('firebase')}
          >
            Firebase Testing
          </button>
        </nav>
      </header>

      <div className="chat-content">
        {activeTab === 'chat' ? (
          <>
            <SystemPanel
              systemSpec={systemSpec}
              onSystemSpecChange={setSystemSpec}
            />
            
            <div className="chat-panel">
              {error && (
                <div className="error">
                  {error}
                </div>
              )}
              
              <MessageList
                messages={messages}
                isLoading={isLoading}
              />
              
              <MessageInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled={!isSystemConfigComplete}
              />
            </div>
          </>
        ) : (
          <FirebaseTestPanel />
        )}
      </div>
    </div>
  );
}

export default App;