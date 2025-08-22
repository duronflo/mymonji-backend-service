import { Router, Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { SystemSpecification, UserMessage, OpenAIRequest, ApiResponse, OpenAIResponse } from '../types';

const router = Router();

// Initialize OpenAI service
const openAIService = new OpenAIService();

/**
 * POST /api/chat/send-message
 * Sends a message to OpenAI with system specification
 */
router.post('/send-message', async (req: Request, res: Response<ApiResponse<OpenAIResponse>>) => {
  try {
    const { systemSpec, userMessage }: OpenAIRequest = req.body;

    // Validate input
    if (!systemSpec || !userMessage) {
      return res.status(400).json({
        success: false,
        error: 'Both systemSpec and userMessage are required',
      });
    }

    // Validate system specification
    if (!systemSpec.role || !systemSpec.background || !systemSpec.personality) {
      return res.status(400).json({
        success: false,
        error: 'SystemSpec must include role, background, and personality',
      });
    }

    // Validate user message
    if (!userMessage.content || userMessage.content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User message content cannot be empty',
      });
    }

    // Ensure timestamp is set
    const processedUserMessage: UserMessage = {
      ...userMessage,
      timestamp: userMessage.timestamp || new Date(),
    };

    // Send message to OpenAI
    const openAIResponse = await openAIService.sendMessage(systemSpec, processedUserMessage);

    res.json({
      success: true,
      data: openAIResponse,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error in send-message endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/chat/validate-key
 * Validates OpenAI API key
 */
router.post('/validate-key', async (req: Request, res: Response<ApiResponse<boolean>>) => {
  try {
    const isValid = await openAIService.validateApiKey();
    
    res.json({
      success: true,
      data: isValid,
      message: isValid ? 'API key is valid' : 'API key is invalid',
    });
  } catch (error) {
    console.error('Error validating API key:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
    });
  }
});

/**
 * GET /api/chat/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response<ApiResponse<string>>) => {
  res.json({
    success: true,
    data: 'Chat service is running',
    message: 'OK',
  });
});

export { router as chatRoutes };