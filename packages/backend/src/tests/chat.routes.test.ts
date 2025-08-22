import request from 'supertest';
import { app } from '../index';
import { OpenAIService } from '../services/openai.service';

// Mock the OpenAI service
jest.mock('../services/openai.service');

const MockedOpenAIService = OpenAIService as jest.MockedClass<typeof OpenAIService>;

describe('Chat Routes', () => {
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAIService = new MockedOpenAIService() as jest.Mocked<OpenAIService>;
  });

  describe('POST /api/chat/send-message', () => {
    const validRequest = {
      systemSpec: {
        role: 'Test Assistant',
        background: 'Test background',
        rules: ['Rule 1', 'Rule 2'],
        personality: 'Helpful'
      },
      userMessage: {
        content: 'Hello, test message',
        timestamp: new Date().toISOString()
      }
    };

    it('should successfully send message and return response', async () => {
      const mockResponse = {
        content: 'Hello! This is a test response.',
        timestamp: new Date(),
        usage: {
          promptTokens: 50,
          completionTokens: 20,
          totalTokens: 70
        },
        model: 'gpt-3.5-turbo'
      };

      mockOpenAIService.sendMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(validRequest)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          content: 'Hello! This is a test response.',
          model: 'gpt-3.5-turbo'
        }),
        message: 'Message sent successfully'
      });
    });

    it('should return 400 for missing systemSpec', async () => {
      const invalidRequest = {
        userMessage: {
          content: 'Hello',
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Both systemSpec and userMessage are required'
      });
    });

    it('should return 400 for missing userMessage', async () => {
      const invalidRequest = {
        systemSpec: validRequest.systemSpec
      };

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Both systemSpec and userMessage are required'
      });
    });

    it('should return 400 for invalid systemSpec missing role', async () => {
      const invalidRequest = {
        systemSpec: {
          background: 'Test background',
          rules: ['Rule 1'],
          personality: 'Helpful'
        },
        userMessage: validRequest.userMessage
      };

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'SystemSpec must include role, background, and personality'
      });
    });

    it('should return 400 for empty user message content', async () => {
      const invalidRequest = {
        ...validRequest,
        userMessage: {
          content: '   ',
          timestamp: new Date().toISOString()
        }
      };

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(invalidRequest)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'User message content cannot be empty'
      });
    });

    it('should handle OpenAI service errors', async () => {
      mockOpenAIService.sendMessage.mockRejectedValue(
        new Error('OpenAI API error: Rate limit exceeded')
      );

      const response = await request(app)
        .post('/api/chat/send-message')
        .send(validRequest)
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'OpenAI API error: Rate limit exceeded'
      });
    });

    it('should set timestamp if not provided in userMessage', async () => {
      const requestWithoutTimestamp = {
        systemSpec: validRequest.systemSpec,
        userMessage: {
          content: 'Hello'
        }
      };

      const mockResponse = {
        content: 'Response',
        timestamp: new Date(),
        model: 'gpt-3.5-turbo'
      };

      mockOpenAIService.sendMessage.mockResolvedValue(mockResponse);

      await request(app)
        .post('/api/chat/send-message')
        .send(requestWithoutTimestamp)
        .expect(200);

      expect(mockOpenAIService.sendMessage).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          content: 'Hello',
          timestamp: expect.any(Date)
        })
      );
    });
  });

  describe('POST /api/chat/validate-key', () => {
    it('should return true for valid API key', async () => {
      mockOpenAIService.validateApiKey.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/chat/validate-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: true,
        message: 'API key is valid'
      });
    });

    it('should return false for invalid API key', async () => {
      mockOpenAIService.validateApiKey.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/chat/validate-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: false,
        message: 'API key is invalid'
      });
    });

    it('should handle validation errors', async () => {
      mockOpenAIService.validateApiKey.mockRejectedValue(
        new Error('Network error')
      );

      const response = await request(app)
        .post('/api/chat/validate-key')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Failed to validate API key'
      });
    });
  });

  describe('GET /api/chat/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/chat/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: 'Chat service is running',
        message: 'OK'
      });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/chat/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Route not found'
      });
    });
  });
});