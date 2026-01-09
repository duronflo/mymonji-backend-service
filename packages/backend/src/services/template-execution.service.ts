import { PromptService } from './prompt.service';
import { FirebaseService } from './firebase.service';
import { OpenAIService } from './openai.service';
import type { 
  PromptTemplate,
  FirebaseDataConfig,
  ExecuteTemplateForAllUsersResponse,
  OpenAIResponse
} from '../types';

/**
 * Service for executing prompt templates with Firebase data integration
 */
export class TemplateExecutionService {
  private static instance: TemplateExecutionService;
  private promptService: PromptService;
  private firebaseService: FirebaseService;
  private openAIService: OpenAIService;
  private executionJobs = new Map<string, any>();

  private constructor() {
    this.promptService = PromptService.getInstance();
    this.firebaseService = FirebaseService.getInstance();
    this.openAIService = new OpenAIService();
  }

  public static getInstance(): TemplateExecutionService {
    if (!TemplateExecutionService.instance) {
      TemplateExecutionService.instance = new TemplateExecutionService();
    }
    return TemplateExecutionService.instance;
  }

  /**
   * Execute a template for a specific user with Firebase data
   */
  async executeTemplateForUser(
    templateId: string,
    userId: string,
    variables?: Record<string, string>
  ): Promise<OpenAIResponse> {
    const template = this.promptService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    // Get system specification
    const systemSpec = this.promptService.getSystemSpec();

    // Build the user prompt with Firebase data if configured
    let userPrompt = this.promptService.applyVariables(template.userPrompt, variables);

    // If Firebase data is enabled, fetch and append it to the prompt
    if (template.firebaseData?.enabled) {
      const firebaseData = await this.fetchFirebaseData(userId, template.firebaseData);
      userPrompt = this.enrichPromptWithFirebaseData(userPrompt, firebaseData);
    }

    // Send to OpenAI
    const response = await this.openAIService.sendMessage(
      systemSpec,
      {
        content: userPrompt,
        timestamp: new Date(),
        userId
      }
    );

    // Save the response to Firebase at /users2/{userId}/prompts
    try {
      await this.firebaseService.savePromptResponse(
        userId,
        template.id,
        template.name,
        userPrompt,
        response.content
      );
      console.log(`💾 Saved prompt response to Firebase for user ${userId}`);
    } catch (error) {
      console.error(`Failed to save prompt response to Firebase for user ${userId}:`, error);
      // Don't throw - we still want to return the response even if saving fails
    }

    return response;
  }

  /**
   * Execute a template for all users (batch execution)
   */
  async executeTemplateForAllUsers(templateId: string): Promise<ExecuteTemplateForAllUsersResponse> {
    const template = this.promptService.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template with ID ${templateId} not found`);
    }

    const jobId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    
    // Start execution in background
    this.startBatchExecution(jobId, template);

    // Get user count for response
    const users = await this.firebaseService.getAllUsers();

    return {
      jobId,
      status: 'pending',
      totalUsers: users.length
    };
  }

  /**
   * Get status of a batch execution job
   */
  getExecutionJobStatus(jobId: string): any {
    const job = this.executionJobs.get(jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    return job;
  }

  /**
   * Fetch Firebase data based on configuration
   */
  private async fetchFirebaseData(userId: string, config: FirebaseDataConfig): Promise<any> {
    const data: any = {};

    // Fetch user data if requested
    if (config.includeUserData) {
      try {
        data.userData = await this.firebaseService.getUserData(userId);
      } catch (error) {
        console.warn(`Could not fetch user data for ${userId}:`, error);
        data.userData = null;
      }
    }

    // Fetch expense data with date range
    if (config.dateRange) {
      const { startDate, endDate } = this.calculateDateRange(config.dateRange);
      
      try {
        data.expenses = await this.firebaseService.getExpenseData(userId, startDate, endDate);
        
        // Filter to include only emotion data if specified
        if (!config.includeEmotions && data.expenses) {
          data.expenses = data.expenses.map((expense: any) => {
            const { emotion, ...rest } = expense;
            return rest;
          });
        }
      } catch (error) {
        console.warn(`Could not fetch expense data for ${userId}:`, error);
        data.expenses = [];
      }
    }

    return data;
  }

  /**
   * Calculate start and end dates based on date range configuration
   */
  private calculateDateRange(dateRange: FirebaseDataConfig['dateRange']): { startDate: string; endDate: string } {
    const now = new Date();
    let startDate: Date;
    const endDate = now;

    if (dateRange?.type === 'custom') {
      return {
        startDate: dateRange.startDate || now.toISOString().split('T')[0],
        endDate: dateRange.endDate || now.toISOString().split('T')[0]
      };
    }

    const value = dateRange?.value || 1;

    switch (dateRange?.type) {
      case 'days':
        startDate = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        break;
      case 'weeks':
        startDate = new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'months':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - value);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }

  /**
   * Enrich the user prompt with Firebase data
   */
  private enrichPromptWithFirebaseData(prompt: string, firebaseData: any): string {
    let enrichedPrompt = prompt + '\n\n--- USER DATA ---\n';

    if (firebaseData.userData) {
      enrichedPrompt += `User Information: ${JSON.stringify(firebaseData.userData, null, 2)}\n\n`;
    }

    if (firebaseData.expenses && firebaseData.expenses.length > 0) {
      enrichedPrompt += `Expense Data (${firebaseData.expenses.length} transactions):\n`;
      enrichedPrompt += JSON.stringify(firebaseData.expenses, null, 2);
    } else {
      enrichedPrompt += 'No expense data available for the specified period.';
    }

    return enrichedPrompt;
  }

  /**
   * Start batch execution in the background
   */
  private async startBatchExecution(jobId: string, template: PromptTemplate): Promise<void> {
    const job: any = {
      jobId,
      templateId: template.id,
      templateName: template.name,
      status: 'running',
      startTime: new Date(),
      processedUsers: 0,
      totalUsers: 0,
      errors: [] as string[]
    };

    this.executionJobs.set(jobId, job);

    // Execute asynchronously
    setImmediate(async () => {
      try {
        const users = await this.firebaseService.getAllUsers();
        job.totalUsers = users.length;

        for (const user of users) {
          try {
            await this.executeTemplateForUser(template.id, user.uid);
            job.processedUsers++;
          } catch (error) {
            const errorMsg = `Error processing user ${user.uid}: ${error instanceof Error ? error.message : 'Unknown error'}`;
            console.error(errorMsg);
            job.errors.push(errorMsg);
          }
        }

        job.status = 'completed';
        job.endTime = new Date();
      } catch (error) {
        job.status = 'failed';
        job.error = error instanceof Error ? error.message : 'Unknown error';
        job.endTime = new Date();
      }
    });
  }
}
