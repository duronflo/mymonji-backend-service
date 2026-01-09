import { HealthCheck } from './HealthCheck';
import { UserRecommendations } from './UserRecommendations';
import { BatchProcessing } from './BatchProcessing';
import { UsersList } from './UsersList';

export function FirebaseTestPanel() {
  return (
    <div className="firebase-test-panel">
      <h2>Firebase Endpoints Testing</h2>
      <p>Test the new Firebase backend endpoints with AI-powered recommendations and batch processing.</p>
      
      <div className="test-sections">
        <div className="test-section">
          <HealthCheck />
        </div>
        
        <div className="test-section">
          <UsersList />
        </div>
        
        <div className="test-section">
          <UserRecommendations />
        </div>
        
        <div className="test-section">
          <BatchProcessing />
        </div>
      </div>
    </div>
  );
}