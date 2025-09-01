import { useState } from 'react';
import { ApiService } from '../services/api.service';
import type { BatchJobRequest, BatchJobResponse, BatchJobStatusResponse } from '../types/index';

export function BatchProcessing() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [jobId, setJobId] = useState('');
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [jobResult, setJobResult] = useState<string>('');
  const [statusResult, setStatusResult] = useState<string>('');

  const startBatchJob = async () => {
    setIsStartingJob(true);
    setJobResult('');

    try {
      const request: BatchJobRequest = {};
      
      if (startDate) request.startDate = startDate;
      if (endDate) request.endDate = endDate;

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

        setStatusResult(resultText);
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
      </div>
    </div>
  );
}