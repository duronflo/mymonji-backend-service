import { OpenAIService } from '../services/openai.service';
import { SystemSpecification, UserMessage } from '../types';

// Mock OpenAI
jest.mock('openai');

const mockSystemSpec: SystemSpecification = {
  role: 'Helpful Assistant',
  background: 'You are a helpful AI assistant designed to help users with their questions.',
  rules: [
    'Be polite and respectful',
    'Provide accurate information',
    'Ask for clarification when needed'
  ],
  personality: 'Friendly and professional'
};

const mockUserMessage: UserMessage = {
  content: 'Hello, how are you?',
  timestamp: new Date('2023-01-01T00:00:00Z')
};

describe('OpenAIService', () => {
  let openAIService: OpenAIService;
  let mockOpenAI: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Mock OpenAI constructor and methods
    const OpenAI = require('openai').default;
    mockOpenAI = {
      chat: {
        completions: {
          create: jest.fn()
        }
      },
      models: {
        list: jest.fn()
      }
    };
    
    OpenAI.mockImplementation(() => mockOpenAI);
    
    // Set environment variable for testing
    process.env.OPENAI_API_KEY = 'test-api-key';
    
    openAIService = new OpenAIService();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  describe('constructor', () => {
    it('should create instance with API key from environment', () => {
      expect(openAIService).toBeInstanceOf(OpenAIService);
    });

    it('should create instance with provided API key', () => {
      const service = new OpenAIService('custom-api-key');
      expect(service).toBeInstanceOf(OpenAIService);
    });

    it('should throw error when no API key is provided', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAIService()).toThrow('OpenAI API key is required');
    });
  });

  describe('sendMessage', () => {
    it('should successfully send message and return response', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: 'Hello! I am doing well, thank you for asking.'
          }
        }],
        usage: {
          prompt_tokens: 50,
          completion_tokens: 20,
          total_tokens: 70
        },
        model: 'gpt-3.5-turbo'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await openAIService.sendMessage(mockSystemSpec, mockUserMessage);

      expect(result).toEqual({
        content: 'Hello! I am doing well, thank you for asking.',
        timestamp: expect.any(Date),
        usage: {
          promptTokens: 50,
          completionTokens: 20,
          totalTokens: 70
        },
        model: 'gpt-3.5-turbo'
      });

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('Helpful Assistant')
          },
          {
            role: 'user',
            content: 'Hello, how are you?'
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
    });

    it('should use custom model when provided', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        usage: null,
        model: 'gpt-4'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await openAIService.sendMessage(mockSystemSpec, mockUserMessage, 'gpt-4');

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4'
        })
      );
    });

    it('should handle OpenAI API errors', async () => {
      const error = new Error('API rate limit exceeded');
      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(
        openAIService.sendMessage(mockSystemSpec, mockUserMessage)
      ).rejects.toThrow('OpenAI API error: API rate limit exceeded');
    });

    it('should handle empty response from OpenAI', async () => {
      const mockResponse = {
        choices: [],
        usage: null,
        model: 'gpt-3.5-turbo'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(
        openAIService.sendMessage(mockSystemSpec, mockUserMessage)
      ).rejects.toThrow('No response received from OpenAI');
    });

    it('should build correct system message from specification', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Test response' } }],
        model: 'gpt-3.5-turbo'
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await openAIService.sendMessage(mockSystemSpec, mockUserMessage);

      const systemMessage = mockOpenAI.chat.completions.create.mock.calls[0][0].messages[0];
      
      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Helpful Assistant');
      expect(systemMessage.content).toContain('Be polite and respectful');
      expect(systemMessage.content).toContain('Provide accurate information');
      expect(systemMessage.content).toContain('Friendly and professional');
    });
  });

  describe('validateApiKey', () => {
    it('should return true for valid API key', async () => {
      mockOpenAI.models.list.mockResolvedValue({ data: [] });

      const result = await openAIService.validateApiKey();

      expect(result).toBe(true);
      expect(mockOpenAI.models.list).toHaveBeenCalled();
    });

    it('should return false for invalid API key', async () => {
      mockOpenAI.models.list.mockRejectedValue(new Error('Invalid API key'));

      const result = await openAIService.validateApiKey();

      expect(result).toBe(false);
    });
  });
});