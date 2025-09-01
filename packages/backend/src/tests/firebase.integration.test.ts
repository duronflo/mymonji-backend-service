import request from 'supertest';
import { app } from '../index';

// Mock Firebase to avoid initialization during tests
jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  firestore: jest.fn().mockReturnValue({
    collection: jest.fn()
  })
}));

// Mock the Firebase and Recommendation services
jest.mock('../services/firebase.service', () => ({
  FirebaseService: {
    getInstance: jest.fn()
  }
}));

jest.mock('../services/recommendation.service', () => ({
  RecommendationService: {
    getInstance: jest.fn()
  }
}));

import { FirebaseService } from '../services/firebase.service';
import { RecommendationService } from '../services/recommendation.service';

describe('Firebase Routes Integration', () => {
  let mockFirebaseService: any;
  let mockRecommendationService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up mock environment variables
    process.env.FIREBASE_PROJECT_ID = 'test-project';
    
    mockFirebaseService = {
      getUserData: jest.fn(),
      getAllUsers: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(true)
    };
    
    mockRecommendationService = {
      generateUserRecommendations: jest.fn(),
      startBatchJob: jest.fn(),
      getBatchJobStatus: jest.fn()
    };

    (FirebaseService.getInstance as jest.Mock).mockReturnValue(mockFirebaseService);
    (RecommendationService.getInstance as jest.Mock).mockReturnValue(mockRecommendationService);
  });

  afterEach(() => {
    delete process.env.FIREBASE_PROJECT_ID;
  });

  describe('GET /health', () => {
    it('should return health status with uptime', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'ok',
        uptime: expect.any(Number)
      });
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('POST /user/:uid/recommendations', () => {
    const validUid = 'test-user-123';
    const mockRecommendations = {
      uid: validUid,
      recommendations: [
        { category: 'Food', advice: 'Reduziere Takeout um 20%' }
      ]
    };

    it('should successfully generate recommendations for valid user', async () => {
      mockRecommendationService.generateUserRecommendations.mockResolvedValue(mockRecommendations);

      const response = await request(app)
        .post(`/user/${validUid}/recommendations`)
        .send({})
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockRecommendations,
        message: 'Recommendations generated successfully'
      });
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .post(`/user/${validUid}/recommendations`)
        .send({ startDate: 'invalid-date' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Invalid startDate format. Use YYYY-MM-DD'
      });
    });

    it('should return 503 when Firebase is not configured', async () => {
      mockFirebaseService.isConfigured.mockReturnValue(false);

      const response = await request(app)
        .post(`/user/${validUid}/recommendations`)
        .send({})
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Firebase is not properly configured'
      });
    });
  });

  describe('POST /batch/run', () => {
    const mockBatchResult = {
      status: 'started',
      jobId: 'batch_1725253432'
    };

    it('should successfully start batch job', async () => {
      mockRecommendationService.startBatchJob.mockResolvedValue(mockBatchResult);

      const response = await request(app)
        .post('/batch/run')
        .send({})
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockBatchResult,
        message: 'Batch job started successfully'
      });
    });

    it('should accept optional date parameters', async () => {
      mockRecommendationService.startBatchJob.mockResolvedValue(mockBatchResult);

      const requestBody = {
        startDate: '2025-08-25',
        endDate: '2025-08-31'
      };

      const response = await request(app)
        .post('/batch/run')
        .send(requestBody)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockRecommendationService.startBatchJob).toHaveBeenCalledWith(requestBody);
    });
  });

  describe('GET /batch/:jobId/status', () => {
    const jobId = 'batch_1725253432';
    const mockBatchStatus = {
      jobId,
      status: 'completed' as const,
      processedUsers: 42,
      durationSec: 12
    };

    it('should successfully get batch job status', async () => {
      mockRecommendationService.getBatchJobStatus.mockReturnValue(mockBatchStatus);

      const response = await request(app)
        .get(`/batch/${jobId}/status`)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockBatchStatus,
        message: 'Batch job status retrieved successfully'
      });
    });

    it('should return 404 for non-existent job', async () => {
      mockRecommendationService.getBatchJobStatus.mockImplementation(() => {
        throw new Error('Batch job batch_nonexistent not found');
      });

      const response = await request(app)
        .get('/batch/batch_nonexistent/status')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Batch job not found'
      });
    });
  });
});