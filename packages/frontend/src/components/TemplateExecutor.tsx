import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { PromptTemplate } from '../types/index';

interface ExecutionStep {
  step: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  data?: any;
  error?: string;
}

export function TemplateExecutor({ templates }: { templates: PromptTemplate[] }) {
  const [userId, setUserId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionSteps, setExecutionSteps] = useState<ExecutionStep[]>([]);

  const resetExecution = () => {
    setExecutionSteps([]);
  };

  const updateStep = (stepName: string, status: ExecutionStep['status'], data?: any, error?: string) => {
    setExecutionSteps(prev => {
      const existing = prev.find(s => s.step === stepName);
      if (existing) {
        return prev.map(s => 
          s.step === stepName 
            ? { ...s, status, data, error }
            : s
        );
      }
      return [...prev, { step: stepName, status, data, error }];
    });
  };

  const executeTemplate = async () => {
    if (!userId.trim()) {
      alert('Please enter a User ID');
      return;
    }

    if (!selectedTemplateId) {
      alert('Please select a template');
      return;
    }

    setIsExecuting(true);
    resetExecution();

    const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

    try {
      // Step 1: Template Selection
      updateStep('Template Selected', 'loading');
      await new Promise(resolve => setTimeout(resolve, 300));
      updateStep('Template Selected', 'success', {
        name: selectedTemplate?.name,
        description: selectedTemplate?.description,
        firebaseDataEnabled: selectedTemplate?.firebaseData?.enabled
      });

      // Step 2: Execute Template with Backend (request debug info)
      updateStep('Executing Template', 'loading');
      const response = await ApiService.sendWithTemplate({
        templateId: selectedTemplateId,
        userId: userId,
        includeDebugInfo: true  // Request detailed debug information
      });

      console.log('🔍 [FRONTEND DEBUG] API Response:', response);
      console.log('🔍 [FRONTEND DEBUG] Response data:', response.data);
      console.log('🔍 [FRONTEND DEBUG] Debug info:', response.data?.debug);

      if (response.success && response.data) {
        updateStep('Executing Template', 'success', {
          message: 'Template executed successfully',
          responseLength: response.data.content?.length || 0
        });

        // Step 3: Show Firebase Data Fetched (if available in debug info)
        if (response.data.debug?.firebaseData) {
          console.log('🔍 [FRONTEND DEBUG] Firebase data found, creating step');
          updateStep('Firebase Data Fetched', 'success', {
            userData: response.data.debug.firebaseData.userData,
            expenseCount: response.data.debug.firebaseData.expenses?.length || 0,
            expenses: response.data.debug.firebaseData.expenses || []
          });
        } else {
          console.log('⚠️ [FRONTEND DEBUG] No Firebase data in response');
        }

        // Step 4: Show Prompt Sent to OpenAI (if available in debug info)
        if (response.data.debug?.promptSentToOpenAI) {
          console.log('🔍 [FRONTEND DEBUG] Prompt data found, creating step');
          updateStep('Prompt Sent to OpenAI', 'success', {
            prompt: response.data.debug.promptSentToOpenAI,
            systemSpec: response.data.debug.systemSpecUsed
          });
        } else {
          console.log('⚠️ [FRONTEND DEBUG] No prompt data in response');
        }

        // Step 5: OpenAI Response Received
        updateStep('OpenAI Response Received', 'success', {
          content: response.data.content,
          usage: response.data.usage
        });

        // Step 6: Response Saved to Firebase
        updateStep('Response Saved to Firebase', 'success', {
          path: `/users2/${userId}/prompts`,
          message: 'Response automatically saved to Firebase'
        });
      } else {
        throw new Error(response.error || 'Failed to execute template');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update the last step that was loading to error
      setExecutionSteps(prev => {
        // Find the last loading step by iterating backwards
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].status === 'loading') {
            return prev.map((s, index) => 
              index === i 
                ? { ...s, status: 'error', error: errorMessage }
                : s
            );
          }
        }
        return prev;
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepIcon = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'loading': return '⏳';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStepColor = (status: ExecutionStep['status']) => {
    switch (status) {
      case 'pending': return '#999';
      case 'loading': return '#0066cc';
      case 'success': return '#00aa00';
      case 'error': return '#cc0000';
    }
  };

  return (
    <div className="template-executor" style={{ padding: '20px' }}>
      <h3>Template Executor</h3>
      <p>Execute a prompt template for a specific user and see all the steps</p>
      
      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="userId" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          User ID (required):
        </label>
        <input
          id="userId"
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter user ID"
          className="form-input"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          disabled={isExecuting}
        />
      </div>

      <div className="form-group" style={{ marginBottom: '15px' }}>
        <label htmlFor="templateSelect" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
          Template/Job (required):
        </label>
        <select
          id="templateSelect"
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="form-input"
          style={{
            width: '100%',
            padding: '8px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
          disabled={isExecuting}
        >
          <option value="">-- Select a template --</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} {template.category ? `(${template.category})` : ''}
            </option>
          ))}
        </select>
      </div>
      
      <button 
        onClick={executeTemplate} 
        disabled={isExecuting || !userId.trim() || !selectedTemplateId}
        className="btn btn-primary"
        style={{
          padding: '10px 20px',
          backgroundColor: isExecuting || !userId.trim() || !selectedTemplateId ? '#ccc' : '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: isExecuting || !userId.trim() || !selectedTemplateId ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {isExecuting ? 'Executing...' : 'Execute Template'}
      </button>

      {executionSteps.length > 0 && (
        <div className="execution-steps" style={{ marginTop: '20px' }}>
          <h4 style={{ marginBottom: '15px' }}>Execution Steps:</h4>
          
          {executionSteps.map((step, index) => (
            <div 
              key={index}
              style={{
                marginBottom: '15px',
                padding: '15px',
                border: `2px solid ${getStepColor(step.status)}`,
                borderRadius: '8px',
                backgroundColor: step.status === 'error' ? '#fff5f5' : step.status === 'success' ? '#f5fff5' : '#f9f9f9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '20px', marginRight: '10px' }}>
                  {getStepIcon(step.status)}
                </span>
                <strong style={{ color: getStepColor(step.status), fontSize: '16px' }}>
                  Step {index + 1}: {step.step}
                </strong>
              </div>

              {step.status === 'loading' && (
                <div style={{ color: '#666', fontStyle: 'italic' }}>
                  Processing...
                </div>
              )}

              {step.status === 'error' && step.error && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  backgroundColor: '#ffebee',
                  border: '1px solid #ffcdd2',
                  borderRadius: '4px',
                  color: '#c62828'
                }}>
                  <strong>Error:</strong> {step.error}
                </div>
              )}

              {step.status === 'success' && step.data && (
                <div style={{ marginTop: '10px' }}>
                  {step.step === 'Template Selected' && (
                    <div style={{ fontSize: '14px' }}>
                      <div><strong>Name:</strong> {step.data.name}</div>
                      <div><strong>Description:</strong> {step.data.description}</div>
                      <div><strong>Firebase Data:</strong> {step.data.firebaseDataEnabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  )}

                  {step.step === 'Fetching User Data from Firebase' && (
                    <div style={{ fontSize: '14px' }}>
                      <div>{step.data.message}</div>
                      {step.data.dateRange && (
                        <div style={{ marginTop: '5px' }}>
                          <strong>Date Range:</strong> {JSON.stringify(step.data.dateRange)}
                        </div>
                      )}
                    </div>
                  )}

                  {step.step === 'Firebase Data Fetched' && (
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                        📊 View Firebase Data ({step.data.expenseCount} expenses)
                      </summary>
                      <div style={{ 
                        marginTop: '10px',
                        padding: '15px',
                        backgroundColor: '#fff8e1',
                        border: '1px solid #ffc107',
                        borderRadius: '4px',
                        maxHeight: '400px',
                        overflow: 'auto'
                      }}>
                        {step.data.userData && (
                          <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#f57c00' }}>User Data:</strong>
                            <pre style={{ 
                              margin: '5px 0 0 0',
                              whiteSpace: 'pre-wrap',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              backgroundColor: '#fff',
                              padding: '10px',
                              borderRadius: '4px'
                            }}>
                              {JSON.stringify(step.data.userData, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div>
                          <strong style={{ color: '#f57c00' }}>Expenses ({step.data.expenseCount}):</strong>
                          <pre style={{ 
                            margin: '5px 0 0 0',
                            whiteSpace: 'pre-wrap',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            backgroundColor: '#fff',
                            padding: '10px',
                            borderRadius: '4px'
                          }}>
                            {JSON.stringify(step.data.expenses, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}

                  {step.step === 'Prompt Sent to OpenAI' && (
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                        📤 View Complete Prompt Sent to OpenAI
                      </summary>
                      <div style={{ 
                        marginTop: '10px',
                        padding: '15px',
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #2196f3',
                        borderRadius: '4px',
                        maxHeight: '400px',
                        overflow: 'auto'
                      }}>
                        {step.data.systemSpec && (
                          <div style={{ marginBottom: '15px' }}>
                            <strong style={{ color: '#1976d2' }}>System Specification:</strong>
                            <pre style={{ 
                              margin: '5px 0 0 0',
                              whiteSpace: 'pre-wrap',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              backgroundColor: '#fff',
                              padding: '10px',
                              borderRadius: '4px'
                            }}>
                              {JSON.stringify(step.data.systemSpec, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div>
                          <strong style={{ color: '#1976d2' }}>User Prompt (with Firebase data):</strong>
                          <pre style={{ 
                            margin: '5px 0 0 0',
                            whiteSpace: 'pre-wrap',
                            fontSize: '12px',
                            fontFamily: 'monospace',
                            backgroundColor: '#fff',
                            padding: '10px',
                            borderRadius: '4px'
                          }}>
                            {step.data.prompt}
                          </pre>
                        </div>
                      </div>
                    </details>
                  )}

                  {step.step === 'Executing Template via API' && (
                    <div style={{ fontSize: '14px' }}>
                      <div>{step.data.message}</div>
                      <div><strong>Response Length:</strong> {step.data.responseLength} characters</div>
                    </div>
                  )}

                  {step.step === 'OpenAI Response Received' && (
                    <details style={{ marginTop: '10px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                        📥 View OpenAI Response
                      </summary>
                      <div style={{ 
                        marginTop: '10px',
                        padding: '15px',
                        backgroundColor: '#f0f8ff',
                        border: '1px solid #0066cc',
                        borderRadius: '4px',
                        maxHeight: '300px',
                        overflow: 'auto'
                      }}>
                        <pre style={{ 
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          fontSize: '13px',
                          fontFamily: 'monospace'
                        }}>
                          {step.data.content}
                        </pre>
                        {step.data.usage && (
                          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                            <strong>Token Usage:</strong> {step.data.usage.totalTokens} tokens 
                            ({step.data.usage.promptTokens} prompt + {step.data.usage.completionTokens} completion)
                          </div>
                        )}
                      </div>
                    </details>
                  )}

                  {step.step === 'Response Saved to Firebase' && (
                    <div style={{ fontSize: '14px' }}>
                      <div>{step.data.message}</div>
                      <div><strong>Path:</strong> <code>{step.data.path}</code></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
