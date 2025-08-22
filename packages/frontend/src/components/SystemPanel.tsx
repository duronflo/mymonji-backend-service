import React from 'react';
import type { SystemSpecification } from '../types';

interface SystemPanelProps {
  systemSpec: SystemSpecification;
  onSystemSpecChange: (spec: SystemSpecification) => void;
}

export const SystemPanel: React.FC<SystemPanelProps> = ({
  systemSpec,
  onSystemSpecChange
}) => {
  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...systemSpec.rules];
    newRules[index] = value;
    onSystemSpecChange({ ...systemSpec, rules: newRules });
  };

  const addRule = () => {
    onSystemSpecChange({
      ...systemSpec,
      rules: [...systemSpec.rules, '']
    });
  };

  const removeRule = (index: number) => {
    const newRules = systemSpec.rules.filter((_, i) => i !== index);
    onSystemSpecChange({ ...systemSpec, rules: newRules });
  };

  return (
    <div className="system-panel">
      <h3>System Configuration</h3>
      
      <div className="field-group">
        <label htmlFor="role">Role</label>
        <input
          id="role"
          type="text"
          value={systemSpec.role}
          onChange={(e) => onSystemSpecChange({ ...systemSpec, role: e.target.value })}
          placeholder="e.g., Helpful AI Assistant"
        />
      </div>

      <div className="field-group">
        <label htmlFor="background">Background</label>
        <textarea
          id="background"
          value={systemSpec.background}
          onChange={(e) => onSystemSpecChange({ ...systemSpec, background: e.target.value })}
          placeholder="Describe the AI's background and purpose..."
          rows={4}
        />
      </div>

      <div className="field-group">
        <label htmlFor="personality">Personality</label>
        <input
          id="personality"
          type="text"
          value={systemSpec.personality}
          onChange={(e) => onSystemSpecChange({ ...systemSpec, personality: e.target.value })}
          placeholder="e.g., Friendly, professional, and knowledgeable"
        />
      </div>

      <div className="field-group">
        <label>Rules & Guidelines</label>
        <div className="rules-list">
          {systemSpec.rules.map((rule, index) => (
            <div key={index} className="rule-item">
              <input
                type="text"
                value={rule}
                onChange={(e) => handleRuleChange(index, e.target.value)}
                placeholder="Enter a rule or guideline..."
              />
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="remove-rule"
                aria-label="Remove rule"
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" onClick={addRule} className="add-rule">
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
};