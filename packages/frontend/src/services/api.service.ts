import type { OpenAIRequest, OpenAIResponse, ApiResponse } from '../types/index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred'
      };
    }
  }

  static async sendMessage(request: OpenAIRequest): Promise<ApiResponse<OpenAIResponse>> {
    return this.makeRequest<OpenAIResponse>('/api/chat/send-message', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async validateApiKey(apiKey: string): Promise<ApiResponse<{ valid: boolean }>> {
    return this.makeRequest<{ valid: boolean }>('/api/chat/validate-key', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  static async getHealth(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest<{ status: string; timestamp: string }>('/api/health');
  }
}