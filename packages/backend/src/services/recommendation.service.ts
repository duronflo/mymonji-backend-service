import { FirebaseService } from './firebase.service';
import { OpenAIService } from './openai.service';
import type { 
  Recommendation, 
  UserRecommendationsRequest, 
  UserRecommendationsResponse,
  BatchJobStatusResponse,
  BatchJobStatus,
  PromptTaskType,
  TaskResult,
  SystemSpecification,
  UserMessage
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
   * Extended to support task-based multi-prompt functionality
   * @param uid - User ID
   * @param options - Optional date range, debug flags, and task specifications for recommendations
   * @returns User recommendations and optional task results
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
      
      // Handle multi-prompt tasks or traditional recommendations
      if (options.task || options.tasks) {
        return await this.generateMultiPromptResponse(uid, expenseData, userData, options, debugInfo, startTime);
      } else {
        return await this.generateTraditionalRecommendations(uid, expenseData, userData, options, debugInfo, startTime);
      }
    } catch (error) {
      return this.handleRecommendationError(uid, error, options, debugInfo, startTime, expenseData, userData);
    }
  }

  /**
   * Generate multi-prompt analysis for a specific user
   * @param uid - User ID

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

  /**
   * Generate multi-prompt response using task-based approach
   */
  private async generateMultiPromptResponse(
    uid: string,
    expenseData: any,
    userData: any,
    options: UserRecommendationsRequest,
    debugInfo: any,
    startTime: number
  ): Promise<UserRecommendationsResponse> {
    const tasks = this.determineTasks(options);
    const taskResults: TaskResult[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    const multiPromptInputs: any[] = [];
    const multiPromptOutputs: any[] = [];

    for (const task of tasks) {
      try {
        const result = await this.processTask(task, expenseData, userData, options);
        taskResults.push(result);

        // Accumulate usage statistics
        if (result.usage) {
          totalPromptTokens += result.usage.promptTokens;
          totalCompletionTokens += result.usage.completionTokens;
          totalTokens += result.usage.totalTokens;
        }

        // Collect debug information
        if (options.includeDebugInfo) {
          multiPromptInputs.push({
            task: task,
            prompt: this.createTaskPrompt(task, expenseData, userData, options)
          });
          multiPromptOutputs.push({
            task: task,
            content: result.content,
            usage: result.usage
          });
        }
      } catch (error) {
        console.error(`Error processing task ${task}:`, error);
        // Add error result
        taskResults.push({
          type: task,
          content: `Error processing ${task}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      }
    }

    // Generate traditional recommendations as fallback
    const traditionalResult = await this.analyzeUserDataAndGenerateRecommendations(expenseData, userData, options);

    if (options.includeDebugInfo) {
      debugInfo.multiPromptInputs = multiPromptInputs;
      debugInfo.multiPromptOutputs = multiPromptOutputs;
      debugInfo.totalUsage = totalTokens > 0 ? {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalTokens
      } : undefined;
      debugInfo.processingTime = Date.now() - startTime;
    }

    const response: UserRecommendationsResponse = {
      uid,
      recommendations: traditionalResult.recommendations,
      taskResults
    };

    if (options.includeDebugInfo) {
      response.debug = debugInfo;
    }

    return response;
  }

  /**
   * Generate traditional recommendations (backward compatibility)
   */
  private async generateTraditionalRecommendations(
    uid: string,
    expenseData: any,
    userData: any,
    options: UserRecommendationsRequest,
    debugInfo: any,
    startTime: number
  ): Promise<UserRecommendationsResponse> {
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
  }

  /**
   * Handle recommendation generation errors
   */
  private handleRecommendationError(
    uid: string,
    error: any,
    options: UserRecommendationsRequest,
    debugInfo: any,
    startTime: number,
    expenseData: any, userData: any = null
  ): UserRecommendationsResponse {
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

  /**
   * Determine which tasks to execute based on options
   */
  private determineTasks(options: UserRecommendationsRequest): PromptTaskType[] {
    if (options.tasks && options.tasks.length > 0) {
      return options.tasks;
    }
    if (options.task) {
      return [options.task];
    }
    // Default tasks if none specified
    return ['weekly-report', 'overall-report'];
  }

  /**
   * Process a single task using the OpenAI service with task-specific context
   */
  private async processTask(
    task: PromptTaskType,
    expenseData: any,
    userData: any,
    options: UserRecommendationsRequest
  ): Promise<TaskResult> {
    const systemSpec = this.createTaskSystemSpecification(task);
    const userMessage = this.createTaskUserMessage(task, expenseData, userData, options);

    const response = await this.openAIService.sendMessage(systemSpec, userMessage, 'gpt-3.5-turbo', task);

    return {
      type: task,
      content: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: response.timestamp
    };
  }

  /**
   * Create system specification for a specific task
   */
  private createTaskSystemSpecification(task: PromptTaskType): SystemSpecification {
    const baseRole = 'You are a renowned Money Coach – with strong specialization in Data Science – advising people on better money management.';
    const baseBackground = `You are a money coach who advises individual clients regarding their spending behavior.
Expenses are collected per user. These data include: date of expense, description, amount, category, and as a central function the emotion.
Expenses are provided in JSON format.
The emotion is a numerical value. -10 means the worst emotion (e.g., anger/rage), 0 is neutral, and 10 is the highest value (happiness).`;

    const baseRules = [
      'Provide accurate analysis based on the provided data',
      'Use the specified JSON format for responses',
      'Be concise and actionable in recommendations'
    ];

    switch (task) {
      case 'weekly-report':
        return {
          role: baseRole,
          background: baseBackground,
          personality: 'Professional, analytical, and data-driven',
          rules: [
            ...baseRules,
            'Focus on the last 7 days of expense data',
            'Highlight emotional drivers: categories with strongly negative avg. emotion (≤ -3) and strongly positive avg. emotion (≥ +3)',
            'Mark outliers (≥ P95 of the last 6 weeks or > 2× category average)',
            'Deliver "What stood out?" as exactly 3 bullet points',
            'Follow the exact JSON structure provided in the guidelines'
          ]
        };

      case 'overall-report':
        return {
          role: baseRole,
          background: baseBackground,
          personality: 'Professional, analytical, and data-driven',
          rules: [
            ...baseRules,
            'Create an overall financial report for the user',
            'This is currently a placeholder implementation',
            'Return a simple HelloWorld response for now'
          ]
        };

      default:
        return {
          role: baseRole,
          background: baseBackground,
          personality: 'Professional, analytical, and data-driven',
          rules: baseRules
        };
    }
  }

  /**
   * Create user message for a specific task
   */
  private createTaskUserMessage(
    task: PromptTaskType,
    expenseData: any,
    userData: any,
    options: UserRecommendationsRequest
  ): UserMessage {
    let content = this.createTaskPrompt(task, expenseData, userData, options);

    // Add expected format for specific tasks
    if (task === 'weekly-report') {
      content += '\n\nPlease respond in the following JSON format:\n';
      content += this.getWeeklyReportFormat();
    } else if (task === 'overall-report') {
      content += '\n\nPlease respond in the following JSON format:\n';
      content += '{"message": "Hello World - Overall report placeholder"}';
    }

    return {
      content,
      timestamp: new Date()
    };
  }

  /**
   * Create task-specific prompt content
   */
  private createTaskPrompt(
    task: PromptTaskType,
    expenseData: any,
    userData: any,
    options: UserRecommendationsRequest
  ): string {
    let content = '';

    switch (task) {
      case 'weekly-report':
        content = 'Consider the last 7 days. Highlight emotional drivers: categories with strongly negative avg. emotion (≤ -3) and strongly positive avg. emotion (≥ +3). Mark outliers (≥ P95 of the last 6 weeks or > 2× category average).\n\n';
        break;

      case 'overall-report':
        content = 'Create an overall financial report for the user.\n\n';
        break;

      default:
        content = 'Analyze the provided data and create a report.\n\n';
        break;
    }

    // Add expense data
    if (expenseData && Array.isArray(expenseData) && expenseData.length > 0) {
      content += `Expense Data:\n${JSON.stringify(expenseData, null, 2)}\n\n`;
    } else {
      content += `Expense Data: No data available\n\n`;
    }

    // Add user data if available
    if (userData) {
      content += `User Profile:\n${JSON.stringify(userData, null, 2)}\n\n`;
    }

    // Add date range if specified
    if (options.startDate && options.endDate) {
      content += `Analysis Period: ${options.startDate} to ${options.endDate}\n\n`;
    }

    return content;
  }

  /**
   * Get the expected format for weekly report
   */
  private getWeeklyReportFormat(): string {
    return `{
  "report_period": {
    "start": "YYYY-MM-DD",
    "end": "YYYY-MM-DD"
  },
  "kpis": {
    "total_expenses_eur": 0.0,
    "avg_expense_eur": 0.0,
    "transactions_count": 0,
    "top_categories": [
      {"category": "Category Name", "amount_eur": 0.0}
    ],
    "highest_emotion_day": {
      "date": "YYYY-MM-DD",
      "avg_emotion": 0.0
    },
    "lowest_emotion_day": {
      "date": "YYYY-MM-DD",
      "avg_emotion": 0.0
    }
  },
  "emotional_drivers": {
    "strongly_negative": [
      {"category": "Category Name", "avg_emotion": 0.0}
    ],
    "strongly_positive": [
      {"category": "Category Name", "avg_emotion": 0.0}
    ]
  },
  "outliers": [
    {
      "date": "YYYY-MM-DD",
      "category": "Category Name",
      "amount_eur": 0.0,
      "reason": "reason description"
    }
  ],
  "insights": {
    "what_stood_out": [
      "First insight bullet point",
      "Second insight bullet point", 
      "Third insight bullet point"
    ]
  }
}`;
  }
}