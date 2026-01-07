import type { 
  OpenAIRequest, 
  OpenAIResponse, 
  ApiResponse,
  UserRecommendationsRequest,
  UserRecommendationsResponse,
  BatchJobRequest,
  BatchJobResponse,
  BatchJobStatusResponse,
  PromptConfig,
  PromptTemplate,
  SystemSpecification,
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest,
  ChatWithTemplateRequest
} from '../types/index';

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

  static async getHealth(): Promise<ApiResponse<{ status: string; uptime: number }>> {
    return this.makeRequest<{ status: string; uptime: number }>('/health');
  }

  // Firebase endpoints
  static async getUserRecommendations(uid: string, request?: UserRecommendationsRequest): Promise<ApiResponse<UserRecommendationsResponse>> {
    return this.makeRequest<UserRecommendationsResponse>(`/user/${uid}/recommendations`, {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
  }

  static async startBatchJob(request?: BatchJobRequest): Promise<ApiResponse<BatchJobResponse>> {
    return this.makeRequest<BatchJobResponse>('/batch/run', {
      method: 'POST',
      body: JSON.stringify(request || {}),
    });
  }

  static async getBatchJobStatus(jobId: string): Promise<ApiResponse<BatchJobStatusResponse>> {
    return this.makeRequest<BatchJobStatusResponse>(`/batch/${jobId}/status`);
  }

  // Prompt management endpoints
  static async getPromptConfig(): Promise<ApiResponse<PromptConfig>> {
    return this.makeRequest<PromptConfig>('/api/prompts/config');
  }

  static async getSystemSpec(): Promise<ApiResponse<SystemSpecification>> {
    return this.makeRequest<SystemSpecification>('/api/prompts/system-spec');
  }

  static async updateSystemSpec(systemSpec: SystemSpecification): Promise<ApiResponse<SystemSpecification>> {
    return this.makeRequest<SystemSpecification>('/api/prompts/system-spec', {
      method: 'PUT',
      body: JSON.stringify(systemSpec),
    });
  }

  static async getPromptTemplates(): Promise<ApiResponse<PromptTemplate[]>> {
    return this.makeRequest<PromptTemplate[]>('/api/prompts/templates');
  }

  static async getPromptTemplate(id: string): Promise<ApiResponse<PromptTemplate>> {
    return this.makeRequest<PromptTemplate>(`/api/prompts/templates/${id}`);
  }

  static async createPromptTemplate(request: CreatePromptTemplateRequest): Promise<ApiResponse<PromptTemplate>> {
    return this.makeRequest<PromptTemplate>('/api/prompts/templates', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async updatePromptTemplate(id: string, request: UpdatePromptTemplateRequest): Promise<ApiResponse<PromptTemplate>> {
    return this.makeRequest<PromptTemplate>(`/api/prompts/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  static async deletePromptTemplate(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return this.makeRequest<{ deleted: boolean }>(`/api/prompts/templates/${id}`, {
      method: 'DELETE',
    });
  }

  static async sendWithTemplate(request: ChatWithTemplateRequest): Promise<ApiResponse<OpenAIResponse>> {
    return this.makeRequest<OpenAIResponse>('/api/chat/send-with-template', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
}