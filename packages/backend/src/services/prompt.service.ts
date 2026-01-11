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
 * Uses file-based storage with JSON files in the prompts directory
 */
export class PromptService {
  private static instance: PromptService;
  private systemSpec: SystemSpecification;
  private promptsDir: string;
  private userPromptsDir: string;
  private systemPromptsDir: string;

  private constructor() {
    // Set prompts directory paths
    this.promptsDir = path.join(__dirname, '../../prompts');
    this.userPromptsDir = path.join(this.promptsDir, 'user');
    this.systemPromptsDir = path.join(this.promptsDir, 'system');
    
    // Ensure prompts directories exist
    this.ensurePromptsDirectory();
    
    // Load system specification from active system prompt
    this.systemSpec = this.loadActiveSystemSpec();
  }

  /**
   * Ensure the prompts directories exist
   */
  private ensurePromptsDirectory(): void {
    if (!fs.existsSync(this.promptsDir)) {
      fs.mkdirSync(this.promptsDir, { recursive: true });
      console.log(`📁 Created prompts directory at ${this.promptsDir}`);
    }
    if (!fs.existsSync(this.userPromptsDir)) {
      fs.mkdirSync(this.userPromptsDir, { recursive: true });
      console.log(`📁 Created user prompts directory at ${this.userPromptsDir}`);
    }
    if (!fs.existsSync(this.systemPromptsDir)) {
      fs.mkdirSync(this.systemPromptsDir, { recursive: true });
      console.log(`📁 Created system prompts directory at ${this.systemPromptsDir}`);
    }
  }

  /**
   * Load the active system specification from file
   */
  private loadActiveSystemSpec(): SystemSpecification {
    try {
      const files = fs.readdirSync(this.systemPromptsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.systemPromptsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const systemPrompt = JSON.parse(fileContent);
          
          if (systemPrompt.isActive && systemPrompt.systemSpec) {
            console.log(`✅ Loaded active system prompt: ${systemPrompt.name}`);
            return systemPrompt.systemSpec;
          }
        }
      }
    } catch (error) {
      console.error('Error loading system prompts:', error);
    }
    
    // Return default if no active system prompt found
    console.log('⚠️ No active system prompt found, using default');
    return {
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
  }

  /**
   * Load a user prompt template from file
   */
  private loadTemplateFromFile(filename: string): PromptTemplate | null {
    try {
      const filePath = path.join(this.userPromptsDir, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const template = JSON.parse(fileContent);
      
      // Convert date strings back to Date objects
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      
      return template as PromptTemplate;
    } catch (error) {
      console.error(`Error loading user prompt template from ${filename}:`, error);
      return null;
    }
  }

  /**
   * Save a user prompt template to file
   */
  private saveTemplateToFile(template: PromptTemplate): void {
    const filename = `${template.id}.json`;
    const filePath = path.join(this.userPromptsDir, filename);
    
    // Create a copy with dates as ISO strings for JSON serialization
    const templateToSave = {
      ...template,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(templateToSave, null, 2), 'utf-8');
    console.log(`💾 Saved user prompt template to ${filename}`);
  }

  /**
   * Delete a user prompt template file
   */
  private deleteTemplateFile(templateId: string): void {
    const filename = `${templateId}.json`;
    const filePath = path.join(this.userPromptsDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Deleted user prompt template file ${filename}`);
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
   * Update the system specification and save to active system prompt file
   */
  public updateSystemSpec(spec: SystemSpecification): SystemSpecification {
    this.systemSpec = { ...spec };
    
    // Save to the active system prompt file
    try {
      const files = fs.readdirSync(this.systemPromptsDir);
      let activeSystemPromptFile: string | null = null;
      
      // Find the active system prompt file
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.systemPromptsDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const systemPrompt = JSON.parse(fileContent);
          
          if (systemPrompt.isActive) {
            activeSystemPromptFile = file;
            // Update the system spec in the file
            systemPrompt.systemSpec = spec;
            systemPrompt.updatedAt = new Date().toISOString();
            fs.writeFileSync(filePath, JSON.stringify(systemPrompt, null, 2), 'utf-8');
            console.log(`💾 Updated active system prompt: ${systemPrompt.name}`);
            break;
          }
        }
      }
      
      // If no active system prompt found, create a new default one
      if (!activeSystemPromptFile) {
        const defaultSystemPrompt = {
          id: 'default',
          name: 'Default System Prompt',
          description: 'The default system prompt',
          systemSpec: spec,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const filePath = path.join(this.systemPromptsDir, 'default.json');
        fs.writeFileSync(filePath, JSON.stringify(defaultSystemPrompt, null, 2), 'utf-8');
        console.log('💾 Created new default system prompt');
      }
    } catch (error) {
      console.error('Error updating system prompt:', error);
    }
    
    return this.getSystemSpec();
  }

  /**
   * Get all user prompt templates from files
   */
  public getAllTemplates(): PromptTemplate[] {
    const templates: PromptTemplate[] = [];
    
    try {
      const files = fs.readdirSync(this.userPromptsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const template = this.loadTemplateFromFile(file);
          if (template) {
            templates.push(template);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user prompt templates:', error);
    }
    
    return templates;
  }

  /**
   * Get a specific user prompt template by ID from file
   */
  public getTemplate(id: string): PromptTemplate | undefined {
    const filename = `${id}.json`;
    return this.loadTemplateFromFile(filename) || undefined;
  }

  /**
   * Create a new user prompt template and save to file
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
   * Update an existing user prompt template and save to file
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
   * Delete a user prompt template file
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
   * Generate a unique ID for user prompt templates
   */
  private generateId(): string {
    return `prompt-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Apply variables to a user prompt template
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
