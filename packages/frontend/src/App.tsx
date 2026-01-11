import { useState, useCallback, useEffect } from 'react';
import './App.css';
import { SystemPanel, MessageList, MessageInput, FirebaseTestPanel, PromptManager, TemplateExecutor } from './components';
import { ApiService } from './services/api.service';
import type { 
  SystemSpecification, 
  ChatMessage, 
  UserMessage, 
  PromptTemplate,
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest 
} from './types/index';

function App() {
  // State for tab management
  const [activeTab, setActiveTab] = useState<'chat' | 'prompts' | 'executor' | 'firebase'>('chat');

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

  // State for prompt templates
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  // State for chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load prompt configuration on mount
  useEffect(() => {
    loadPromptConfig();
  }, []);

  const loadPromptConfig = async () => {
    try {
      const response = await ApiService.getPromptConfig();
      if (response.success && response.data) {
        setSystemSpec(response.data.systemSpec);
        setTemplates(response.data.templates);
      }
    } catch (error) {
      console.error('Error loading prompt config:', error);
    }
  };

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

  // Handle sending with a template
  const handleSendWithTemplate = useCallback(async (template: PromptTemplate) => {
    setError(null);
    setIsLoading(true);

    // Add user message showing the template prompt
    addMessage(template.userPrompt, 'user');

    try {
      // Send with template
      const response = await ApiService.sendWithTemplate({
        templateId: template.id
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
  }, [addMessage]);

  // Handle system spec update
  const handleSystemSpecChange = useCallback(async (spec: SystemSpecification) => {
    setSystemSpec(spec);
    try {
      await ApiService.updateSystemSpec(spec);
    } catch (error) {
      console.error('Error updating system spec:', error);
    }
  }, []);

  // Template management handlers
  const handleCreateTemplate = useCallback(async (request: CreatePromptTemplateRequest) => {
    try {
      const response = await ApiService.createPromptTemplate(request);
      if (response.success && response.data) {
        setTemplates(prev => [...prev, response.data!]);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }, []);

  const handleUpdateTemplate = useCallback(async (id: string, request: UpdatePromptTemplateRequest) => {
    try {
      const response = await ApiService.updatePromptTemplate(id, request);
      if (response.success && response.data) {
        setTemplates(prev => prev.map(t => t.id === id ? response.data! : t));
      }
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  }, []);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    try {
      const response = await ApiService.deletePromptTemplate(id);
      if (response.success) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  }, [selectedTemplate]);

  const handleSelectTemplate = useCallback((template: PromptTemplate) => {
    setSelectedTemplate(template);
    handleSendWithTemplate(template);
  }, [handleSendWithTemplate]);

  // Check if system configuration is complete
  const isSystemConfigComplete = systemSpec.role && systemSpec.background && systemSpec.personality;

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h1>MyMonji Backend Service</h1>
        <p>Test the chat interface, manage prompts, and test Firebase endpoints</p>
        
        <nav className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat Interface
          </button>
          <button 
            className={`tab-btn ${activeTab === 'prompts' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompts')}
          >
            Prompt Manager
          </button>
          <button 
            className={`tab-btn ${activeTab === 'executor' ? 'active' : ''}`}
            onClick={() => setActiveTab('executor')}
          >
            Template Executor
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
              onSystemSpecChange={handleSystemSpecChange}
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
        ) : activeTab === 'prompts' ? (
          <PromptManager
            templates={templates}
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onSelectTemplate={handleSelectTemplate}
            selectedTemplateId={selectedTemplate?.id}
          />
        ) : activeTab === 'executor' ? (
          <TemplateExecutor
            templates={templates}
          />
        ) : (
          <FirebaseTestPanel />
        )}
      </div>
    </div>
  );
}

export default App;