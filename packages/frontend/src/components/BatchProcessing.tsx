import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { BatchJobRequest, BatchJobResponse, BatchJobStatusResponse } from '../types/index';

export function BatchProcessing() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [includeDebugInfo, setIncludeDebugInfo] = useState(false);
  const [jobId, setJobId] = useState('');
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [jobResult, setJobResult] = useState<string>('');
  const [statusResult, setStatusResult] = useState<string>('');
  const [debugData, setDebugData] = useState<any>(null);

  const startBatchJob = async () => {
    setIsStartingJob(true);
    setJobResult('');

    try {
      const request: BatchJobRequest = {};
      
      if (startDate) request.startDate = startDate;
      if (endDate) request.endDate = endDate;
      if (includeDebugInfo) request.includeDebugInfo = true;

      const response = await ApiService.startBatchJob(request);
      
      if (response.success && response.data) {
        const data = response.data as BatchJobResponse;
        const resultText = `✅ Batch Job Started Successfully
Status: ${data.status}
Job ID: ${data.jobId}

You can now check the status using the job ID above.`;
        setJobResult(resultText);
        setJobId(data.jobId); // Auto-populate the status check field
      } else {
        setJobResult(`❌ Failed to start batch job: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      setJobResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStartingJob(false);
    }
  };

  const checkJobStatus = async () => {
    if (!jobId.trim()) {
      setStatusResult('❌ Please enter a Job ID');
      return;
    }

    setIsCheckingStatus(true);
    setStatusResult('');
    setDebugData(null);

    try {
      const response = await ApiService.getBatchJobStatus(jobId);
      
      if (response.success && response.data) {
        const data = response.data as BatchJobStatusResponse;
        let resultText = `✅ Job Status Retrieved Successfully
Job ID: ${data.jobId}
Status: ${data.status}`;

        if (data.processedUsers !== undefined) {
          resultText += `\nProcessed Users: ${data.processedUsers}`;
        }
        
        if (data.durationSec !== undefined) {
          resultText += `\nDuration: ${data.durationSec} seconds`;
        }

        if (data.debug) {
          resultText += `\n\nDebug Information:`;
          resultText += `\nTotal Users: ${data.debug.totalUsers}`;
          if (data.debug.sampleOpenaiUsage) {
            resultText += `\nSample OpenAI Usage: ${data.debug.sampleOpenaiUsage.totalTokens} tokens (${data.debug.sampleOpenaiUsage.promptTokens} prompt + ${data.debug.sampleOpenaiUsage.completionTokens} completion)`;
          }
          if (data.debug.processingErrors && data.debug.processingErrors.length > 0) {
            resultText += `\nProcessing Errors: ${data.debug.processingErrors.length}`;
          }
        }

        setStatusResult(resultText);
        
        // Store debug data for expandable sections
        if (data.debug) {
          setDebugData(data.debug);
        }
      } else {
        setStatusResult(`❌ Failed to get job status: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      setStatusResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="batch-processing">
      <h3>Batch Processing</h3>
      <p>Start batch jobs to process recommendations for all users</p>
      
      <div className="batch-start">
        <h4>Start Batch Job</h4>
        
        <div className="form-group">
          <label htmlFor="batchStartDate">Start Date (optional):</label>
          <input
            id="batchStartDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="batchEndDate">End Date (optional):</label>
          <input
            id="batchEndDate"
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
          onClick={startBatchJob} 
          disabled={isStartingJob}
          className="btn btn-primary"
        >
          {isStartingJob ? 'Starting Job...' : 'Start Batch Job'}
        </button>
        
        {jobResult && (
          <div className="result">
            <pre>{jobResult}</pre>
          </div>
        )}
      </div>

      <div className="batch-status">
        <h4>Check Job Status</h4>
        
        <div className="form-group">
          <label htmlFor="jobId">Job ID:</label>
          <input
            id="jobId"
            type="text"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            placeholder="Enter job ID (e.g., batch_1725253432)"
            className="form-input"
          />
        </div>
        
        <button 
          onClick={checkJobStatus} 
          disabled={isCheckingStatus}
          className="btn btn-secondary"
        >
          {isCheckingStatus ? 'Checking...' : 'Check Status'}
        </button>
        
        {statusResult && (
          <div className="result">
            <pre>{statusResult}</pre>
          </div>
        )}

        {debugData && (
          <div className="debug-section" style={{ marginTop: '20px' }}>
            <h4>🔍 Batch Processing Debug Information</h4>
            
            {debugData.sampleFirebaseData && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                  📊 Sample Firebase Data Structure
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
                    {JSON.stringify(debugData.sampleFirebaseData, null, 2)}
                  </pre>
                </div>
              </details>
            )}

            {debugData.sampleOpenaiResponse && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#0066cc' }}>
                  🤖 Sample OpenAI Response
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
                    {debugData.sampleOpenaiResponse}
                  </pre>
                </div>
              </details>
            )}

            {debugData.processingErrors && debugData.processingErrors.length > 0 && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#cc0000' }}>
                  ⚠️ Processing Errors ({debugData.processingErrors.length})
                </summary>
                <div style={{ 
                  background: '#ffefef', 
                  border: '1px solid #ffcccc', 
                  borderRadius: '4px', 
                  padding: '10px', 
                  marginTop: '10px',
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, fontSize: '12px', whiteSpace: 'pre-wrap' }}>
                    {debugData.processingErrors.join('\n')}
                  </pre>
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}