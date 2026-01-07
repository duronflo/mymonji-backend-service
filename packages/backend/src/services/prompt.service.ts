import { 
  SystemSpecification, 
  PromptTemplate, 
  PromptConfig, 
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest 
} from '../types';

/**
 * Service for managing prompt templates and system configuration
 * Uses in-memory storage for simplicity
 */
export class PromptService {
  private static instance: PromptService;
  private systemSpec: SystemSpecification;
  private templates: Map<string, PromptTemplate>;

  private constructor() {
    // Initialize with default system specification
    this.systemSpec = {
      role: 'Helpful AI Assistant',
      background: 'You are a knowledgeable and helpful AI assistant designed to provide accurate information and assistance to users.',
      rules: [
        'Be polite and respectful',
        'Provide accurate and helpful information',
        'Ask for clarification when needed',
        'Stay on topic and be concise'
      ],
      personality: 'Friendly, professional, and knowledgeable'
    };

    // Initialize with default prompt templates
    this.templates = new Map();
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const now = new Date();
    
    const defaultTemplates: PromptTemplate[] = [
      {
        id: 'greeting',
        name: 'Greeting',
        description: 'A simple greeting message',
        userPrompt: 'Hello! How can you help me today?',
        category: 'General',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'last-week-average',
        name: 'Last Week Average',
        description: 'Ask about last week average statistics',
        userPrompt: 'Can you tell me about my average spending from last week?',
        category: 'Statistics',
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'monthly-summary',
        name: 'Monthly Summary',
        description: 'Request a monthly financial summary',
        userPrompt: 'Please provide a summary of my expenses for this month.',
        category: 'Statistics',
        createdAt: now,
        updatedAt: now
      }
    ];

    defaultTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  public static getInstance(): PromptService {
    if (!PromptService.instance) {
      PromptService.instance = new PromptService();
    }
    return PromptService.instance;
  }

  /**
   * Get the current system specification
   */
  public getSystemSpec(): SystemSpecification {
    return { ...this.systemSpec };
  }

  /**
   * Update the system specification
   */
  public updateSystemSpec(spec: SystemSpecification): SystemSpecification {
    this.systemSpec = { ...spec };
    return this.getSystemSpec();
  }

  /**
   * Get all prompt templates
   */
  public getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get a specific prompt template by ID
   */
  public getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Create a new prompt template
   */
  public createTemplate(request: CreatePromptTemplateRequest): PromptTemplate {
    const now = new Date();
    const id = this.generateId();
    
    const template: PromptTemplate = {
      id,
      name: request.name,
      description: request.description,
      userPrompt: request.userPrompt,
      category: request.category,
      createdAt: now,
      updatedAt: now
    };

    this.templates.set(id, template);
    return template;
  }

  /**
   * Update an existing prompt template
   */
  public updateTemplate(id: string, request: UpdatePromptTemplateRequest): PromptTemplate | undefined {
    const existing = this.templates.get(id);
    if (!existing) {
      return undefined;
    }

    const updated: PromptTemplate = {
      ...existing,
      name: request.name ?? existing.name,
      description: request.description ?? existing.description,
      userPrompt: request.userPrompt ?? existing.userPrompt,
      category: request.category ?? existing.category,
      updatedAt: new Date()
    };

    this.templates.set(id, updated);
    return updated;
  }

  /**
   * Delete a prompt template
   */
  public deleteTemplate(id: string): boolean {
    return this.templates.delete(id);
  }

  /**
   * Get the complete prompt configuration
   */
  public getConfig(): PromptConfig {
    return {
      systemSpec: this.getSystemSpec(),
      templates: this.getAllTemplates()
    };
  }

  /**
   * Generate a unique ID for templates
   */
  private generateId(): string {
    return `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Apply variables to a prompt template
   */
  public applyVariables(template: string, variables?: Record<string, string>): string {
    if (!variables) {
      return template;
    }

    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return result;
  }
}
