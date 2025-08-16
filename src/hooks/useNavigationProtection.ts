import { useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface UseNavigationProtectionOptions {
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<boolean>;
  message?: string;
}

/**
 * Hook to protect against navigation when there are unsaved changes
 * Implements beforeunload protection and React Router navigation blocking
 */
export function useNavigationProtection({
  hasUnsavedChanges,
  onSave,
  message = 'You have unsaved changes. Do you want to save before leaving?'
}: UseNavigationProtectionOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  // Handle browser beforeunload event (tab close, refresh, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // Try to send a beacon for last-minute save
        if (onSave && 'sendBeacon' in navigator) {
          // Note: sendBeacon is limited and may not work for complex saves
          // This is a best-effort attempt - we can't await the save here
          try {
            // Create a simple beacon payload
            const beaconData = JSON.stringify({ emergency_save: true, timestamp: Date.now() });
            navigator.sendBeacon('/api/v1/emergency-save', beaconData);
            console.log('Attempting beacon save before unload');
          } catch (error) {
            console.warn('Beacon save failed:', error);
          }
        }

        e.preventDefault();
        // Modern browsers use preventDefault() and return value
        e.returnValue = ''; // Empty string for modern browsers
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message, onSave]);

  // Handle React Router navigation
  const handleNavigation = useCallback(async (targetPath: string) => {
    if (!hasUnsavedChanges) {
      navigate(targetPath);
      return;
    }

    const shouldSave = window.confirm(message);
    
    if (shouldSave && onSave) {
      try {
        const saveSuccess = await onSave();
        if (saveSuccess) {
          navigate(targetPath);
        } else {
          console.error('Save failed, navigation cancelled');
        }
      } catch (error) {
        console.error('Save error during navigation:', error);
      }
    } else if (!shouldSave) {
      // User chose not to save, navigate anyway
      navigate(targetPath);
    }
  }, [hasUnsavedChanges, message, onSave, navigate]);

  return {
    handleNavigation,
    hasUnsavedChanges
  };
}

/**
 * Hook specifically for project workspace navigation protection
 */
export function useProjectNavigationProtection(
  hasUnsavedChanges: boolean,
  onSave?: () => Promise<boolean>
) {
  return useNavigationProtection({
    hasUnsavedChanges,
    onSave,
    message: 'You have unsaved project changes. Save before leaving?'
  });
}
