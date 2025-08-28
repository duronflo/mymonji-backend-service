// Import shared types
export {
  SystemSpecification,
  UserMessage,
  OpenAIMessage,
  OpenAIRequest,
  OpenAIResponse,
  ApiResponse
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