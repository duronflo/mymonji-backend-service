import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { UserRecommendationsRequest, UserRecommendationsResponse, Recommendation } from '../types/index';

export function UserRecommendations() {
  const [uid, setUid] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const getRecommendations = async () => {
    if (!uid.trim()) {
      setResult('❌ Please enter a User ID');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const request: UserRecommendationsRequest = {};
      
      if (startDate) request.startDate = startDate;
      if (endDate) request.endDate = endDate;

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
        
        setResult(resultText);
      } else {
        setResult(`❌ Failed to get recommendations: ${response.error || 'Unknown error'}`);
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
    </div>
  );
}