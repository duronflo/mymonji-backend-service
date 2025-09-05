import { useState } from 'react';
import { ApiService } from '../services/api.service';

export function HealthCheck() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const checkHealth = async () => {
    setIsLoading(true);
    setResult('');

    try {
      const response = await ApiService.getHealth();
      
      if (response.success && response.data) {
        setResult(`✅ Health Check Passed
Status: ${response.data.status}
Uptime: ${response.data.uptime} seconds`);
      } else {
        setResult(`❌ Health Check Failed: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      setResult(`❌ Health Check Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="health-check">
      <h3>Health Check</h3>
      <p>Test the server health endpoint</p>
      
      <button 
        onClick={checkHealth} 
        disabled={isLoading}
        className="btn btn-primary"
      >
        {isLoading ? 'Checking...' : 'Check Health'}
      </button>
      
      {result && (
        <div className="result">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}