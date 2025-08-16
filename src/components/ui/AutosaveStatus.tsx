import React from 'react';
import { Save, AlertCircle, Clock, CheckCircle, Loader } from 'lucide-react';

interface AutosaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  hasUnsavedChanges: boolean;
  onManualSave?: () => void;
  className?: string;
}

export default function AutosaveStatus({
  isSaving,
  lastSaved,
  saveError,
  hasUnsavedChanges,
  onManualSave,
  className = ''
}: AutosaveStatusProps) {
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return 'Never saved';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffSeconds < 60) {
      return 'Saved just now';
    } else if (diffMinutes < 60) {
      return `Saved ${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `Saved ${diffHours}h ago`;
    } else {
      return `Saved on ${date.toLocaleDateString()}`;
    }
  };

  const getStatusIcon = () => {
    if (isSaving) {
      return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
    }
    
    if (saveError) {
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
    
    if (hasUnsavedChanges) {
      return <Clock className="w-4 h-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSaving) {
      return 'Saving...';
    }
    
    if (saveError) {
      return 'Save failed';
    }
    
    if (hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    
    return formatLastSaved(lastSaved);
  };

  const getStatusColor = () => {
    if (isSaving) return 'text-blue-600';
    if (saveError) return 'text-red-600';
    if (hasUnsavedChanges) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {getStatusIcon()}
      
      <span className={`text-sm ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      
      {saveError && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-red-500" title={saveError}>
            ({saveError})
          </span>
          {onManualSave && (
            <button
              onClick={onManualSave}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              title="Retry save"
            >
              Retry
            </button>
          )}
        </div>
      )}
      
      {hasUnsavedChanges && onManualSave && !isSaving && (
        <button
          onClick={onManualSave}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
          title="Save now"
        >
          <Save className="w-3 h-3" />
          Save
        </button>
      )}
    </div>
  );
}

/**
 * Compact version for use in headers or toolbars
 */
export function AutosaveStatusCompact({
  isSaving,
  lastSaved,
  saveError,
  hasUnsavedChanges,
  onManualSave,
  className = ''
}: AutosaveStatusProps) {
  const getStatusIcon = () => {
    if (isSaving) {
      return <Loader className="w-3 h-3 animate-spin text-blue-500" />;
    }
    
    if (saveError) {
      return <AlertCircle className="w-3 h-3 text-red-500" />;
    }
    
    if (hasUnsavedChanges) {
      return <Clock className="w-3 h-3 text-yellow-500" />;
    }
    
    return <CheckCircle className="w-3 h-3 text-green-500" />;
  };

  const getTooltipText = () => {
    if (isSaving) return 'Saving changes...';
    if (saveError) return `Save failed: ${saveError}`;
    if (hasUnsavedChanges) return 'You have unsaved changes';
    return lastSaved ? `Last saved: ${lastSaved.toLocaleString()}` : 'No changes to save';
  };

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      title={getTooltipText()}
    >
      {getStatusIcon()}
      
      {(hasUnsavedChanges || saveError) && onManualSave && (
        <button
          onClick={onManualSave}
          className="text-xs text-blue-600 hover:text-blue-800"
          disabled={isSaving}
        >
          Save
        </button>
      )}
    </div>
  );
}
