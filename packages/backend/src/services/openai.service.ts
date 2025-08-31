import OpenAI from 'openai';
import { SystemSpecification, UserMessage, OpenAIMessage, OpenAIResponse } from '../types';

export class OpenAIService {
  private openai: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    
    if (!key || key === 'test_key_placeholder' || key === 'your_openai_api_key_here' || key.trim() === '') {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable with a valid API key.');
    }
    
    // Log masked key for debugging (show first 7 chars and last 4 chars)
    const maskedKey = key.length > 11 ? `${key.substring(0, 7)}...${key.substring(key.length - 4)}` : '***masked***';
    console.log(`🔑 Using OpenAI API key: ${maskedKey}`);
    
    this.openai = new OpenAI({
      apiKey: key,
    });
  }

  /**
   * Converts SystemSpecification to OpenAI system message
   */
  private buildSystemMessage(spec: SystemSpecification): OpenAIMessage {
    const systemContent = `
Role: ${spec.role}

Background: ${spec.background}

Personality: ${spec.personality}

Rules:
${spec.rules.map((rule: string) => `- ${rule}`).join('\n')}

Please respond according to this specification and maintain consistency throughout the conversation.
    `.trim();

    return {
      role: 'system',
      content: systemContent
    };
  }

  /**
   * Sends a message to OpenAI and returns the response
   */
  async sendMessage(
    systemSpec: SystemSpecification,
    userMessage: UserMessage,
    model: string = 'gpt-3.5-turbo'
  ): Promise<OpenAIResponse> {
    try {
      const messages: OpenAIMessage[] = [
        this.buildSystemMessage(systemSpec),
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
    try {
      await this.openai.models.list();
      return true;
    } catch {
      return false;
    }
  }
}