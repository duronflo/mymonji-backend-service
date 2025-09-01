// Import shared types
export {
  SystemSpecification,
  UserMessage,
  OpenAIMessage,
  OpenAIRequest,
  OpenAIResponse,
  ApiResponse,
  Recommendation,
  UserRecommendationsRequest,
  UserRecommendationsResponse,
  BatchJobRequest,
  BatchJobResponse,
  BatchJobStatusResponse
} from '@mymonji/shared';

// Import types for internal use
import type { SystemSpecification, UserMessage, OpenAIResponse } from '@mymonji/shared';

// Backend-specific types
export interface ChatSession {
  id: string;
  systemSpec: SystemSpecification;
  messages: Array<UserMessage | OpenAIResponse>;
  createdAt: Date;
  updatedAt: Date;
}

// Batch job management types
export interface BatchJobStatus {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  processedUsers: number;
  totalUsers: number;
  error?: string;
}