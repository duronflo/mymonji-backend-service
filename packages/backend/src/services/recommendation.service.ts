import { FirebaseService } from './firebase.service';
import { OpenAIService } from './openai.service';
import { MultiPromptService } from './multi-prompt.service';
import type { 
  Recommendation, 
  UserRecommendationsRequest, 
  UserRecommendationsResponse,
  BatchJobStatusResponse,
  BatchJobStatus,
  MultiPromptRequest,
  MultiPromptResponse
} from '../types';

export class RecommendationService {
  private static instance: RecommendationService;
  private firebaseService: FirebaseService;
  private openAIService: OpenAIService;
  private multiPromptService: MultiPromptService;
  private batchJobs = new Map<string, BatchJobStatus>();

  private constructor() {
    this.firebaseService = FirebaseService.getInstance();
    this.openAIService = new OpenAIService();
    this.multiPromptService = new MultiPromptService(this.openAIService);
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
   * @param options - Optional date range and debug flags for recommendations
   * @returns User recommendations
   */
  async generateUserRecommendations(
    uid: string, 
    options: UserRecommendationsRequest = {}
  ): Promise<UserRecommendationsResponse> {
    const startTime = Date.now();
    let debugInfo: any = {};
    let userData: any = null;
    let expenseData: any = null;
    
    try {
      // Get user data and expense data from Firebase (capture this for debug even if later steps fail)
      try {
        // Get basic user data
        userData = await this.firebaseService.getUserData(uid);
        
        // Get expense data using the new getExpenseData function with date filtering
        expenseData = await this.firebaseService.getExpenseData(uid, options.startDate, options.endDate);
        
        if (options.includeDebugInfo) {
          debugInfo.firebaseUserData = userData;
          debugInfo.firebaseExpenseData = expenseData;
          debugInfo.expenseCount = Array.isArray(expenseData) ? expenseData.length : 0;
          debugInfo.dateRange = options.startDate && options.endDate ? 
            `${options.startDate} to ${options.endDate}` : 'No date filter applied';
        }
      } catch (firebaseError) {
        console.error('Firebase error details:', firebaseError);
        if (options.includeDebugInfo) {
          debugInfo.firebaseError = firebaseError instanceof Error ? firebaseError.message : String(firebaseError);
          debugInfo.firebaseErrorStack = firebaseError instanceof Error ? firebaseError.stack : undefined;
        }
        throw firebaseError;
      }
      
      // Generate recommendations based on expense data
      const { recommendations, aiResponse, usage, openaiInput } = await this.analyzeUserDataAndGenerateRecommendations(expenseData, userData, options);

      if (options.includeDebugInfo && aiResponse) {
        debugInfo.openaiResponse = aiResponse;
        debugInfo.openaiUsage = usage;
        debugInfo.openaiInput = openaiInput;
        debugInfo.processingTime = Date.now() - startTime;
      }

      const response: UserRecommendationsResponse = {
        uid,
        recommendations
      };

      if (options.includeDebugInfo) {
        response.debug = debugInfo;
      }

      return response;
    } catch (error) {
      console.error(`Error generating recommendations for user ${uid}:`, error);
      
      // Include debug information in error response if requested
      if (options.includeDebugInfo) {
        debugInfo.processingTime = Date.now() - startTime;
        debugInfo.errorMessage = error instanceof Error ? error.message : String(error);
        debugInfo.errorStack = error instanceof Error ? error.stack : undefined;
        debugInfo.errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        
        // Add context about what we were able to collect before the error
        debugInfo.dataCollectionStatus = {
          userDataCollected: !!userData,
          expenseDataCollected: !!expenseData,
          expenseCount: Array.isArray(expenseData) ? expenseData.length : 0
        };
        
        // Still return what we collected, even if incomplete
        const errorResponse: UserRecommendationsResponse = {
          uid,
          recommendations: this.getFallbackRecommendations(expenseData || []),
          debug: debugInfo
        };
        
        // Attach debug info to the error so the route handler can include it in the response
        (error as any).debugInfo = debugInfo;
        (error as any).partialResponse = errorResponse;
      }
      
      throw error;
    }
  }

  /**
   * Generate multi-prompt analysis for a specific user
   * @param uid - User ID
   * @param options - Optional date range and debug flags for recommendations
   * @returns Multi-prompt analysis results
   */
  async generateUserMultiPromptAnalysis(
    uid: string, 
    options: UserRecommendationsRequest = {}
  ): Promise<UserRecommendationsResponse & { multiPromptResults?: MultiPromptResponse }> {
    const startTime = Date.now();
    let debugInfo: any = {};
    let userData: any = null;
    let expenseData: any = null;
    
    try {
      // Get user data and expense data from Firebase
      try {
        userData = await this.firebaseService.getUserData(uid);
        expenseData = await this.firebaseService.getExpenseData(uid, options.startDate, options.endDate);
        
        if (options.includeDebugInfo) {
          debugInfo.firebaseUserData = userData;
          debugInfo.firebaseExpenseData = expenseData;
        }
      } catch (error) {
        console.error('Error fetching Firebase data:', error);
        throw error;
      }

      // Create multi-prompt request
      const multiPromptRequest: MultiPromptRequest = {
        tasks: this.multiPromptService.createPromptTasks(),
        expenseData: expenseData || [],
        userData: userData,
        dateRange: options.startDate && options.endDate ? {
          startDate: options.startDate,
          endDate: options.endDate
        } : undefined
      };

      // Process multi-prompt analysis
      const multiPromptResults = await this.multiPromptService.processMultiplePrompts(multiPromptRequest);

      // Extract recommendations from the weekly report result
      const weeklyReportResult = multiPromptResults.results.find(r => r.type === 'weekly-report');
      let recommendations: Recommendation[] = [];
      
      if (weeklyReportResult) {
        try {
          // Try to parse the weekly report and extract insights as recommendations
          const weeklyReport = JSON.parse(weeklyReportResult.content);
          if (weeklyReport.insights && weeklyReport.insights.what_stood_out) {
            recommendations = weeklyReport.insights.what_stood_out.map((insight: string, index: number) => ({
              category: `Weekly Insight ${index + 1}`,
              advice: insight
            }));
          }
        } catch (parseError) {
          console.warn('Could not parse weekly report as JSON, using fallback recommendations');
          recommendations = this.getFallbackRecommendations(expenseData || []);
        }
      } else {
        recommendations = this.getFallbackRecommendations(expenseData || []);
      }

      // Prepare debug information
      if (options.includeDebugInfo) {
        debugInfo.processingTime = Date.now() - startTime;
        debugInfo.multiPromptInput = multiPromptRequest;
        debugInfo.multiPromptResults = multiPromptResults;
        if (multiPromptResults.totalUsage) {
          debugInfo.openaiUsage = multiPromptResults.totalUsage;
        }
      }

      const response: UserRecommendationsResponse & { multiPromptResults?: MultiPromptResponse } = {
        uid,
        recommendations,
        multiPromptResults,
        debug: options.includeDebugInfo ? debugInfo : undefined
      };

      return response;

    } catch (error: any) {
      console.error('Error generating multi-prompt analysis:', error);
      
      if (options.includeDebugInfo) {
        debugInfo.processingTime = Date.now() - startTime;
        debugInfo.errorMessage = error instanceof Error ? error.message : String(error);
        debugInfo.errorStack = error instanceof Error ? error.stack : undefined;
        debugInfo.errorType = error instanceof Error ? error.constructor.name : 'Unknown';
        
        debugInfo.dataCollectionStatus = {
          userDataCollected: !!userData,
          expenseDataCollected: !!expenseData,
          expenseCount: Array.isArray(expenseData) ? expenseData.length : 0
        };
        
        const errorResponse: UserRecommendationsResponse = {
          uid,
          recommendations: this.getFallbackRecommendations(expenseData || []),
          debug: debugInfo
        };
        
        (error as any).debugInfo = debugInfo;
        (error as any).partialResponse = errorResponse;
      }
      
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
        totalUsers: users.length,
        includeDebugInfo: options.includeDebugInfo || false
      };
      
      if (options.includeDebugInfo) {
        batchStatus.debug = {
          processingErrors: []
        };
      }
      
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

    // Include debug information if it was requested and is available
    if (batchStatus.includeDebugInfo && batchStatus.debug) {
      response.debug = {
        ...batchStatus.debug,
        totalUsers: batchStatus.totalUsers
      };
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
          // Get expense data for each user for better recommendations
          let expenseData = null;
          try {
            expenseData = await this.firebaseService.getExpenseData(user.uid, options.startDate, options.endDate);
          } catch (expenseError) {
            // If we can't get expense data, we'll use user metadata as fallback
            console.warn(`Could not get expense data for user ${user.uid}, using user data as fallback:`, expenseError);
          }

          // Generate recommendations for each user using expense data if available, otherwise user data
          const result = await this.analyzeUserDataAndGenerateRecommendations(
            expenseData || user.data, 
            user.data, 
            options
          );
          batchStatus.processedUsers++;

          // Collect debug information from the first user for sample data
          if (options.includeDebugInfo && batchStatus.debug && batchStatus.processedUsers === 1) {
            // Store sample data from the first successfully processed user
            batchStatus.debug.sampleFirebaseUserData = user.data;
            if (expenseData) {
              batchStatus.debug.sampleFirebaseExpenseData = expenseData;
            }
            if (result.aiResponse) {
              batchStatus.debug.sampleOpenaiResponse = result.aiResponse;
            }
            if (result.usage) {
              batchStatus.debug.sampleOpenaiUsage = result.usage;
            }
            if (result.openaiInput) {
              batchStatus.debug.sampleOpenaiInput = result.openaiInput;
            }
          }
        } catch (error) {
          console.error(`Error processing user ${user.uid} in batch job ${jobId}:`, error);
          
          // Collect error information if debug is enabled
          if (options.includeDebugInfo && batchStatus.debug) {
            const errorMsg = `User ${user.uid}: ${error instanceof Error ? error.message : String(error)}`;
            batchStatus.debug.processingErrors!.push(errorMsg);
          }
          
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
   * @param expenseData - Expense data from Firebase
   * @param userData - User metadata from Firebase
   * @param options - Optional processing options
   * @returns Object with recommendations and debug info
   */
  private async analyzeUserDataAndGenerateRecommendations(
    expenseData: any, 
    userData: any,
    options: UserRecommendationsRequest
  ): Promise<{ 
    recommendations: Recommendation[], 
    aiResponse?: string,
    usage?: { promptTokens: number, completionTokens: number, totalTokens: number },
    openaiInput?: any
  }> {
    try {
      // Handle case where we have no expense data
      if (!expenseData || (Array.isArray(expenseData) && expenseData.length === 0)) {
        console.log('No expense data available, generating fallback recommendations');
        return {
          recommendations: this.getFallbackRecommendations([])
        };
      }

      // Create a prompt for OpenAI based on expense data
      const analysisPrompt = this.createAnalysisPrompt(expenseData, userData, options);
      
      // Use OpenAI to analyze data and generate recommendations
      const systemSpec = {
        role: 'Financial Advisor and Data Analyst',
        background: 'You are an expert financial advisor who analyzes user spending and expense data to provide personalized recommendations.',
        rules: [
          'Analyze the provided expense data carefully',
          'Identify spending patterns and areas for improvement',
          'Look at spending categories, amounts, and frequency',
          'Consider the emotional impact of purchases (emotion field)',
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

      // Capture what we're sending to OpenAI for debug purposes
      const openaiInput = options.includeDebugInfo ? {
        systemSpecification: systemSpec,
        userMessage: userMessage,
        prompt: analysisPrompt,
        expenseDataSummary: {
          expenseCount: Array.isArray(expenseData) ? expenseData.length : 0,
          hasUserData: !!userData,
          dateRange: options.startDate && options.endDate ? 
            `${options.startDate} to ${options.endDate}` : 'No date filter'
        }
      } : undefined;

      const aiResponse = await this.openAIService.sendMessage(systemSpec, userMessage);
      
      // Parse AI response to extract recommendations
      const recommendations = this.parseRecommendationsFromAIResponse(aiResponse.content);
      
      return {
        recommendations,
        aiResponse: options.includeDebugInfo ? aiResponse.content : undefined,
        usage: options.includeDebugInfo ? aiResponse.usage : undefined,
        openaiInput: openaiInput
      };
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      // Return fallback recommendations if AI fails
      return {
        recommendations: this.getFallbackRecommendations(expenseData || [])
      };
    }
  }

  /**
   * Create analysis prompt for OpenAI based on expense data
   * @param expenseData - Expense data array
   * @param userData - User metadata 
   * @param options - Optional date range
   * @returns Analysis prompt string
   */
  private createAnalysisPrompt(expenseData: any, userData: any, options: UserRecommendationsRequest): string {
    const dateRange = options.startDate && options.endDate 
      ? `for the period from ${options.startDate} to ${options.endDate}` 
      : '';

    // Calculate some basic stats from expense data for context
    let expenseSummary = '';
    if (Array.isArray(expenseData) && expenseData.length > 0) {
      const totalAmount = expenseData.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      const categories = [...new Set(expenseData.map(e => e.category).filter(Boolean))];
      const avgEmotion = expenseData.reduce((sum, expense) => sum + (expense.emotion || 0), 0) / expenseData.length;
      
      expenseSummary = `
Expense Summary:
- Total expenses: ${totalAmount} ${expenseData[0]?.currencyCode || ''}
- Number of transactions: ${expenseData.length}
- Categories: ${categories.join(', ')}
- Average emotional impact: ${avgEmotion.toFixed(1)}/5
`;
    } else {
      expenseSummary = `
Expense Summary:
- No expense data available ${dateRange}
- This user may be new or have no transactions in the specified period
`;
    }

    const expenseDataDisplay = Array.isArray(expenseData) && expenseData.length > 0 
      ? JSON.stringify(expenseData, null, 2)
      : 'No expense data available';

    return `Analyze the following user data ${dateRange} and provide 2-3 specific financial recommendations:

${expenseSummary}

User Profile:
${JSON.stringify(userData, null, 2)}

Detailed Expense Data:
${expenseDataDisplay}

Please analyze:
1. Available user profile information
2. Spending patterns by category (if expense data is available)
3. High-emotion purchases that might indicate impulse buying (if available)
4. Frequency and amounts of transactions (if available)
5. General financial health recommendations based on available data

Provide recommendations in the following JSON format:
[
  {
    "category": "Category Name",
    "advice": "Specific actionable advice based on available data"
  }
]

${Array.isArray(expenseData) && expenseData.length > 0 
  ? 'Focus on practical, achievable recommendations that will have the most positive impact based on actual spending patterns.'
  : 'Since no expense data is available, focus on general financial health advice and suggest ways to start tracking expenses.'
}`;
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
   * @param expenseData - Expense data
   * @returns Array of fallback recommendations
   */
  private getFallbackRecommendations(expenseData: any): Recommendation[] {
    const fallbackRecs = [
      {
        category: 'Budgeting',
        advice: 'Review your monthly expenses and create a budget to track spending patterns.'
      },
      {
        category: 'Savings',
        advice: 'Consider setting aside 10-15% of your income for emergency savings.'
      }
    ];

    // Add expense-specific recommendations if we have data
    if (Array.isArray(expenseData) && expenseData.length > 0) {
      const categories = [...new Set(expenseData.map(e => e.category).filter(Boolean))];
      const highEmotionExpenses = expenseData.filter(e => (e.emotion || 0) > 3);
      
      if (categories.includes('food') || categories.includes('Food') || categories.includes('dining')) {
        fallbackRecs.push({
          category: 'Food & Dining',
          advice: 'Reduce takeout expenses by planning meals and cooking more at home.'
        });
      }
      
      if (highEmotionExpenses.length > 0) {
        fallbackRecs.push({
          category: 'Emotional Spending',
          advice: 'Consider implementing a 24-hour waiting period before making high-emotion purchases to avoid impulse buying.'
        });
      }
    } else {
      fallbackRecs.push({
        category: 'Food',
        advice: 'Reduce takeout expenses by planning meals and cooking more at home.'
      });
    }

    return fallbackRecs;
  }
}