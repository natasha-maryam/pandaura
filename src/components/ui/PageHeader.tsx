import React from 'react';
import { ArrowLeft, LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  backTo?: string;
  actions?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}

export default function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  backTo,
  actions,
  icon: Icon,
  className = '',
}: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={`bg-surface border-b border-light px-6 py-3 ${className}`}>
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              icon={ArrowLeft}
              title="Go back"
            >
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-accent" />
              </div>
            )}
            
            <div>
              <h1 className="text-xl font-semibold text-primary">{title}</h1>
              {subtitle && (
                <p className="text-sm text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-3">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}