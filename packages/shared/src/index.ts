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

// Firebase and Recommendation related types
export interface Recommendation {
  category: string;
  advice: string;
}

export interface UserRecommendationsRequest {
  startDate?: string;
  endDate?: string;
}

export interface UserRecommendationsResponse {
  uid: string;
  recommendations: Recommendation[];
}

export interface BatchJobRequest {
  startDate?: string;
  endDate?: string;
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
}