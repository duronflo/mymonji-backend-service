import { useState } from 'react';

export function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Using the existing Firebase service endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/users/all`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setUsers(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="users-list-panel">
      <h3>All Users</h3>
      <p>Fetch all users from Firebase with their IDs and usernames.</p>
      
      <button 
        onClick={fetchUsers}
        disabled={loading}
        className="fetch-btn"
      >
        {loading ? 'Loading...' : 'Fetch All Users'}
      </button>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {users.length > 0 && (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username/Email</th>
                <th>Display Name</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.uid || index}>
                  <td className="user-id">{user.uid || 'N/A'}</td>
                  <td>{user.email || user.username || 'N/A'}</td>
                  <td>{user.displayName || user.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="users-count">Total users: {users.length}</p>
        </div>
      )}

      <style>{`
        .users-list-panel {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .users-list-panel h3 {
          margin-top: 0;
          color: #333;
        }

        .users-list-panel p {
          color: #666;
          margin-bottom: 15px;
        }

        .fetch-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 20px;
        }

        .fetch-btn:hover:not(:disabled) {
          background: #0b7dda;
        }

        .fetch-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 15px;
          border-left: 4px solid #c62828;
        }

        .users-table-container {
          overflow-x: auto;
          margin-top: 20px;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .users-table thead {
          background: #f5f5f5;
        }

        .users-table th {
          text-align: left;
          padding: 12px;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .users-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
          color: #555;
        }

        .users-table tbody tr:hover {
          background: #f9f9f9;
        }

        .user-id {
          font-family: 'Courier New', monospace;
          font-size: 13px;
          color: #2196F3;
        }

        .users-count {
          margin-top: 15px;
          font-weight: 500;
          color: #2196F3;
        }
      `}</style>
    </div>
  );
}
