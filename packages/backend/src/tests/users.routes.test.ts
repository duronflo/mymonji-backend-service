import request from 'supertest';
import { app } from '../index';

// Mock the Firebase service
jest.mock('../services/firebase.service', () => {
  const mockFirebaseInstance = {
    getAllUsers: jest.fn(),
    getUserById: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    queryUsers: jest.fn(),
  };

  return {
    FirebaseService: {
      getInstance: jest.fn(() => mockFirebaseInstance)
    }
  };
});

import { FirebaseService } from '../services/firebase.service';

const mockFirebaseInstance = FirebaseService.getInstance() as any;

describe('Users Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should get all users successfully', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com' }
      ];

      mockFirebaseInstance.queryUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        message: 'Retrieved 2 users successfully'
      });

      expect(mockFirebaseInstance.queryUsers).toHaveBeenCalledWith({}, undefined);
    });

    it('should handle query filters and limit', async () => {
      const mockUsers = [
        { id: '1', name: 'John Doe', email: 'john@example.com' }
      ];

      mockFirebaseInstance.queryUsers.mockResolvedValue(mockUsers);

      const response = await request(app)
        .get('/api/users?name=John&limit=10')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUsers,
        message: 'Retrieved 1 users successfully'
      });

      expect(mockFirebaseInstance.queryUsers).toHaveBeenCalledWith({ name: 'John' }, 10);
    });

    it('should return 400 for invalid limit', async () => {
      const response = await request(app)
        .get('/api/users?limit=invalid')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid limit parameter. Must be a positive number.'
      });
    });

    it('should handle Firebase service errors', async () => {
      mockFirebaseInstance.queryUsers.mockRejectedValue(new Error('Firebase connection failed'));

      const response = await request(app)
        .get('/api/users')
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Firebase connection failed'
      });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by ID successfully', async () => {
      const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };

      mockFirebaseInstance.getUserById.mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/users/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully'
      });

      expect(mockFirebaseInstance.getUserById).toHaveBeenCalledWith('1');
    });

    it('should return 404 when user not found', async () => {
      mockFirebaseInstance.getUserById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/users/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });

    it('should return 400 for empty user ID', async () => {
      const response = await request(app)
        .get('/api/users/ ')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'User ID is required'
      });
    });
  });

  describe('POST /api/users', () => {
    it('should create user successfully', async () => {
      const userData = { name: 'John Doe', email: 'john@example.com' };
      const mockCreatedUser = { id: '1', ...userData, createdAt: new Date(), updatedAt: new Date() };

      mockFirebaseInstance.createUser.mockResolvedValue(mockCreatedUser);

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: mockCreatedUser,
        message: 'User created successfully'
      });

      expect(mockFirebaseInstance.createUser).toHaveBeenCalledWith(userData);
    });

    it('should return 400 for invalid email format', async () => {
      const userData = { name: 'John Doe', email: 'invalid-email' };

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid email format'
      });

      expect(mockFirebaseInstance.createUser).not.toHaveBeenCalled();
    });

    it('should return 400 for missing user data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'User data is required'
      });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user successfully', async () => {
      const userData = { name: 'John Updated', email: 'john.updated@example.com' };
      const mockUpdatedUser = { id: '1', ...userData, updatedAt: new Date() };

      mockFirebaseInstance.updateUser.mockResolvedValue(mockUpdatedUser);

      const response = await request(app)
        .put('/api/users/1')
        .send(userData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUpdatedUser,
        message: 'User updated successfully'
      });

      expect(mockFirebaseInstance.updateUser).toHaveBeenCalledWith('1', userData);
    });

    it('should return 404 when updating non-existent user', async () => {
      const userData = { name: 'John Updated' };
      
      mockFirebaseInstance.updateUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .put('/api/users/nonexistent')
        .send(userData)
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });

    it('should return 400 for invalid email format', async () => {
      const userData = { email: 'invalid-email' };

      const response = await request(app)
        .put('/api/users/1')
        .send(userData)
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'Invalid email format'
      });

      expect(mockFirebaseInstance.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user successfully', async () => {
      mockFirebaseInstance.deleteUser.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/users/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        message: 'User deleted successfully'
      });

      expect(mockFirebaseInstance.deleteUser).toHaveBeenCalledWith('1');
    });

    it('should return 404 when deleting non-existent user', async () => {
      mockFirebaseInstance.deleteUser.mockRejectedValue(new Error('User not found'));

      const response = await request(app)
        .delete('/api/users/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found'
      });
    });

    it('should return 400 for empty user ID', async () => {
      const response = await request(app)
        .delete('/api/users/ ')
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: 'User ID is required'
      });
    });
  });

  describe('GET /api/users/service/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/users/service/health')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: 'Users service is running with Firebase connection',
        message: 'OK'
      });
    });
  });

  describe('404 handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/users/non-existent-route')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Route not found'
      });
    });
  });
});