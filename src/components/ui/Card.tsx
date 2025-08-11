import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'elevated' | 'bordered';
}

const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles = {
  default: 'bg-surface border border-light',
  elevated: 'bg-surface border border-light shadow-card',
  bordered: 'bg-background border-2 border-light',
};

export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  className = '',
  padding = 'md',
  variant = 'default',
}: CardProps) {
  const baseStyles = 'rounded-lg';
  const cardClassName = `${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`;

  return (
    <div className={cardClassName}>
      {(title || subtitle || Icon) && (
        <div className="mb-6">
          {Icon && (
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Icon className="w-6 h-6 text-accent" />
            </div>
          )}
          
          {title && (
            <h3 className="text-lg font-semibold text-primary mb-2">
              {title}
            </h3>
          )}
          
          {subtitle && (
            <p className="text-sm text-muted">
              {subtitle}
            </p>
          )}
        </div>
      )}
      
      {children}
    </div>
  );
}