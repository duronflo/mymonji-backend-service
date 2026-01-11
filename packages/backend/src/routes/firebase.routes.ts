import express from 'express';
import type { Request, Response } from 'express';
import { FirebaseService } from '../services/firebase.service';
import type { ApiResponse } from '../types';

const router = express.Router();

/**
 * GET /users/all
 * Get all users from Firebase
 */
router.get('/users/all', async (req: Request, res: Response) => {
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

    // Fetch all users
    const users = await firebaseService.getAllUsers();

    const response: ApiResponse<any[]> = {
      success: true,
      data: users,
      message: `Retrieved ${users.length} users successfully`
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error in /users/all:', error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: error.message || 'Failed to fetch users',
      message: 'Internal Server Error'
    };
    
    res.status(500).json(response);
  }
});

export { router as firebaseRoutes };