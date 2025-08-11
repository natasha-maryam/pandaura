import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, LucideIcon } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  required?: boolean;
}

export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  disabled = false,
  error,
  className = '',
  required = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const hasError = !!error;
  const buttonClassName = `w-full flex items-center justify-between px-4 py-3 bg-surface text-primary border rounded-md shadow-sm outline-none transition-all ${
    hasError ? 'border-red-500' : 'border-light'
  } ${
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent focus:ring-2 focus:ring-accent focus:border-accent cursor-pointer'
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-secondary mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={buttonClassName}
          disabled={disabled}
        >
          <div className="flex items-center">
            {selectedOption?.icon && (
              <selectedOption.icon className="w-4 h-4 mr-2 text-muted" />
            )}
            <span className={selectedOption ? 'text-primary' : 'text-muted'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-surface border border-light rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                className={`w-full flex items-center px-4 py-3 text-left transition-colors ${
                  option.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-accent-light cursor-pointer'
                } ${
                  option.value === value ? 'bg-accent-light text-primary' : 'text-primary'
                }`}
                disabled={option.disabled}
              >
                {option.icon && (
                  <option.icon className="w-4 h-4 mr-2 text-muted" />
                )}
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}