import React from 'react';
import './GenerateCheckbox.css';

interface GenerateCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const GenerateCheckbox: React.FC<GenerateCheckboxProps> = ({
  checked,
  onChange,
  label = "生成",
  disabled = false
}) => {
  return (
    <label className="generate-checkbox-container">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="generate-checkmark"></span>
      {label && <span className="generate-label">{label}</span>}
    </label>
  );
};
