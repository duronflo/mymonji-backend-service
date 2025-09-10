import OpenAI from 'openai';
import { SystemSpecification, UserMessage, OpenAIMessage, OpenAIResponse, PromptTaskType } from '../types';

export class OpenAIService {
  private openai: OpenAI | null = null;
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (key && key !== 'test_key_placeholder' && key !== 'your_openai_api_key_here' && key.trim() !== '') {
      this.apiKey = key;
      
      // Log masked key for debugging (show first 7 chars and last 4 chars)
      const maskedKey = key.length > 11 ? `${key.substring(0, 7)}...${key.substring(key.length - 4)}` : '***masked***';
      console.log(`🔑 Using OpenAI API key: ${maskedKey}`);
      
      this.openai = new OpenAI({
        apiKey: key,
      });
    } else {
      console.log('⚠️ OpenAI service initialized without API key - requests will fail until key is provided');
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return this.openai !== null && this.apiKey !== null;
  }

  /**
   * Converts SystemSpecification to OpenAI system message
   * Enhanced to support task-specific modifications
   */
  private buildSystemMessage(spec: SystemSpecification, task?: PromptTaskType): OpenAIMessage {
    let systemContent = `
Role: ${spec.role}

Background: ${spec.background}

Personality: ${spec.personality}

Rules:
${spec.rules.map((rule: string) => `- ${rule}`).join('\n')}
`;

    // Add task-specific enhancements
    if (task) {
      systemContent += this.getTaskSpecificInstructions(task);
    }

    systemContent += '\nPlease respond according to this specification and maintain consistency throughout the conversation.';

    return {
      role: 'system',
      content: systemContent.trim()
    };
  }

  /**
   * Get task-specific instructions to append to the system message
   */
  private getTaskSpecificInstructions(task: PromptTaskType): string {
    switch (task) {
      case 'weekly-report':
        return `

Task-Specific Instructions for Weekly Report:
- Focus on the last 7 days of expense data
- Highlight emotional drivers: categories with strongly negative avg. emotion (≤ -3) and strongly positive avg. emotion (≥ +3)
- Mark outliers (≥ P95 of the last 6 weeks or > 2× category average)
- Deliver "What stood out?" as exactly 3 bullet points
- Use the provided JSON structure for response format`;

      case 'overall-report':
        return `

Task-Specific Instructions for Overall Report:
- Create an overall financial report for the user
- This is currently a placeholder implementation
- Return a simple HelloWorld response for now: {"message": "Hello World - Overall report placeholder"}`;

      default:
        return '';
    }
  }

  /**
   * Sends a message to OpenAI and returns the response
   * Extended to support task-based prompts for multi-prompt functionality
   */
  async sendMessage(
    systemSpec: SystemSpecification,
    userMessage: UserMessage,
    model: string = 'gpt-3.5-turbo',
    task?: PromptTaskType
  ): Promise<OpenAIResponse> {
    if (!this.isConfigured() || !this.openai) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable with a valid API key.');
    }

    try {
      const messages: OpenAIMessage[] = [
        this.buildSystemMessage(systemSpec, task),
        {
          role: 'user',
          content: userMessage.content
        }
      ];

      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response received from OpenAI');
      }

      return {
        content: choice.message.content || '',
        timestamp: new Date(),
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens
        } : undefined,
        model: completion.model
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown error occurred while calling OpenAI API');
    }
  }

  /**
   * Validates the OpenAI API key
   */
  async validateApiKey(): Promise<boolean> {
    if (!this.isConfigured() || !this.openai) {
      return false;
    }
    
    try {
      await this.openai.models.list();
      return true;
    } catch {
      return false;
    }
  }
}