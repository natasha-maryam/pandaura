import React from 'react';

export interface TextareaProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  rows?: number;
  maxLength?: number;
  error?: string;
  helpText?: string;
  className?: string;
  showCharCount?: boolean;
}

export default function Textarea({
  id,
  name,
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  autoFocus = false,
  rows = 4,
  maxLength,
  error,
  helpText,
  className = '',
  showCharCount = false,
}: TextareaProps) {
  const textareaId = id || name;
  const hasError = !!error;
  
  const baseStyles = 'w-full px-4 py-3 bg-background border rounded-md text-primary placeholder-muted resize-none outline-none transition-all';
  const focusStyles = 'focus:ring-2 focus:ring-accent focus:border-accent';
  const errorStyles = hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-light';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const textareaClassName = `${baseStyles} ${focusStyles} ${errorStyles} ${disabledStyles} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-secondary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoFocus={autoFocus}
        rows={rows}
        maxLength={maxLength}
        className={textareaClassName}
      />
      
      <div className="flex justify-between items-center mt-2">
        <div>
          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}
          
          {helpText && !error && (
            <p className="text-sm text-muted">
              {helpText}
            </p>
          )}
        </div>
        
        {(showCharCount || maxLength) && (
          <span className="text-xs text-muted">
            {value.length}{maxLength && `/${maxLength}`}
          </span>
        )}
      </div>
    </div>
  );
}