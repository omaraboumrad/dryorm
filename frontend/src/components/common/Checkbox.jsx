import React from 'react';
import { CheckIcon } from '../icons';

export function Checkbox({
  checked,
  onChange,
  label,
  id,
  className = '',
  disabled = false,
}) {
  const inputId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={inputId}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 peer-checked:bg-django-secondary peer-checked:border-django-secondary peer-focus:ring-2 peer-focus:ring-django-secondary peer-focus:ring-offset-2 transition-colors">
          {checked && (
            <CheckIcon size={16} className="text-white absolute top-0.5 left-0.5" />
          )}
        </div>
      </div>
      {label && (
        <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
    </label>
  );
}

export default Checkbox;
