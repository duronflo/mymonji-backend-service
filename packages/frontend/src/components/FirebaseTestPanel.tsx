import { HealthCheck } from './HealthCheck';
import { UsersList } from './UsersList';

export function FirebaseTestPanel() {
  return (
    <div className="firebase-test-panel">
      <h2>Firebase Endpoints Testing</h2>
      <p>Test Firebase backend endpoints and user management.</p>
      
      <div className="test-sections">
        <div className="test-section">
          <HealthCheck />
        </div>
        
        <div className="test-section">
          <UsersList />
        </div>
      </div>
    </div>
  );
}