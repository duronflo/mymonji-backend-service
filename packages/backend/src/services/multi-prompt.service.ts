import { OpenAIService } from './openai.service';
import type { 
  PromptTask, 
  PromptTaskType, 
  MultiPromptRequest, 
  MultiPromptResponse, 
  TaskResult,
  SystemSpecification,
  UserMessage 
} from '../types';

export class MultiPromptService {
  private openAIService: OpenAIService;

  constructor(openAIService: OpenAIService) {
    this.openAIService = openAIService;
  }

  /**
   * Create predefined prompt tasks based on the issue requirements
   */
  public createPromptTasks(): PromptTask[] {
    return [
      this.createWeeklyReportTask(),
      this.createOverallReportTask()
    ];
  }

  /**
   * Create Prompt 1 - Weekly Report Task
   */
  private createWeeklyReportTask(): PromptTask {
    return {
      type: 'weekly-report',
      role: 'You are a renowned Money Coach – with strong specialization in Data Science – advising people on better money management.',
      context: `You are a money coach who advises individual clients regarding their spending behavior.
Expenses are collected per user. These data include: date of expense, description, amount, category, and as a central function the emotion.
Expenses are provided in JSON format.
The emotion is a numerical value. -10 means the worst emotion (e.g., anger/rage), 0 is neutral, and 10 is the highest value (happiness).`,
      task: 'Consider the last 7 days. Highlight emotional drivers: categories with strongly negative avg. emotion (≤ -3) and strongly positive avg. emotion (≥ +3). Mark outliers (≥ P95 of the last 6 weeks or > 2× category avg).',
      guidelines: [
        'Deliver: "What stood out?" (3 bullet points)',
        'Follow the exact JSON structure provided in the guidelines'
      ],
      expectedFormat: `{
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
}`
    };
  }

  /**
   * Create Prompt 2 - Overall Report Task (HelloWorld placeholder)
   */
  private createOverallReportTask(): PromptTask {
    return {
      type: 'overall-report',
      role: 'You are a renowned Money Coach – with strong specialization in Data Science – advising people on better money management.',
      context: `You are a money coach who advises individual clients regarding their spending behavior.
Expenses are collected per user. These data include: date of expense, description, amount, category, and as a central function the emotion.
Expenses are provided in JSON format.
The emotion is a numerical value. -10 means the worst emotion (e.g., anger/rage), 0 is neutral, and 10 is the highest value (happiness).`,
      task: 'Create an overall financial report for the user.',
      guidelines: [
        'This is a placeholder implementation',
        'Return a simple HelloWorld response for now'
      ],
      expectedFormat: '{"message": "Hello World - Overall report placeholder"}'
    };
  }

  /**
   * Process multiple prompts for the given request
   */
  async processMultiplePrompts(request: MultiPromptRequest): Promise<MultiPromptResponse> {
    const results: TaskResult[] = [];
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;

    for (const task of request.tasks) {
      try {
        const result = await this.processTask(task, request);
        results.push(result);

        // Accumulate usage statistics
        if (result.usage) {
          totalPromptTokens += result.usage.promptTokens;
          totalCompletionTokens += result.usage.completionTokens;
          totalTokens += result.usage.totalTokens;
        }
      } catch (error) {
        console.error(`Error processing task ${task.type}:`, error);
        // Add error result
        results.push({
          type: task.type,
          content: `Error processing ${task.type}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        });
      }
    }

    return {
      results,
      totalUsage: totalTokens > 0 ? {
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalTokens
      } : undefined
    };
  }

  /**
   * Process a single task
   */
  private async processTask(task: PromptTask, request: MultiPromptRequest): Promise<TaskResult> {
    const systemSpec = this.buildSystemSpecification(task);
    const userMessage = this.buildUserMessage(task, request);

    const response = await this.openAIService.sendMessage(systemSpec, userMessage);

    return {
      type: task.type,
      content: response.content,
      usage: response.usage,
      model: response.model,
      timestamp: response.timestamp
    };
  }

  /**
   * Build system specification for a task
   */
  private buildSystemSpecification(task: PromptTask): SystemSpecification {
    return {
      role: task.role,
      background: task.context,
      personality: 'Professional, analytical, and data-driven',
      rules: [
        ...task.guidelines,
        'Provide accurate analysis based on the provided data',
        'Use the specified JSON format for responses',
        'Be concise and actionable in recommendations'
      ]
    };
  }

  /**
   * Build user message for a task
   */
  private buildUserMessage(task: PromptTask, request: MultiPromptRequest): UserMessage {
    let content = `${task.task}\n\n`;

    // Add expense data
    if (request.expenseData && request.expenseData.length > 0) {
      content += `Expense Data:\n${JSON.stringify(request.expenseData, null, 2)}\n\n`;
    } else {
      content += `Expense Data: No data available\n\n`;
    }

    // Add user data if available
    if (request.userData) {
      content += `User Profile:\n${JSON.stringify(request.userData, null, 2)}\n\n`;
    }

    // Add date range if specified
    if (request.dateRange) {
      content += `Analysis Period: ${request.dateRange.startDate} to ${request.dateRange.endDate}\n\n`;
    }

    // Add expected format
    if (task.expectedFormat) {
      content += `Please respond in the following JSON format:\n${task.expectedFormat}`;
    }

    return {
      content,
      timestamp: new Date()
    };
  }
}