import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { UserRecommendationsRequest, UserRecommendationsResponse, Recommendation, PromptTaskType } from '../types/index';

export function UserRecommendations() {
  const [uid, setUid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTask, setSelectedTask] = useState<PromptTaskType>('weekly-report');
  const [includeDebugInfo, setIncludeDebugInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMultiPrompt, setIsLoadingMultiPrompt] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [result, setResult] = useState<string>('');
  const [multiPromptResult, setMultiPromptResult] = useState<string>('');
  const [usersResult, setUsersResult] = useState<string>('');
  const [debugData, setDebugData] = useState<any>(null);
  const [multiPromptDebugData, setMultiPromptDebugData] = useState<any>(null);

  const getRecommendations = async () => {
    if (!uid.trim()) {
      setResult('❌ Please enter a User ID');
      return;
    }

    setIsLoading(true);
    setResult('');
    setDebugData(null);

    try {
      const request: UserRecommendationsRequest = {};
      
      if (startDate) request.startDate = startDate;
      if (endDate) request.endDate = endDate;
      if (includeDebugInfo) request.includeDebugInfo = true;
      // Add task parameters for multi-prompt functionality
      request.tasks = ['weekly-report', 'overall-report'];

      const response = await ApiService.getUserRecommendations(uid, request);
      
      if (response.success && response.data) {
        const data = response.data as UserRecommendationsResponse;
        let resultText = `✅ Recommendations Generated Successfully\nUser ID: ${data.uid}\n\nRecommendations:\n`;
        
        if (data.recommendations && data.recommendations.length > 0) {
          data.recommendations.forEach((rec: Recommendation, index: number) => {
            resultText += `\n${index + 1}. Category: ${rec.category}\n   Advice: ${rec.advice}\n`;
          });

          if (data.debug && data.debug.totalUsage) {
            resultText += `\nTotal Usage: ${data.debug.totalUsage.totalTokens} tokens\n`;
          }
        } else {
          resultText += '\nNo recommendations found for this user.';
        }

        if (data.debug) {
          resultText += `\n\nDebug Information:\n`;
          resultText += `Processing Time: ${data.debug.processingTime}ms\n`;
          if (data.debug.openaiUsage) {
            resultText += `OpenAI Usage: ${data.debug.openaiUsage.totalTokens} tokens (${data.debug.openaiUsage.promptTokens} prompt + ${data.debug.openaiUsage.completionTokens} completion)\n`;
          }
        }
        
        setResult(resultText);
        
        // Store debug data for expandable sections
        if (data.debug) {
          setDebugData(data.debug);
        }
      } else {
        setResult(`❌ Failed to get recommendations: ${response.error || 'Unknown error'}`);
      }

      // Check for debug data even if request failed (for debugging purposes)
      if (response.data && (response.data as UserRecommendationsResponse).debug) {
        const data = response.data as UserRecommendationsResponse;
        setDebugData(data.debug);
      }
    } catch (error) {
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getMultiPromptAnalysis = async () => {
    if (!uid.trim()) {
      setMultiPromptResult('❌ Please enter a User ID');
      return;
    }

    setIsLoadingMultiPrompt(true);
    setMultiPromptResult('');
    setMultiPromptDebugData(null);

    try {
      const request: UserRecommendationsRequest = {};
      
      if (startDate) request.startDate = startDate;
      if (endDate) request.endDate = endDate;
      if (includeDebugInfo) request.includeDebugInfo = true;
      // Use selected task instead of hard-coded tasks
      request.task = selectedTask;

      const response = await ApiService.getMultiPromptAnalysis(uid, request);
      
      if (response.success && response.data) {
        const data = response.data;
        let resultText = `✅ Multi-Prompt Analysis Generated Successfully\nUser ID: ${data.uid}\nTask: ${selectedTask}\n\n`;
        
        // Show basic recommendations
        if (data.recommendations && data.recommendations.length > 0) {
          resultText += `Recommendations from ${selectedTask}:\n`;
          data.recommendations.forEach((rec: Recommendation, index: number) => {
            resultText += `\n${index + 1}. ${rec.category}: ${rec.advice}\n`;
          });
        } else {
          resultText += 'No recommendations found for this user.\n';
        }

        // Show multi-prompt results
        if (data.taskResults && data.taskResults.length > 0) {
          resultText += `\n\nTask Analysis Results:\n`;
          
          data.taskResults.forEach((result: any, index: number) => {
            resultText += `\n--- Task ${index + 1}: ${result.type} ---\n`;
            try {
              // Try to parse and format JSON content
              const parsedContent = JSON.parse(result.content);
              if (result.type === 'weekly-report') {
                resultText += `Period: ${parsedContent.report_period?.start} to ${parsedContent.report_period?.end}\n`;
                resultText += `Total Expenses: €${parsedContent.kpis?.total_expenses_eur || 0}\n`;
                resultText += `Transactions: ${parsedContent.kpis?.transactions_count || 0}\n`;
                if (parsedContent.insights?.what_stood_out) {
                  resultText += `\nKey Insights:\n`;
                  parsedContent.insights.what_stood_out.forEach((insight: string, i: number) => {
                    resultText += `  ${i + 1}. ${insight}\n`;
                  });
                }
              } else {
                resultText += `${JSON.stringify(parsedContent, null, 2)}\n`;
              }
            } catch {
              // If not valid JSON, show raw content
              resultText += `${result.content}\n`;
            }
            if (result.usage) {
              resultText += `Tokens: ${result.usage.totalTokens} (${result.usage.promptTokens} prompt + ${result.usage.completionTokens} completion)\n`;
            }
          });

          if (data.debug && data.debug.totalUsage) {
            resultText += `\nTotal Usage: ${data.debug.totalUsage.totalTokens} tokens\n`;
          }

        }

        setMultiPromptResult(resultText);
        
        // Store debug data for expandable sections
        if (data.debug) {
          setMultiPromptDebugData(data.debug);
        }
      } else {
        setMultiPromptResult(`❌ Failed to get multi-prompt analysis: ${response.error || 'Unknown error'}`);
      }

      // Check for debug data even if request failed
      if (response.data && response.data.debug) {
        setMultiPromptDebugData(response.data.debug);
      }
    } catch (error) {
      setMultiPromptResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingMultiPrompt(false);
    }
  };

  const getAllUsers = async () => {
    setIsLoadingUsers(true);
    setUsersResult('');

    try {
      const response = await ApiService.getAllUsers();
      
      if (response.success && response.data) {
        const users = response.data;
        let resultText = `✅ Retrieved ${users.length} users successfully\n\n`;
        
        // Create table format
        resultText += `${'UID'.padEnd(20)} | Email\n`;
        resultText += `${'-'.repeat(20)} | ${'-'.repeat(40)}\n`;
        
        users.forEach(user => {
          const uid = user.uid.padEnd(20);
          const email = user.email || 'N/A';
          resultText += `${uid} | ${email}\n`;
        });
        
        setUsersResult(resultText);
      } else {
        setUsersResult(`❌ Failed to get users: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      setUsersResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  return (
    <div className="user-recommendations">
      <h3>User Recommendations</h3>
      <p>Generate personalized financial recommendations for a specific user</p>
      
      <div className="form-group">
        <label htmlFor="uid">User ID (required):</label>
        <input
          id="uid"
          type="text"
          value={uid}
          onChange={(e) => setUid(e.target.value)}
          placeholder="Enter user ID (e.g., abc123)"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="startDate">Start Date (optional):</label>
        <input
          id="startDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="endDate">End Date (optional):</label>
        <input
          id="endDate"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="selectedTask">Task for Multi-Prompt Analysis:</label>
        <select
          id="selectedTask"
          value={selectedTask}
          onChange={(e) => setSelectedTask(e.target.value as PromptTaskType)}
          className="form-input"
        >
          <option value="weekly-report">Weekly Report</option>
          <option value="overall-report">Overall Report</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={includeDebugInfo}
            onChange={(e) => setIncludeDebugInfo(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Include debug information (Firebase data & OpenAI responses)
        </label>
      </div>
      
      <div className="button-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={getRecommendations} 
          disabled={isLoading}
          className="btn btn-primary"
        >
          {isLoading ? 'Generating...' : 'Get Recommendations'}
        </button>

        <button 
          onClick={getMultiPromptAnalysis} 
          disabled={isLoadingMultiPrompt}
          className="btn btn-secondary"
        >
          {isLoadingMultiPrompt ? 'Analyzing...' : `Get ${selectedTask.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`}
        </button>

        <button 
          onClick={getAllUsers} 
          disabled={isLoadingUsers}
          className="btn btn-info"
        >
          {isLoadingUsers ? 'Loading...' : 'Get All Users'}
        </button>
      </div>
      
      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}

      {multiPromptResult && (
        <div className="result" style={{ marginTop: '20px' }}>
          <h4>📊 Multi-Prompt Analysis Results</h4>
          <pre>{multiPromptResult}</pre>
        </div>
      )}

      {usersResult && (
        <div className="result" style={{ marginTop: '20px' }}>
          <h4>👥 All Users</h4>
          <pre>{usersResult}</pre>
        </div>
      )}

      {debugData && (
        <div className="debug-section" style={{ marginTop: '20px' }}>
          <h4>🔍 Debug Information</h4>
          
          {debugData.firebaseUserData && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                👤 Firebase User Data
              </summary>
              <div style={{ 
                background: '#f5f5f5', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px' }}>
                  {JSON.stringify(debugData.firebaseUserData, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {debugData.firebaseExpenseData && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                💳 Firebase Expense Data ({Array.isArray(debugData.firebaseExpenseData) ? debugData.firebaseExpenseData.length : 0} expenses)
              </summary>
              <div style={{ 
                background: '#f5f5f5', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                {Array.isArray(debugData.firebaseExpenseData) ? (
                  <div>
                    {debugData.firebaseExpenseData.map((expense: any, index: number) => (
                      <details key={index} style={{ marginBottom: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                        <summary style={{ 
                          cursor: 'pointer', 
                          padding: '8px', 
                          backgroundColor: '#ffffff',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: 'bold'
                        }}>
                          Expense #{index + 1}: {expense.name || 'Unnamed'} - {expense.amount} {expense.currencyCode || ''} ({expense.category || 'No category'})
                        </summary>
                        <div style={{ 
                          padding: '10px', 
                          backgroundColor: '#fafafa',
                          fontSize: '12px'
                        }}>
                          <pre style={{ margin: 0 }}>
                            {JSON.stringify(expense, null, 2)}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                ) : (
                  <pre style={{ margin: 0, fontSize: '12px' }}>
                    {JSON.stringify(debugData.firebaseExpenseData, null, 2)}
                  </pre>
                )}
              </div>
            </details>
          )}

          {/* Legacy support for old firebaseData field */}
          {debugData.firebaseData && !debugData.firebaseUserData && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                📊 Firebase Data Structure (Legacy)
              </summary>
              <div style={{ 
                background: '#f5f5f5', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px' }}>
                  {JSON.stringify(debugData.firebaseData, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {debugData.openaiInput && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#ff6600' }}>
                📤 What was sent TO OpenAI
              </summary>
              <div style={{ 
                background: '#fff8f0', 
                border: '2px solid #ff6600', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#ff6600' }}>System Specification:</h5>
                  <pre style={{ margin: 0, fontSize: '12px', background: '#ffffff', padding: '8px', borderRadius: '3px' }}>
                    {JSON.stringify(debugData.openaiInput.systemSpecification, null, 2)}
                  </pre>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: '#ff6600' }}>Complete Prompt Sent:</h5>
                  <pre style={{ margin: 0, fontSize: '12px', background: '#ffffff', padding: '8px', borderRadius: '3px', whiteSpace: 'pre-wrap' }}>
                    {debugData.openaiInput.prompt}
                  </pre>
                </div>
                <div>
                  <h5 style={{ margin: '0 0 10px 0', color: '#ff6600' }}>Request Summary:</h5>
                  <pre style={{ margin: 0, fontSize: '12px', background: '#ffffff', padding: '8px', borderRadius: '3px' }}>
                    {JSON.stringify(debugData.openaiInput.expenseDataSummary, null, 2)}
                  </pre>
                </div>
              </div>
            </details>
          )}

          {debugData.openaiResponse && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                📥 What OpenAI returned
              </summary>
              <div style={{ 
                background: '#f0f8ff', 
                border: '2px solid #0066cc', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {debugData.openaiResponse}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}

      {multiPromptDebugData && (
        <div className="debug-section" style={{ marginTop: '20px' }}>
          <h4>🔍 Multi-Prompt Debug Information</h4>
          
          {multiPromptDebugData.multiPromptInput && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#9966cc' }}>
                📤 Multi-Prompt Input Sent to AI
              </summary>
              <div style={{ 
                background: '#f8f0ff', 
                border: '2px solid #9966cc', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px' }}>
                  {JSON.stringify(multiPromptDebugData.multiPromptInput, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {multiPromptDebugData.taskResults && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#cc6699' }}>
                📥 Raw Multi-Prompt Results from AI
              </summary>
              <div style={{ 
                background: '#fff0f8', 
                border: '2px solid #cc6699', 
                borderRadius: '4px', 
                padding: '10px', 
                marginTop: '10px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, fontSize: '12px' }}>
                  {JSON.stringify(multiPromptDebugData.taskResults, null, 2)}
                </pre>
              </div>
            </details>
          )}

          {multiPromptDebugData.processingTime && (
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              ⏱️ Processing time: {multiPromptDebugData.processingTime}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
}