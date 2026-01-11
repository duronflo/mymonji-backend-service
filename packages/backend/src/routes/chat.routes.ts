import { Router, Request, Response } from 'express';
import { OpenAIService } from '../services/openai.service';
import { PromptService } from '../services/prompt.service';
import { PromptExecutionService } from '../services/prompt-execution.service';
import { 
  SystemSpecification, 
  UserMessage, 
  OpenAIRequest, 
  ApiResponse, 
  OpenAIResponse,
  ChatWithTemplateRequest 
} from '../types';

const router = Router();
const promptService = PromptService.getInstance();
const promptExecutionService = PromptExecutionService.getInstance();

// Initialize OpenAI service with error handling
let openAIService: OpenAIService;
try {
  openAIService = new OpenAIService();
  console.log('✅ OpenAI service initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize OpenAI service:', error instanceof Error ? error.message : 'Unknown error');
  // Service will be undefined, and endpoints will return appropriate errors
}

/**
 * POST /api/chat/send-message
 * Sends a message to OpenAI with system specification
 */
router.post('/send-message', async (req: Request, res: Response<ApiResponse<OpenAIResponse>>) => {
  try {
    // Check if OpenAI service is available
    if (!openAIService) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI service is not available. Please check your API key configuration.',
      });
    }

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
    // Check if OpenAI service is available
    if (!openAIService) {
      return res.json({
        success: true,
        data: false,
        message: 'OpenAI service is not available. Please check your API key configuration.',
      });
    }

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
 * POST /api/chat/send-with-template
 * Sends a message using a prompt template with optional Firebase data integration
 */
router.post('/send-with-template', async (req: Request, res: Response<ApiResponse<OpenAIResponse>>) => {
  try {
    // Check if OpenAI service is available
    if (!openAIService) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI service is not available. Please check your API key configuration.',
      });
    }

    const { templateId, variables, userId, includeDebugInfo }: ChatWithTemplateRequest = req.body;

    // Validate input
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required',
      });
    }

    // If userId is provided and template has Firebase data config, use template execution service
    const template = promptService.getTemplate(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Prompt template not found',
      });
    }

    let openAIResponse: OpenAIResponse;

    if (userId && template.firebaseData?.enabled) {
      // Use prompt execution service for Firebase data integration
      openAIResponse = await promptExecutionService.executePromptForUser(templateId, userId, variables, includeDebugInfo || false);
    } else {
      // Simple template execution without Firebase data
      const systemSpec = promptService.getSystemSpec();
      const userMessageContent = promptService.applyVariables(template.userPrompt, variables);

      const userMessage: UserMessage = {
        content: userMessageContent,
        timestamp: new Date(),
        userId
      };

      openAIResponse = await openAIService.sendMessage(systemSpec, userMessage);
      
      // Add debug info if requested
      if (includeDebugInfo) {
        openAIResponse.debug = {
          promptSentToOpenAI: userMessageContent,
          systemSpecUsed: systemSpec
        };
      }
    }

    res.json({
      success: true,
      data: openAIResponse,
      message: 'Message sent successfully with template',
    });
  } catch (error) {
    console.error('Error in send-with-template endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
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