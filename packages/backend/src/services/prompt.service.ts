import * as fs from 'fs';
import * as path from 'path';
import { 
  SystemSpecification, 
  PromptTemplate, 
  PromptConfig, 
  CreatePromptTemplateRequest,
  UpdatePromptTemplateRequest 
} from '../types';

/**
 * Service for managing prompt templates and system configuration
 * Uses file-based storage with JSON files in the templates directory
 */
export class PromptService {
  private static instance: PromptService;
  private systemSpec: SystemSpecification;
  private templatesDir: string;

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

    // Set templates directory path
    this.templatesDir = path.join(__dirname, '../../templates');
    
    // Ensure templates directory exists
    this.ensureTemplatesDirectory();
  }

  /**
   * Ensure the templates directory exists
   */
  private ensureTemplatesDirectory(): void {
    if (!fs.existsSync(this.templatesDir)) {
      fs.mkdirSync(this.templatesDir, { recursive: true });
      console.log(`📁 Created templates directory at ${this.templatesDir}`);
    }
  }

  /**
   * Load a template from file
   */
  private loadTemplateFromFile(filename: string): PromptTemplate | null {
    try {
      const filePath = path.join(this.templatesDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const template = JSON.parse(fileContent);
      
      // Convert date strings back to Date objects
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      
      return template as PromptTemplate;
    } catch (error) {
      console.error(`Error loading template from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Save a template to file
   */
  private saveTemplateToFile(template: PromptTemplate): void {
    const filename = `${template.id}.json`;
    const filePath = path.join(this.templatesDir, filename);
    
    // Create a copy with dates as ISO strings for JSON serialization
    const templateToSave = {
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(templateToSave, null, 2), 'utf-8');
    console.log(`💾 Saved template to ${filename}`);
  }

  /**
   * Delete a template file
   */
  private deleteTemplateFile(templateId: string): void {
    const filename = `${templateId}.json`;
    const filePath = path.join(this.templatesDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted template file ${filename}`);
    }
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
   * Get all prompt templates from files
   */
  public getAllTemplates(): PromptTemplate[] {
    const templates: PromptTemplate[] = [];
    
    try {
      const files = fs.readdirSync(this.templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const template = this.loadTemplateFromFile(file);
          if (template) {
            templates.push(template);
          }
        }
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
    
    return templates;
  }

  /**
   * Get a specific template by ID from file
   */
  public getTemplate(id: string): PromptTemplate | undefined {
    const filename = `${id}.json`;
    return this.loadTemplateFromFile(filename) || undefined;
  }

  /**
   * Create a new prompt template and save to file
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
      firebaseData: request.firebaseData,
      schedule: request.schedule,
      createdAt: now,
      updatedAt: now
    };

    // Save to file immediately
    this.saveTemplateToFile(template);
    return template;
  }

  /**
   * Update an existing prompt template and save to file
   */
  public updateTemplate(id: string, request: UpdatePromptTemplateRequest): PromptTemplate | undefined {
    const existing = this.getTemplate(id);
    if (!existing) {
      return undefined;
    }

    const updated: PromptTemplate = {
      ...existing,
      name: request.name ?? existing.name,
      description: request.description ?? existing.description,
      userPrompt: request.userPrompt ?? existing.userPrompt,
      category: request.category ?? existing.category,
      firebaseData: request.firebaseData ?? existing.firebaseData,
      schedule: request.schedule ?? existing.schedule,
      updatedAt: new Date()
    };

    // Save updated template to file immediately
    this.saveTemplateToFile(updated);
    return updated;
  }

  /**
   * Delete a prompt template file
   */
  public deleteTemplate(id: string): boolean {
    const existing = this.getTemplate(id);
    if (!existing) {
      return false;
    }
    
    this.deleteTemplateFile(id);
    return true;
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
