import { Router, Request, Response } from 'express';
import { PromptService } from '../services/prompt.service';
import { PromptExecutionService } from '../services/prompt-execution.service';
import { 
  ApiResponse, 
  PromptConfig, 
  PromptTemplate,
  SystemSpecification,
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest,
  ExecuteTemplateForAllUsersRequest,
  ExecuteTemplateForAllUsersResponse
} from '../types';

const router = Router();
const promptService = PromptService.getInstance();
const promptExecutionService = PromptExecutionService.getInstance();

/**
 * GET /api/prompts/config
 * Get the complete prompt configuration (system spec + all templates)
 */
router.get('/config', (req: Request, res: Response<ApiResponse<PromptConfig>>) => {
  try {
    const config = promptService.getConfig();
    res.json({
      success: true,
      data: config,
      message: 'Prompt configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting prompt config:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get prompt configuration'
    });
  }
});

/**
 * GET /api/prompts/system-spec
 * Get the current system specification
 */
router.get('/system-spec', (req: Request, res: Response<ApiResponse<SystemSpecification>>) => {
  try {
    const systemSpec = promptService.getSystemSpec();
    res.json({
      success: true,
      data: systemSpec,
      message: 'System specification retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting system spec:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get system specification'
    });
  }
});

/**
 * PUT /api/prompts/system-spec
 * Update the system specification
 */
router.put('/system-spec', (req: Request, res: Response<ApiResponse<SystemSpecification>>) => {
  try {
    const systemSpec: SystemSpecification = req.body;

    // Validate system specification
    if (!systemSpec.role || !systemSpec.background || !systemSpec.personality) {
      return res.status(400).json({
        success: false,
        error: 'SystemSpec must include role, background, and personality'
      });
    }

    if (!Array.isArray(systemSpec.rules)) {
      return res.status(400).json({
        success: false,
        error: 'SystemSpec rules must be an array'
      });
    }

    const updated = promptService.updateSystemSpec(systemSpec);
    res.json({
      success: true,
      data: updated,
      message: 'System specification updated successfully'
    });
  } catch (error) {
    console.error('Error updating system spec:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update system specification'
    });
  }
});

/**
 * GET /api/prompts/templates
 * Get all prompt templates
 */
router.get('/templates', (req: Request, res: Response<ApiResponse<PromptTemplate[]>>) => {
  try {
    const templates = promptService.getAllTemplates();
    res.json({
      success: true,
      data: templates,
      message: 'Prompt templates retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get prompt templates'
    });
  }
});

/**
 * GET /api/prompts/templates/:id
 * Get a specific prompt template
 */
router.get('/templates/:id', (req: Request, res: Response<ApiResponse<PromptTemplate>>) => {
  try {
    const { id } = req.params;
    const template = promptService.getTemplate(id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Prompt template not found'
      });
    }

    res.json({
      success: true,
      data: template,
      message: 'Prompt template retrieved successfully!!!!'
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get prompt template'
    });
  }
});

/**
 * POST /api/prompts/templates
 * Create a new prompt template
 */
router.post('/templates', (req: Request, res: Response<ApiResponse<PromptTemplate>>) => {
  try {
    const request: CreatePromptTemplateRequest = req.body;

    // Validate request
    if (!request.name || !request.description || !request.userPrompt) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and userPrompt are required'
      });
    }

    const template = promptService.createTemplate(request);
    res.status(201).json({
      success: true,
      data: template,
      message: 'Prompt template created successfully'
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create prompt template'
    });
  }
});

/**
 * PUT /api/prompts/templates/:id
 * Update an existing prompt template
 */
router.put('/templates/:id', (req: Request, res: Response<ApiResponse<PromptTemplate>>) => {
  try {
    const { id } = req.params;
    const request: UpdatePromptTemplateRequest = req.body;

    const updated = promptService.updateTemplate(id, request);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Prompt template not found'
      });
    }

    res.json({
      success: true,
      data: updated,
      message: 'Prompt template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update prompt template'
    });
  }
});

/**
 * DELETE /api/prompts/templates/:id
 * Delete a prompt template
 */
router.delete('/templates/:id', (req: Request, res: Response<ApiResponse<{ deleted: boolean }>>) => {
  try {
    const { id } = req.params;
    const deleted = promptService.deleteTemplate(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Prompt template not found'
      });
    }

    res.json({
      success: true,
      data: { deleted: true },
      message: 'Prompt template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete prompt template'
    });
  }
});

/**
 * POST /api/prompts/templates/:id/execute-all
 * Execute a prompt template for all users (batch execution)
 */
router.post('/templates/:id/execute-all', async (req: Request, res: Response<ApiResponse<ExecuteTemplateForAllUsersResponse>>) => {
  try {
    const { id } = req.params;

    const result = await promptExecutionService.executePromptForAllUsers(id);

    res.status(202).json({
      success: true,
      data: result,
      message: 'Prompt template execution started for all users'
    });
  } catch (error) {
    console.error('Error executing prompt template for all users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute prompt template for all users'
    });
  }
});

/**
 * GET /api/prompts/executions/:jobId
 * Get status of a prompt execution job
 */
router.get('/executions/:jobId', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { jobId } = req.params;

    const status = promptExecutionService.getExecutionJobStatus(jobId);

    res.json({
      success: true,
      data: status,
      message: 'Execution job status retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting execution job status:', error);
    
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get execution job status'
    });
  }
});

/**
 * POST /api/prompts/templates/:id/execute/:userId
 * Execute a prompt template for a single user
 */
router.post('/templates/:id/execute/:userId', async (req: Request, res: Response<ApiResponse<any>>) => {
  try {
    const { id, userId } = req.params;
    const { variables } = req.body || {};

    const response = await promptExecutionService.executePromptForUser(id, userId, variables);

    res.json({
      success: true,
      data: response,
      message: 'Prompt template executed successfully for user'
    });
  } catch (error) {
    console.error('Error executing prompt template for user:', error);
    const statusCode = error instanceof Error && error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute prompt template for user'
    });
  }
});

export { router as promptRoutes };
