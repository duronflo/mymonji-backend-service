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

// Frontend-specific types
export interface ChatMessage {
  id: string;
  content: string;
  type: 'user' | 'assistant' | 'system';
  timestamp: Date;
}