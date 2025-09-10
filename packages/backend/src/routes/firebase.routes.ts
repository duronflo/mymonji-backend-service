import express from 'express';
import type { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { FirebaseService } from '../services/firebase.service';
import type { 
  ApiResponse, 
  UserRecommendationsRequest, 
  UserRecommendationsResponse,
  BatchJobResponse,
  BatchJobStatusResponse
} from '../types';

const router = express.Router();

/**
 * POST /user/:uid/recommendations
 * Generate recommendations for a specific user
 */
router.post('/user/:uid/recommendations', async (req: Request, res: Response) => {
  const { uid } = req.params;
  const requestBody: UserRecommendationsRequest = req.body || {};
  
  try {

    const recommendationService = RecommendationService.getInstance();
    const firebaseService = FirebaseService.getInstance();

    // Validate UID
    if (!uid || typeof uid !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Valid user UID is required',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Validate Firebase connection
    if (!firebaseService.isConfigured()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Firebase is not properly configured',
        message: 'Service Unavailable'
      };
      return res.status(503).json(response);
    }

    // Validate optional date parameters
    if (requestBody.startDate && !isValidDate(requestBody.startDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    if (requestBody.endDate && !isValidDate(requestBody.endDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Generate recommendations
    const recommendations = await recommendationService.generateUserRecommendations(uid, requestBody);

    const response: ApiResponse<UserRecommendationsResponse> = {
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully'
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /user/:uid/recommendations:', error);
    
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    
    // Check if debug information is available from the error
    if (error.debugInfo && error.partialResponse) {
      const response: ApiResponse<UserRecommendationsResponse> = {
        success: false,
        data: error.partialResponse,
        error: error.message || 'Internal server error',
        message: statusCode === 404 ? 'User not found' : 'Internal Server Error'
      };
      return res.status(statusCode).json(response);
    }
    
    // Enhanced error response with more details
    const errorMessage = requestBody.includeDebugInfo 
      ? `${error.message || 'Internal server error'} (${error.constructor?.name || 'Error'})` 
      : error.message || 'Internal server error';
    
    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage,
      message: statusCode === 404 ? 'User not found' : 'Internal Server Error'
    };
    
    // Add debug information if requested
    if (requestBody.includeDebugInfo) {
      (response as any).debug = {
        errorDetails: {
          message: error.message,
          type: error.constructor?.name || 'Error',
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        requestParameters: {
          uid: uid,
          startDate: requestBody.startDate,
          endDate: requestBody.endDate,
          includeDebugInfo: requestBody.includeDebugInfo
        }
      };
    }
    
    res.status(statusCode).json(response);
  }
});

/**
 * POST /batch/run
 * Start a batch job to process all users
 */
router.post('/batch/run', async (req: Request, res: Response) => {
  try {
    const requestBody: UserRecommendationsRequest = req.body || {};
    
    const recommendationService = RecommendationService.getInstance();
    const firebaseService = FirebaseService.getInstance();

    // Validate Firebase connection
    if (!firebaseService.isConfigured()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Firebase is not properly configured',
        message: 'Service Unavailable'
      };
      return res.status(503).json(response);
    }

    // Validate optional date parameters
    if (requestBody.startDate && !isValidDate(requestBody.startDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    if (requestBody.endDate && !isValidDate(requestBody.endDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Start batch job
    const batchResult = await recommendationService.startBatchJob(requestBody);

    const response: ApiResponse<BatchJobResponse> = {
      success: true,
      data: batchResult,
      message: 'Batch job started successfully'
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /batch/run:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Internal server error',
      message: 'Internal Server Error'
    };
    
    res.status(500).json(response);
  }
});

/**
 * GET /batch/:jobId/status
 * Get the status of a batch job
 */
router.get('/batch/:jobId/status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const recommendationService = RecommendationService.getInstance();

    // Validate jobId
    if (!jobId || typeof jobId !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Valid job ID is required',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Get batch job status
    const batchStatus = recommendationService.getBatchJobStatus(jobId);

    const response: ApiResponse<BatchJobStatusResponse> = {
      success: true,
      data: batchStatus,
      message: 'Batch job status retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /batch/:jobId/status:', error);
    
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Internal server error',
      message: statusCode === 404 ? 'Batch job not found' : 'Internal Server Error'
    };
    
    res.status(statusCode).json(response);
  }
});

/**
 * GET /users
 * Get all users with their basic information (uid and email)
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const firebaseService = FirebaseService.getInstance();

    // Validate Firebase connection
    if (!firebaseService.isConfigured()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Firebase is not properly configured',
        message: 'Service Unavailable'
      };
      return res.status(503).json(response);
    }

    // Get all users
    const users = await firebaseService.getAllUsers();
    
    // Extract uid and email from user data
    const userList = users.map(user => ({
      uid: user.uid,
      email: user.data?.email || user.data?.Email || 'N/A'
    }));

    const response: ApiResponse<Array<{uid: string, email: string}>> = {
      success: true,
      data: userList,
      message: `Retrieved ${userList.length} users successfully`
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /users:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Internal server error',
      message: 'Internal Server Error'
    };
    
    res.status(500).json(response);
  }
});

/**
 * POST /user/:uid/multi-prompt-analysis
 * Generate multi-prompt analysis for a specific user with selected task
 */
router.post('/user/:uid/multi-prompt-analysis', async (req: Request, res: Response) => {
  const { uid } = req.params;
  const requestBody: UserRecommendationsRequest = req.body || {};
  
  try {
    const recommendationService = RecommendationService.getInstance();
    const firebaseService = FirebaseService.getInstance();

    // Validate UID
    if (!uid || typeof uid !== 'string') {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Valid user UID is required',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Validate task parameter - it's required for multi-prompt analysis
    if (!requestBody.task && (!requestBody.tasks || requestBody.tasks.length === 0)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Task parameter is required for multi-prompt analysis. Use "task" for single task or "tasks" for multiple tasks. Valid values: "weekly-report", "overall-report"',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Validate Firebase connection
    if (!firebaseService.isConfigured()) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Firebase is not properly configured',
        message: 'Service Unavailable'
      };
      return res.status(503).json(response);
    }

    // Validate optional date parameters
    if (requestBody.startDate && !isValidDate(requestBody.startDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    if (requestBody.endDate && !isValidDate(requestBody.endDate)) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Invalid endDate format. Use YYYY-MM-DD',
        message: 'Bad Request'
      };
      return res.status(400).json(response);
    }

    // Generate multi-prompt analysis
    const analysis = await recommendationService.generateUserRecommendations(uid, requestBody);

    const response: ApiResponse<UserRecommendationsResponse> = {
      success: true,
      data: analysis,
      message: 'Multi-prompt analysis generated successfully'
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /user/:uid/multi-prompt-analysis:', error);
    
    const statusCode = error.message?.includes('not found') ? 404 : 500;
    
    // Check if debug information is available from the error
    if (error.debugInfo && error.partialResponse) {
      const response: ApiResponse<UserRecommendationsResponse> = {
        success: false,
        data: error.partialResponse,
        error: error.message || 'Internal server error',
        message: statusCode === 404 ? 'User not found' : 'Internal Server Error'
      };
      return res.status(statusCode).json(response);
    }
    
    // Enhanced error response with more details
    const errorMessage = requestBody.includeDebugInfo 
      ? `${error.message || 'Internal server error'} (${error.constructor?.name || 'Error'})` 
      : error.message || 'Internal server error';
    
    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage,
      message: statusCode === 404 ? 'User not found' : 'Internal Server Error'
    };
    
    // Add debug information if requested
    if (requestBody.includeDebugInfo) {
      (response as any).debug = {
        errorDetails: {
          message: error.message,
          type: error.constructor?.name || 'Error',
          stack: error.stack,
          timestamp: new Date().toISOString()
        },
        requestParameters: {
          uid: uid,
          startDate: requestBody.startDate,
          endDate: requestBody.endDate,
          task: requestBody.task,
          tasks: requestBody.tasks,
          includeDebugInfo: requestBody.includeDebugInfo
        }
      };
    }
    
    res.status(statusCode).json(response);
  }
});

/**
 * Validate date string format (YYYY-MM-DD)
 * @param dateString - Date string to validate
 * @returns True if valid date format
 */
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

export { router as firebaseRoutes };