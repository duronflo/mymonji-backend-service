import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { UserRecommendationsRequest, UserRecommendationsResponse, Recommendation } from '../types/index';

export function UserRecommendations() {
  const [uid, setUid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDebugInfo, setIncludeDebugInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [debugData, setDebugData] = useState<any>(null);

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

      const response = await ApiService.getUserRecommendations(uid, request);
      
      if (response.success && response.data) {
        const data = response.data as UserRecommendationsResponse;
        let resultText = `✅ Recommendations Generated Successfully\nUser ID: ${data.uid}\n\nRecommendations:\n`;
        
        if (data.recommendations && data.recommendations.length > 0) {
          data.recommendations.forEach((rec: Recommendation, index: number) => {
            resultText += `\n${index + 1}. Category: ${rec.category}\n   Advice: ${rec.advice}\n`;
          });
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
      
      <button 
        onClick={getRecommendations} 
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Generating...' : 'Get Recommendations'}
      </button>
      
      {result && (
        <div className="result">
          <pre>{result}</pre>
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

          {debugData.openaiResponse && (
            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                🤖 OpenAI Response
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
                <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                  {debugData.openaiResponse}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}