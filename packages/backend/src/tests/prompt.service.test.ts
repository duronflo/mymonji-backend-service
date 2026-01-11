import { PromptService } from '../services/prompt.service';
import { SystemSpecification, CreatePromptTemplateRequest, UpdatePromptTemplateRequest } from '../types';

describe('PromptService', () => {
  let promptService: PromptService;

  beforeEach(() => {
    // Get the singleton instance
    promptService = PromptService.getInstance();
  });

  describe('getInstance', () => {
    it('should return the same instance', () => {
      const instance1 = PromptService.getInstance();
      const instance2 = PromptService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('System Specification Management', () => {
    it('should return default system specification', () => {
      const systemSpec = promptService.getSystemSpec();
      
      expect(systemSpec).toBeDefined();
      expect(systemSpec.role).toBe('Helpful AI Assistant');
      expect(systemSpec.background).toContain('knowledgeable and helpful');
      expect(systemSpec.personality).toBe('Friendly, professional, and knowledgeable');
      expect(Array.isArray(systemSpec.rules)).toBe(true);
      expect(systemSpec.rules.length).toBeGreaterThan(0);
    });

    it('should update system specification', () => {
      const newSystemSpec: SystemSpecification = {
        role: 'Custom Assistant',
        background: 'Custom background information',
        rules: ['Rule 1', 'Rule 2'],
        personality: 'Custom personality'
      };

      const updated = promptService.updateSystemSpec(newSystemSpec);

      expect(updated.role).toBe('Custom Assistant');
      expect(updated.background).toBe('Custom background information');
      expect(updated.rules).toEqual(['Rule 1', 'Rule 2']);
      expect(updated.personality).toBe('Custom personality');
    });

    it('should return a copy of system specification', () => {
      const systemSpec1 = promptService.getSystemSpec();
      systemSpec1.role = 'Modified Role';

      const systemSpec2 = promptService.getSystemSpec();
      expect(systemSpec2.role).not.toBe('Modified Role');
    });
  });

  describe('Template Management', () => {
    it('should return default templates', () => {
      const templates = promptService.getAllTemplates();
      
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check for specific default templates
      const greetingTemplate = templates.find(t => t.id === 'greeting');
      expect(greetingTemplate).toBeDefined();
      expect(greetingTemplate?.name).toBe('Greeting');
    });

    it('should get a specific template by ID', () => {
      const template = promptService.getTemplate('greeting');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('greeting');
      expect(template?.name).toBe('Greeting');
      expect(template?.userPrompt).toContain('Hello');
    });

    it('should return undefined for non-existent template', () => {
      const template = promptService.getTemplate('non-existent-id');
      expect(template).toBeUndefined();
    });

    it('should create a new template', () => {
      const request: CreatePromptTemplateRequest = {
        name: 'Test Template',
        description: 'A test template',
        userPrompt: 'This is a test prompt',
        category: 'Test'
      };

      const created = promptService.createTemplate(request);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.name).toBe('Test Template');
      expect(created.description).toBe('A test template');
      expect(created.userPrompt).toBe('This is a test prompt');
      expect(created.category).toBe('Test');
      expect(created.createdAt).toBeInstanceOf(Date);
      expect(created.updatedAt).toBeInstanceOf(Date);

      // Verify it's in the list
      const templates = promptService.getAllTemplates();
      const found = templates.find(t => t.id === created.id);
      expect(found).toEqual(created);
    });

    it('should update an existing template', () => {
      const request: CreatePromptTemplateRequest = {
        name: 'Original Name',
        description: 'Original description',
        userPrompt: 'Original prompt',
        category: 'Original'
      };

      const created = promptService.createTemplate(request);

      const updateRequest: UpdatePromptTemplateRequest = {
        name: 'Updated Name',
        description: 'Updated description'
      };

      const updated = promptService.updateTemplate(created.id, updateRequest);

      expect(updated).toBeDefined();
      expect(updated?.id).toBe(created.id);
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
      expect(updated?.userPrompt).toBe('Original prompt'); // Not updated
      expect(updated?.category).toBe('Original'); // Not updated
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
    });

    it('should return undefined when updating non-existent template', () => {
      const updateRequest: UpdatePromptTemplateRequest = {
        name: 'Updated Name'
      };

      const updated = promptService.updateTemplate('non-existent-id', updateRequest);
      expect(updated).toBeUndefined();
    });

    it('should delete a template', () => {
      const request: CreatePromptTemplateRequest = {
        name: 'To Delete',
        description: 'Will be deleted',
        userPrompt: 'Delete me'
      };

      const created = promptService.createTemplate(request);
      const deleted = promptService.deleteTemplate(created.id);

      expect(deleted).toBe(true);

      const found = promptService.getTemplate(created.id);
      expect(found).toBeUndefined();
    });

    it('should return false when deleting non-existent template', () => {
      const deleted = promptService.deleteTemplate('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('Config Management', () => {
    it('should return complete configuration', () => {
      const config = promptService.getConfig();

      expect(config).toBeDefined();
      expect(config.systemSpec).toBeDefined();
      expect(Array.isArray(config.templates)).toBe(true);
      expect(config.templates.length).toBeGreaterThan(0);
    });
  });

  describe('Variable Substitution', () => {
    it('should apply variables to template', () => {
      const template = 'Hello {{name}}, your balance is {{balance}}';
      const variables = {
        name: 'John',
        balance: '$100'
      };

      const result = promptService.applyVariables(template, variables);
      expect(result).toBe('Hello John, your balance is $100');
    });

    it('should handle missing variables', () => {
      const template = 'Hello {{name}}, your balance is {{balance}}';
      const variables = {
        name: 'John'
      };

      const result = promptService.applyVariables(template, variables);
      expect(result).toBe('Hello John, your balance is {{balance}}');
    });

    it('should return original template when no variables provided', () => {
      const template = 'Hello {{name}}';
      const result = promptService.applyVariables(template);
      expect(result).toBe('Hello {{name}}');
    });

    it('should handle multiple occurrences of same variable', () => {
      const template = '{{name}} says hi! {{name}} is happy.';
      const variables = {
        name: 'Alice'
      };

      const result = promptService.applyVariables(template, variables);
      expect(result).toBe('Alice says hi! Alice is happy.');
    });
  });
});
