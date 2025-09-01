import { Router, Request, Response } from 'express';
import { FirebaseService } from '../services/firebase.service';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserQueryFilters, 
  ApiResponse 
} from '../types';

const router = Router();

// Initialize Firebase service with error handling
let firebaseService: FirebaseService;
try {
  firebaseService = FirebaseService.getInstance();
  console.log('✅ Firebase service initialized for users routes');
} catch (error) {
  console.error('❌ Failed to initialize Firebase service for users routes:', error instanceof Error ? error.message : 'Unknown error');
  // Service will be undefined, and endpoints will return appropriate errors
}

/**
 * GET /api/users
 * Get all users with optional filters and limit
 */
router.get('/', async (req: Request, res: Response<ApiResponse<User[]>>) => {
  try {
    // Check if Firebase service is available
    if (!firebaseService) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service is not available. Please check your Firebase configuration.',
      });
    }

    const { limit, ...filters } = req.query;
    const queryLimit = limit ? parseInt(limit as string) : undefined;
    
    // Validate limit
    if (queryLimit && (isNaN(queryLimit) || queryLimit <= 0)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit parameter. Must be a positive number.',
      });
    }

    const users = await firebaseService.queryUsers(filters as UserQueryFilters, queryLimit);

    res.json({
      success: true,
      data: users,
      message: `Retrieved ${users.length} users successfully`,
    });
  } catch (error) {
    console.error('Error in get users endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
router.get('/:id', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    // Check if Firebase service is available
    if (!firebaseService) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service is not available. Please check your Firebase configuration.',
      });
    }

    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    const user = await firebaseService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Error in get user by ID endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    // Check if Firebase service is available
    if (!firebaseService) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service is not available. Please check your Firebase configuration.',
      });
    }

    const userData: CreateUserRequest = req.body;
    
    // Basic validation
    if (!userData || typeof userData !== 'object' || Object.keys(userData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User data is required',
      });
    }

    // Validate email format if provided
    if (userData.email && !isValidEmail(userData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const newUser = await firebaseService.createUser(userData);

    res.status(201).json({
      success: true,
      data: newUser,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error in create user endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * PUT /api/users/:id
 * Update an existing user
 */
router.put('/:id', async (req: Request, res: Response<ApiResponse<User>>) => {
  try {
    // Check if Firebase service is available
    if (!firebaseService) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service is not available. Please check your Firebase configuration.',
      });
    }

    const { id } = req.params;
    const userData: UpdateUserRequest = req.body;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    if (!userData || typeof userData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'User data is required',
      });
    }

    // Validate email format if provided
    if (userData.email && !isValidEmail(userData.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const updatedUser = await firebaseService.updateUser(id, userData);

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error in update user endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('User not found')) {
      return res.status(404).json({
        success: false,
        error: errorMessage,
      });
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user by ID
 */
router.delete('/:id', async (req: Request, res: Response<ApiResponse<null>>) => {
  try {
    // Check if Firebase service is available
    if (!firebaseService) {
      return res.status(503).json({
        success: false,
        error: 'Firebase service is not available. Please check your Firebase configuration.',
      });
    }

    const { id } = req.params;
    
    if (!id || id.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    await firebaseService.deleteUser(id);

    res.json({
      success: true,
      data: null,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error in delete user endpoint:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    if (errorMessage.includes('User not found')) {
      return res.status(404).json({
        success: false,
        error: errorMessage,
      });
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

/**
 * GET /api/users/service/health
 * Health check endpoint for users service
 */
router.get('/service/health', (req: Request, res: Response<ApiResponse<string>>) => {
  const isFirebaseAvailable = !!firebaseService;
  
  res.json({
    success: true,
    data: isFirebaseAvailable ? 'Users service is running with Firebase connection' : 'Users service is running but Firebase is not connected',
    message: 'OK',
  });
});

// Helper function to validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export { router as usersRoutes };