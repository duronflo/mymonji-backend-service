/**
 * Common types and interfaces shared between frontend and backend
 */

export interface SystemSpecification {
  role: string;
  background: string;
  rules: string[];
  personality: string;
}

export interface UserMessage {
  content: string;
  timestamp: Date;
  userId?: string;
}

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIRequest {
  systemSpec: SystemSpecification;
  userMessage: UserMessage;
}

export interface OpenAIResponse {
  content: string;
  timestamp: Date;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

// Task types for multi-prompt functionality integrated into existing services
export type PromptTaskType = 'weekly-report' | 'overall-report';



export interface TaskResult {
  type: PromptTaskType;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
  timestamp: Date;
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Firebase and Recommendation related types
export interface Recommendation {
  category: string;
  advice: string;
}

export interface UserRecommendationsRequest {
  startDate?: string;
  endDate?: string;
  // Add debug flag to include Firebase data and OpenAI responses
  includeDebugInfo?: boolean;
  // Add task parameter to support multi-prompt functionality
  task?: PromptTaskType;
  // Support for multiple tasks in a single request
  tasks?: PromptTaskType[];
}

export interface UserRecommendationsResponse {
  uid: string;
  recommendations: Recommendation[];
  // Multi-prompt task results (when tasks are specified)
  taskResults?: TaskResult[];
  // Debug information - optional fields for testing/debugging
  debug?: {
    firebaseData?: any; // Legacy field for backwards compatibility
    firebaseUserData?: any;
    firebaseExpenseData?: any;
    openaiResponse?: string;
    openaiInput?: any; // What was sent TO OpenAI (system spec, prompt, etc.)
    openaiUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    processingTime?: number;
    // Multi-prompt debug information
    multiPromptInputs?: any[];
    multiPromptOutputs?: any[];
    totalUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

export interface BatchJobRequest {
  startDate?: string;
  endDate?: string;
  // Add debug flag to include Firebase data and OpenAI responses
  includeDebugInfo?: boolean;
}

export interface BatchJobResponse {
  status: string;
  jobId: string;
}

export interface BatchJobStatusResponse {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  processedUsers?: number;
  durationSec?: number;
  // Debug information for batch processing
  debug?: {
    sampleFirebaseData?: any; // Legacy field for backwards compatibility
    sampleFirebaseUserData?: any;
    sampleFirebaseExpenseData?: any;
    sampleOpenaiResponse?: string;
    sampleOpenaiInput?: any; // What was sent TO OpenAI for the sample user
    sampleOpenaiUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    totalUsers?: number;
    processingErrors?: string[];
  };
}