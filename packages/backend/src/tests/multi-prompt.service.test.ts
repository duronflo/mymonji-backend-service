import { MultiPromptService } from '../services/multi-prompt.service';
import { OpenAIService } from '../services/openai.service';
import type { MultiPromptRequest, TaskResult } from '../types';

// Mock the OpenAI service
jest.mock('../services/openai.service');

describe('MultiPromptService', () => {
  let multiPromptService: MultiPromptService;
  let mockOpenAIService: jest.Mocked<OpenAIService>;

  beforeEach(() => {
    mockOpenAIService = new OpenAIService('test-api-key') as jest.Mocked<OpenAIService>;
    multiPromptService = new MultiPromptService(mockOpenAIService);
  });

  describe('createPromptTasks', () => {
    it('should create weekly report and overall report tasks', () => {
      const tasks = multiPromptService.createPromptTasks();
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].type).toBe('weekly-report');
      expect(tasks[1].type).toBe('overall-report');
      
      // Check that both tasks have the same role and context
      expect(tasks[0].role).toContain('Money Coach');
      expect(tasks[1].role).toContain('Money Coach');
      expect(tasks[0].context).toContain('money coach who advises individual clients');
      expect(tasks[1].context).toContain('money coach who advises individual clients');
    });

    it('should create weekly report task with correct structure', () => {
      const tasks = multiPromptService.createPromptTasks();
      const weeklyTask = tasks.find(t => t.type === 'weekly-report');
      
      expect(weeklyTask).toBeDefined();
      expect(weeklyTask!.task).toContain('last 7 days');
      expect(weeklyTask!.task).toContain('emotional drivers');
      expect(weeklyTask!.task).toContain('≤ -3');
      expect(weeklyTask!.task).toContain('≥ +3');
      expect(weeklyTask!.expectedFormat).toContain('report_period');
      expect(weeklyTask!.expectedFormat).toContain('insights');
      expect(weeklyTask!.expectedFormat).toContain('what_stood_out');
    });

    it('should create overall report task with HelloWorld placeholder', () => {
      const tasks = multiPromptService.createPromptTasks();
      const overallTask = tasks.find(t => t.type === 'overall-report');
      
      expect(overallTask).toBeDefined();
      expect(overallTask!.guidelines).toContain('This is a placeholder implementation');
      expect(overallTask!.expectedFormat).toContain('Hello World');
    });
  });

  describe('processMultiplePrompts', () => {
    it('should process multiple tasks and return results', async () => {
      const mockResponse1 = {
        content: '{"report_period": {"start": "2025-01-01", "end": "2025-01-07"}}',
        timestamp: new Date(),
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 }
      };

      const mockResponse2 = {
        content: '{"message": "Hello World - Overall report placeholder"}',
        timestamp: new Date(),
        usage: { promptTokens: 80, completionTokens: 30, totalTokens: 110 }
      };

      mockOpenAIService.sendMessage
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const request: MultiPromptRequest = {
        tasks: multiPromptService.createPromptTasks(),
        expenseData: [
          {
            date: '2025-01-01',
            description: 'Test expense',
            amount: 50,
            category: 'Food',
            emotion: -2
          }
        ],
        userData: { name: 'Test User' },
        dateRange: {
          startDate: '2025-01-01',
          endDate: '2025-01-07'
        }
      };

      const result = await multiPromptService.processMultiplePrompts(request);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].type).toBe('weekly-report');
      expect(result.results[1].type).toBe('overall-report');
      expect(result.totalUsage).toEqual({
        promptTokens: 180,
        completionTokens: 80,
        totalTokens: 260
      });
    });

    it('should handle errors in task processing', async () => {
      mockOpenAIService.sendMessage
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          content: '{"message": "Success"}',
          timestamp: new Date()
        });

      const request: MultiPromptRequest = {
        tasks: multiPromptService.createPromptTasks(),
        expenseData: [],
        userData: null
      };

      const result = await multiPromptService.processMultiplePrompts(request);

      expect(result.results).toHaveLength(2);
      expect(result.results[0].content).toContain('Error processing weekly-report');
      expect(result.results[1].content).toBe('{"message": "Success"}');
    });

    it('should process request with no expense data', async () => {
      const mockResponse = {
        content: '{"message": "No data analysis"}',
        timestamp: new Date()
      };

      mockOpenAIService.sendMessage.mockResolvedValue(mockResponse);

      const request: MultiPromptRequest = {
        tasks: [multiPromptService.createPromptTasks()[0]], // Only weekly report
        expenseData: [],
        userData: null
      };

      const result = await multiPromptService.processMultiplePrompts(request);

      expect(result.results).toHaveLength(1);
      expect(mockOpenAIService.sendMessage).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          content: expect.stringContaining('Expense Data: No data available')
        })
      );
    });
  });
});