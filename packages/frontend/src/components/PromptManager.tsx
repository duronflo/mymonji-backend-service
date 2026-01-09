import React, { useState } from 'react';
import type { PromptTemplate, CreatePromptTemplateRequest, UpdatePromptTemplateRequest } from '../types';

interface PromptManagerProps {
  templates: PromptTemplate[];
  onCreateTemplate: (request: CreatePromptTemplateRequest) => Promise<void>;
  onUpdateTemplate: (id: string, request: UpdatePromptTemplateRequest) => Promise<void>;
  onDeleteTemplate: (id: string) => Promise<void>;
  onSelectTemplate: (template: PromptTemplate) => void;
  selectedTemplateId?: string;
}

export const PromptManager: React.FC<PromptManagerProps> = ({
  templates,
  onCreateTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onSelectTemplate,
  selectedTemplateId
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreatePromptTemplateRequest>({
    name: '',
    description: '',
    userPrompt: '',
    category: '',
    firebaseData: {
      enabled: false,
      includeEmotions: true,
      includeUserData: true
    },
    schedule: {
      enabled: false,
      runForAllUsers: true
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      userPrompt: '',
      category: '',
      firebaseData: {
        enabled: false,
        includeEmotions: true,
        includeUserData: true
      },
      schedule: {
        enabled: false,
        runForAllUsers: true
      }
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onCreateTemplate(formData);
      resetForm();
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    try {
      const updateData: UpdatePromptTemplateRequest = {
        name: formData.name || undefined,
        description: formData.description || undefined,
        userPrompt: formData.userPrompt || undefined,
        category: formData.category || undefined
      };
      await onUpdateTemplate(editingId, updateData);
      resetForm();
    } catch (error) {
      console.error('Error updating template:', error);
    }
  };

  const handleEdit = (template: PromptTemplate) => {
    setEditingId(template.id);
    setFormData({
      name: template.name,
      description: template.description,
      userPrompt: template.userPrompt,
      category: template.category || '',
      firebaseData: template.firebaseData || {
        enabled: false,
        includeEmotions: true,
        includeUserData: true
      },
      schedule: template.schedule || {
        enabled: false,
        runForAllUsers: true
      }
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDeleteTemplate(id);
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  return (
    <div className="prompt-manager">
      <div className="prompt-manager-header">
        <h3>Prompt Templates</h3>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="create-btn"
          >
            + New Template
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="prompt-form">
          <h4>{editingId ? 'Edit Template' : 'Create New Template'}</h4>
          
          <div className="form-group">
            <label htmlFor="template-name">Name *</label>
            <input
              id="template-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Weekly Summary"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="template-description">Description *</label>
            <textarea
              id="template-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this template does..."
              rows={2}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="template-prompt">User Prompt *</label>
            <textarea
              id="template-prompt"
              value={formData.userPrompt}
              onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
              placeholder="Enter the prompt text. Use {{variable}} for placeholders..."
              rows={4}
              required
            />
            <small>Tip: Use {'{{'} and {'}}'}  to create variable placeholders (e.g., {'{{'} userName {'}}'} )</small>
          </div>

          <div className="form-group">
            <label htmlFor="template-category">Category (Optional)</label>
            <input
              id="template-category"
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Statistics, General"
            />
          </div>

          {/* Firebase Data Configuration */}
          <div className="form-section">
            <h5>Firebase Data Configuration</h5>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.firebaseData?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    firebaseData: {
                      ...formData.firebaseData,
                      enabled: e.target.checked,
                      includeEmotions: true,
                      includeUserData: true
                    }
                  })}
                />
                <span>Fetch Firebase Data (expenses with emotions)</span>
              </label>
            </div>

            {formData.firebaseData?.enabled && (
              <>
                <div className="form-group">
                  <label htmlFor="start-date">Start Date (Optional - ISO format: YYYY-MM-DD)</label>
                  <input
                    id="start-date"
                    type="date"
                    value={formData.firebaseData?.dateRange?.startDate || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      firebaseData: {
                        ...formData.firebaseData,
                        enabled: true,
                        dateRange: {
                          ...formData.firebaseData?.dateRange,
                          type: 'custom',
                          startDate: e.target.value
                        }
                      }
                    })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="end-date">End Date (Optional - ISO format: YYYY-MM-DD)</label>
                  <input
                    id="end-date"
                    type="date"
                    value={formData.firebaseData?.dateRange?.endDate || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      firebaseData: {
                        ...formData.firebaseData,
                        enabled: true,
                        dateRange: {
                          ...formData.firebaseData?.dateRange,
                          type: 'custom',
                          endDate: e.target.value
                        }
                      }
                    })}
                  />
                  <small>Leave dates empty to fetch all available data</small>
                </div>
              </>
            )}
          </div>

          {/* Scheduling Configuration */}
          <div className="form-section">
            <h5>Scheduling Configuration</h5>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.schedule?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    schedule: {
                      ...formData.schedule,
                      enabled: e.target.checked,
                      runForAllUsers: true
                    }
                  })}
                />
                <span>Enable Scheduled Execution</span>
              </label>
            </div>

            {formData.schedule?.enabled && (
              <>
                <div className="form-group">
                  <label htmlFor="schedule-type">Schedule Frequency</label>
                  <select
                    id="schedule-type"
                    value={formData.schedule?.cronExpression || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: {
                        ...formData.schedule,
                        enabled: true,
                        cronExpression: e.target.value,
                        timezone: 'UTC'
                      }
                    })}
                  >
                    <option value="">Select frequency...</option>
                    <option value="0 0 * * *">Daily (midnight)</option>
                    <option value="0 0 * * 0">Weekly (Sunday midnight)</option>
                    <option value="0 0 * * 1">Weekly (Monday midnight)</option>
                    <option value="0 0 1 * *">Monthly (1st day midnight)</option>
                    <option value="0 0 1 */3 *">Quarterly (1st day every 3 months)</option>
                  </select>
                  <small>Select a common schedule or leave empty to disable</small>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.schedule?.runForAllUsers !== false}
                      onChange={(e) => setFormData({
                        ...formData,
                        schedule: {
                          ...formData.schedule,
                          enabled: true,
                          runForAllUsers: e.target.checked
                        }
                      })}
                    />
                    <span>Run for all users</span>
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingId ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="templates-list">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`template-item ${selectedTemplateId === template.id ? 'selected' : ''}`}
          >
            <div className="template-header">
              <div>
                <h4>{template.name}</h4>
                {template.category && <span className="category-badge">{template.category}</span>}
              </div>
              <div className="template-actions">
                <button
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                  className="use-btn"
                  title="Use this template"
                >
                  Use
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(template)}
                  className="edit-btn"
                  title="Edit template"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(template.id)}
                  className="delete-btn"
                  title="Delete template"
                >
                  🗑️
                </button>
              </div>
            </div>
            <p className="template-description">{template.description}</p>
            
            {/* Firebase Data Config */}
            {template.firebaseData?.enabled && (
              <div className="template-config">
                <strong>📊 Firebase Data:</strong>
                <span className="config-badge">
                  {template.firebaseData.dateRange?.type === 'custom' && template.firebaseData.dateRange.startDate && (
                    <>From {template.firebaseData.dateRange.startDate}</>
                  )}
                  {template.firebaseData.dateRange?.type === 'custom' && template.firebaseData.dateRange.endDate && (
                    <> to {template.firebaseData.dateRange.endDate}</>
                  )}
                  {template.firebaseData.dateRange?.type === 'days' && `Last ${template.firebaseData.dateRange.value} days`}
                  {template.firebaseData.dateRange?.type === 'weeks' && `Last ${template.firebaseData.dateRange.value} weeks`}
                  {template.firebaseData.dateRange?.type === 'months' && `Last ${template.firebaseData.dateRange.value} months`}
                  {!template.firebaseData.dateRange && 'All data'}
                  {template.firebaseData.includeEmotions && ' • With Emotions'}
                </span>
              </div>
            )}

            {/* Schedule Config */}
            {template.schedule?.enabled && (
              <div className="template-config">
                <strong>⏰ Scheduled:</strong>
                <span className="config-badge">
                  {template.schedule.cronExpression === '0 0 * * *' && 'Daily'}
                  {template.schedule.cronExpression === '0 0 * * 0' && 'Weekly (Sunday)'}
                  {template.schedule.cronExpression === '0 0 * * 1' && 'Weekly (Monday)'}
                  {template.schedule.cronExpression === '0 0 1 * *' && 'Monthly'}
                  {template.schedule.cronExpression === '0 0 1 */3 *' && 'Quarterly'}
                  {template.schedule.cronExpression && !['0 0 * * *', '0 0 * * 0', '0 0 * * 1', '0 0 1 * *', '0 0 1 */3 *'].includes(template.schedule.cronExpression) && template.schedule.cronExpression}
                  {template.schedule.runForAllUsers && ' • All Users'}
                </span>
              </div>
            )}

            {/* API Batch Execution Call */}
            <div className="template-config api-call">
              <strong>🔗 Batch Execution API:</strong>
              <code className="api-code">
                POST /api/prompts/templates/{template.id}/execute-all
              </code>
              <button
                type="button"
                className="copy-btn"
                onClick={() => {
                  navigator.clipboard.writeText(`POST ${window.location.origin}/api/prompts/templates/${template.id}/execute-all`);
                  alert('API endpoint copied to clipboard!');
                }}
                title="Copy API endpoint"
              >
                📋
              </button>
            </div>

            <div className="template-prompt">
              <strong>Prompt:</strong>
              <pre>{template.userPrompt}</pre>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .prompt-manager {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .prompt-manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .prompt-manager-header h3 {
          margin: 0;
          color: #333;
        }

        .create-btn {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .create-btn:hover {
          background: #45a049;
        }

        .prompt-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .prompt-form h4 {
          margin-top: 0;
          color: #333;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #555;
        }

        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-group small {
          display: block;
          margin-top: 5px;
          color: #666;
          font-size: 12px;
        }

        .form-section {
          margin-top: 25px;
          margin-bottom: 20px;
          padding: 15px;
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
        }

        .form-section h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
          font-size: 16px;
          border-bottom: 2px solid #2196F3;
          padding-bottom: 8px;
        }

        .checkbox-group {
          margin-bottom: 10px;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
          cursor: pointer;
        }

        .checkbox-group span {
          font-weight: normal;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .submit-btn,
        .cancel-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .submit-btn {
          background: #2196F3;
          color: white;
        }

        .submit-btn:hover {
          background: #0b7dda;
        }

        .cancel-btn {
          background: #9e9e9e;
          color: white;
        }

        .cancel-btn:hover {
          background: #757575;
        }

        .templates-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .template-item {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 15px;
          background: white;
          transition: border-color 0.2s;
        }

        .template-item.selected {
          border-color: #2196F3;
          background: #e3f2fd;
        }

        .template-item:hover {
          border-color: #bdbdbd;
        }

        .template-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 10px;
        }

        .template-header h4 {
          margin: 0 0 5px 0;
          color: #333;
        }

        .category-badge {
          display: inline-block;
          background: #e0e0e0;
          color: #555;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
        }

        .template-actions {
          display: flex;
          gap: 8px;
        }

        .use-btn,
        .edit-btn,
        .delete-btn {
          background: none;
          border: 1px solid #ddd;
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .use-btn {
          background: #4CAF50;
          color: white;
          border-color: #4CAF50;
        }

        .use-btn:hover {
          background: #45a049;
        }

        .edit-btn:hover,
        .delete-btn:hover {
          background: #f5f5f5;
        }

        .template-description {
          color: #666;
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .template-config {
          margin: 8px 0;
          font-size: 13px;
          color: #555;
        }

        .template-config strong {
          display: inline-block;
          margin-right: 8px;
        }

        .template-config.api-call {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #f0f8ff;
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #2196F3;
        }

        .api-code {
          flex: 1;
          background: #263238;
          color: #4CAF50;
          padding: 8px 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          overflow-x: auto;
          white-space: nowrap;
        }

        .copy-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .copy-btn:hover {
          background: #0b7dda;
        }

        .config-badge {
          display: inline-block;
          background: #e8f5e9;
          color: #2e7d32;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          margin-left: 4px;
        }

        .template-prompt {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-size: 13px;
        }

        .template-prompt strong {
          display: block;
          margin-bottom: 5px;
          color: #555;
        }

        .template-prompt pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          color: #333;
        }
      `}</style>
    </div>
  );
};
