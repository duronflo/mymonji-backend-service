import { FirebaseService } from './firebase.service';
import { OpenAIService } from './openai.service';
import type { 
  Recommendation, 
  UserRecommendationsRequest, 
  UserRecommendationsResponse,
  BatchJobStatusResponse,
  BatchJobStatus
} from '../types';

export class RecommendationService {
  private static instance: RecommendationService;
  private firebaseService: FirebaseService;
  private openAIService: OpenAIService;
  private batchJobs = new Map<string, BatchJobStatus>();

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.openAIService = new OpenAIService();
  }

  public static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  /**
   * Generate recommendations for a specific user
   * @param uid - User ID
   * @param options - Optional date range for recommendations
   * @returns User recommendations
   */
  async generateUserRecommendations(
    uid: string, 
    options: UserRecommendationsRequest = {}
  ): Promise<UserRecommendationsResponse> {
    try {
      // Get user data from Firebase
      const userData = await this.firebaseService.getUserData(uid);
      
      // Generate recommendations based on user data
      const recommendations = await this.analyzeUserDataAndGenerateRecommendations(userData, options);

      return {
        uid,
        recommendations
      };
    } catch (error) {
      console.error(`Error generating recommendations for user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Start a batch job to process all users
   * @param options - Optional date range for processing
   * @returns Batch job information
   */
  async startBatchJob(options: UserRecommendationsRequest = {}): Promise<{ status: string; jobId: string }> {
    const jobId = `batch_${Math.floor(Date.now() / 1000)}`;
    
    try {
      // Get all users
      const users = await this.firebaseService.getAllUsers();
      
      // Initialize batch job status
      const batchStatus: BatchJobStatus = {
        jobId,
        status: 'pending',
        startTime: new Date(),
        processedUsers: 0,
        totalUsers: users.length
      };
      
      this.batchJobs.set(jobId, batchStatus);

      // Start processing asynchronously
      this.processBatchJob(jobId, users, options).catch(error => {
        console.error(`Batch job ${jobId} failed:`, error);
        const status = this.batchJobs.get(jobId);
        if (status) {
          status.status = 'failed';
          status.error = error instanceof Error ? error.message : String(error);
          status.endTime = new Date();
        }
      });

      return {
        status: 'started',
        jobId
      };
    } catch (error) {
      console.error(`Error starting batch job:`, error);
      throw error;
    }
  }

  /**
   * Get batch job status
   * @param jobId - Batch job ID
   * @returns Batch job status
   */
  getBatchJobStatus(jobId: string): BatchJobStatusResponse {
    const batchStatus = this.batchJobs.get(jobId);
    
    if (!batchStatus) {
      throw new Error(`Batch job ${jobId} not found`);
    }

    const response: BatchJobStatusResponse = {
      jobId: batchStatus.jobId,
      status: batchStatus.status,
      processedUsers: batchStatus.processedUsers
    };

    if (batchStatus.endTime && batchStatus.startTime) {
      response.durationSec = Math.floor((batchStatus.endTime.getTime() - batchStatus.startTime.getTime()) / 1000);
    }

    return response;
  }

  /**
   * Process batch job for all users
   * @param jobId - Batch job ID
   * @param users - Array of users to process
   * @param options - Processing options
   */
  private async processBatchJob(
    jobId: string, 
    users: Array<{ uid: string; data: any }>, 
    options: UserRecommendationsRequest
  ): Promise<void> {
    const batchStatus = this.batchJobs.get(jobId);
    if (!batchStatus) return;

    batchStatus.status = 'running';
    
    try {
      for (const user of users) {
        try {
          // Generate recommendations for each user
          await this.analyzeUserDataAndGenerateRecommendations(user.data, options);
          batchStatus.processedUsers++;
        } catch (error) {
          console.error(`Error processing user ${user.uid} in batch job ${jobId}:`, error);
          // Continue processing other users even if one fails
        }
      }

      batchStatus.status = 'completed';
      batchStatus.endTime = new Date();
      console.log(`✅ Batch job ${jobId} completed successfully. Processed ${batchStatus.processedUsers}/${batchStatus.totalUsers} users.`);
    } catch (error) {
      batchStatus.status = 'failed';
      batchStatus.error = error instanceof Error ? error.message : String(error);
      batchStatus.endTime = new Date();
      throw error;
    }
  }

  /**
   * Analyze user data and generate recommendations using AI
   * @param userData - User data from Firebase
   * @param options - Optional processing options
   * @returns Array of recommendations
   */
  private async analyzeUserDataAndGenerateRecommendations(
    userData: any, 
    options: UserRecommendationsRequest
  ): Promise<Recommendation[]> {
    try {
      // Create a prompt for OpenAI based on user data
      const analysisPrompt = this.createAnalysisPrompt(userData, options);
      
      // Use OpenAI to analyze data and generate recommendations
      const systemSpec = {
        role: 'Financial Advisor and Data Analyst',
        background: 'You are an expert financial advisor who analyzes user spending and activity data to provide personalized recommendations.',
        rules: [
          'Analyze the provided user data carefully',
          'Identify spending patterns and areas for improvement',
          'Provide practical, actionable advice',
          'Focus on the most impactful recommendations',
          'Keep recommendations concise and clear',
          'Return recommendations in JSON format with category and advice fields'
        ],
        personality: 'Professional, helpful, and focused on practical financial advice'
      };

      const userMessage = {
        content: analysisPrompt,
        timestamp: new Date()
      };

      const aiResponse = await this.openAIService.sendMessage(systemSpec, userMessage);
      
      // Parse AI response to extract recommendations
      return this.parseRecommendationsFromAIResponse(aiResponse.content);
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Return fallback recommendations if AI fails
      return this.getFallbackRecommendations(userData);
    }
  }

  /**
   * Create analysis prompt for OpenAI based on user data
   * @param userData - User data
   * @param options - Optional date range
   * @returns Analysis prompt string
   */
  private createAnalysisPrompt(userData: any, options: UserRecommendationsRequest): string {
    const dateRange = options.startDate && options.endDate 
      ? `for the period from ${options.startDate} to ${options.endDate}` 
      : '';

    return `Analyze the following user data ${dateRange} and provide 2-3 specific financial recommendations:

User Data:
${JSON.stringify(userData, null, 2)}

Please provide recommendations in the following JSON format:
[
  {
    "category": "Category Name",
    "advice": "Specific actionable advice"
  }
]

Focus on practical, achievable recommendations that will have the most positive impact on the user's financial situation.`;
  }

  /**
   * Parse recommendations from AI response
   * @param aiContent - AI response content
   * @returns Array of recommendations
   */
  private parseRecommendationsFromAIResponse(aiContent: string): Recommendation[] {
    try {
      // Try to extract JSON from the AI response
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const recommendations = JSON.parse(jsonMatch[0]);
        if (Array.isArray(recommendations)) {
          return recommendations.filter(rec => rec.category && rec.advice);
        }
      }
      
      // If JSON parsing fails, create recommendations from text content
      return [{
        category: 'General',
        advice: aiContent.trim()
      }];
    } catch (error) {
      console.error('Error parsing AI recommendations:', error);
      return [{
        category: 'General',
        advice: 'Review your spending patterns and consider setting a monthly budget to improve your financial health.'
      }];
    }
  }

  /**
   * Get fallback recommendations when AI is not available
   * @param userData - User data
   * @returns Array of fallback recommendations
   */
  private getFallbackRecommendations(userData: any): Recommendation[] {
    return [
      {
        category: 'Budgeting',
        advice: 'Review your monthly expenses and create a budget to track spending patterns.'
      },
      {
        category: 'Savings',
        advice: 'Consider setting aside 10-15% of your income for emergency savings.'
      },
      {
        category: 'Food',
        advice: 'Reduce takeout expenses by planning meals and cooking more at home.'
      }
    ];
  }
}