import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface InputProps {
  id?: string;
  name?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  onIconClick?: () => void;
  error?: string;
  helpText?: string;
  className?: string;
}

export default function Input({
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  label,
  required = false,
  disabled = false,
  autoFocus = false,
  autoComplete,
  maxLength,
  pattern,
  icon: Icon,
  iconPosition = 'right',
  onIconClick,
  error,
  helpText,
  className = '',
}: InputProps) {
  const inputId = id || name;
  const hasError = !!error;
  
  const baseInputStyles = 'w-full px-4 py-3 bg-surface text-primary border rounded-md shadow-sm outline-none transition-all';
  const focusStyles = 'focus:ring-2 focus:ring-accent focus:border-accent';
  const errorStyles = hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-light';
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const inputClassName = `${baseInputStyles} ${focusStyles} ${errorStyles} ${disabledStyles} ${Icon ? iconPosition === 'left' ? 'pl-12' : 'pr-12' : ''} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-secondary mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {Icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            <Icon className="w-5 h-5 text-muted" />
          </div>
        )}
        
        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          maxLength={maxLength}
          pattern={pattern}
          className={inputClassName}
        />
        
        {Icon && iconPosition === 'right' && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary transition-colors"
            disabled={disabled}
          >
            <Icon className="w-5 h-5" />
          </button>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-muted">
          {helpText}
        </p>
      )}
    </div>
  );
}