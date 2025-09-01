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

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Firebase User types
export interface User {
  id?: string;
  email?: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Allow additional fields for flexibility
}

export interface CreateUserRequest {
  email?: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  [key: string]: any; // Allow additional fields
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  displayName?: string;
  photoURL?: string;
  [key: string]: any; // Allow additional fields
}

export interface UserQueryFilters {
  [key: string]: any;
}

export interface PaginationParams {
  limit?: number;
  startAfter?: string;
}