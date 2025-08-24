import { useState, useEffect, useCallback } from 'react';
import { ProjectsAPI, ProjectVersion, CreateVersionData } from '../components/projects/api';
import { useToast } from '../components/ui/Toast';

interface UseVersionControlOptions {
  projectId: number;
  autoCreateVersions?: boolean; // Whether to create versions automatically on significant changes
  versionInterval?: number; // Minimum time between auto-versions (in ms)
}

interface UseVersionControlReturn {
  versions: ProjectVersion[];
  isLoading: boolean;
  error: string | null;
  
  // Version operations
  createVersion: (message?: string, state?: any) => Promise<number>;
  rollbackToVersion: (versionNumber: number) => Promise<void>;
  deleteVersion: (versionNumber: number) => Promise<void>;
  getVersionData: (versionNumber: number) => Promise<any>;
  refreshVersions: () => Promise<void>;
  
  // Auto-versioning
  triggerAutoVersion: (state: any, reason?: string) => Promise<void>;
  
  // Status
  lastVersionTime: Date | null;
  canCreateVersion: boolean;
}

/**
 * Hook for managing project version control
 * Integrates with autosave system and provides version management capabilities
 */
export function useVersionControl({
  projectId,
  autoCreateVersions = true,
  versionInterval = 5 * 60 * 1000 // 5 minutes default
}: UseVersionControlOptions): UseVersionControlReturn {
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastVersionTime, setLastVersionTime] = useState<Date | null>(null);
  const { showToast } = useToast();

  // Load version history
  const refreshVersions = useCallback(async () => {
    if (!projectId) {
      console.log('useVersionControl: No project ID provided');
      return;
    }

    console.log('useVersionControl: Loading version history for project', projectId);
    setIsLoading(true);
    setError(null);

    try {
      const versionHistory = await ProjectsAPI.getVersionHistory(projectId);
      console.log('useVersionControl: Loaded version history:', versionHistory);
      setVersions(versionHistory);

      // Update last version time
      if (versionHistory.length > 0) {
        const latestVersion = versionHistory[0];
        setLastVersionTime(new Date(latestVersion.snapshot_info.timestamp * 1000));
        console.log('useVersionControl: Latest version time set:', latestVersion.snapshot_info.timestamp);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load version history';
      setError(errorMessage);
      console.error('useVersionControl: Failed to load version history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Create a new version
  const createVersion = useCallback(async (message?: string, state?: any): Promise<number> => {
    if (!projectId) throw new Error('No project ID provided');
    
    try {
      setError(null);
      
      console.log('useVersionControl: Creating version with state:', state);
      console.log('useVersionControl: Creating version with message:', message);
      
      const versionData: CreateVersionData = {
        state: state || {}, // If no state provided, use empty object
        message: message || `Manual save - ${new Date().toLocaleString()}`
      };
      
      console.log('useVersionControl: Sending version data:', versionData);
      
      const versionNumber = await ProjectsAPI.createVersion(projectId, versionData);
      
      console.log('useVersionControl: Version created successfully:', versionNumber);

      // Refresh version history
      await refreshVersions();
      
      return versionNumber;
    } catch (err: any) {
      console.error('useVersionControl: Error creating version:', err);
      setError(err.message || 'Failed to create version');
      showToast({
        variant: 'error',
        title: 'Save Failed',
        message: err.message || 'Failed to create version',
        duration: 5000
      });
      throw err;
    }
  }, [projectId, refreshVersions, showToast]);

  // Rollback to a specific version (Enhanced)
  const rollbackToVersion = useCallback(async (versionNumber: number): Promise<void> => {
    if (!projectId) throw new Error('No project ID provided');
    
    try {
      setError(null);
      
      const result = await ProjectsAPI.rollbackToVersion(projectId, versionNumber);
      
      console.log(`Enhanced rollback completed: rolled back to version ${result.rolledBackTo}, created new version ${result.newVersion}`);
      
      // Show success toast
      showToast({
        variant: 'success',
        title: 'Rollback Successful',
        message: `Rolled back to version ${result.rolledBackTo}. New version ${result.newVersion} created.`,
        duration: 4000
      });
      
      // Refresh version history to show the new rollback version
      await refreshVersions();
      
      // Emit enhanced event with more details for components to refresh their state
      window.dispatchEvent(new CustomEvent('pandaura:project-rollback', {
        detail: { 
          projectId, 
          targetVersion: versionNumber,
          rolledBackTo: result.rolledBackTo,
          newVersion: result.newVersion,
          timestamp: Date.now()
        }
      }));

      // Also emit a general project state change event
      window.dispatchEvent(new CustomEvent('pandaura:project-state-changed', {
        detail: { 
          projectId, 
          action: 'rollback',
          targetVersion: result.rolledBackTo,
          newVersion: result.newVersion
        }
      }));
      
    } catch (err: any) {
      setError(err.message || 'Failed to rollback to version');
      showToast({
        variant: 'error',
        title: 'Rollback Failed',
        message: err.message || 'Failed to rollback to version',
        duration: 5000
      });
      throw err;
    }
  }, [projectId, refreshVersions, showToast]);

  // Get version data
  const getVersionData = useCallback(async (versionNumber: number): Promise<any> => {
    if (!projectId) throw new Error('No project ID provided');
    
    try {
      return await ProjectsAPI.getVersion(projectId, versionNumber);
    } catch (err: any) {
      setError(err.message || 'Failed to get version data');
      throw err;
    }
  }, [projectId]);

  // Auto-version creation (for significant changes)
  const triggerAutoVersion = useCallback(async (state: any, reason?: string): Promise<void> => {
    if (!projectId || !autoCreateVersions) return;
    
    // Check if enough time has passed since last version
    if (lastVersionTime) {
      const timeSinceLastVersion = Date.now() - lastVersionTime.getTime();
      if (timeSinceLastVersion < versionInterval) {
        console.log('Skipping auto-version: too soon since last version');
        return;
      }
    }
    
    try {
      // Create auto-save version (separate from manual versions)
      await ProjectsAPI.createAutoSaveVersion(projectId, state);
      console.log('Auto-version created:', reason || 'Automatic save');
      
      setLastVersionTime(new Date());
    } catch (err: any) {
      console.error('Failed to create auto-version:', err);
      // Don't throw error for auto-versions to avoid disrupting user experience
    }
  }, [projectId, autoCreateVersions, versionInterval, lastVersionTime]);

  // Check if we can create a new version (respecting interval)
  const canCreateVersion = useCallback((): boolean => {
    if (!lastVersionTime) return true;
    
    const timeSinceLastVersion = Date.now() - lastVersionTime.getTime();
    return timeSinceLastVersion >= versionInterval;
  }, [lastVersionTime, versionInterval]);

  // Load versions on mount and project change
  useEffect(() => {
    console.log('useVersionControl: useEffect triggered with projectId:', projectId);
    if (projectId && projectId > 0) {
      console.log('useVersionControl: Calling refreshVersions for project:', projectId);
      refreshVersions();
    } else {
      console.log('useVersionControl: No valid projectId, skipping version load');
      setVersions([]);
    }
  }, [projectId, refreshVersions]);

  // Delete a version
  const deleteVersion = useCallback(async (versionNumber: number): Promise<void> => {
    if (!projectId) throw new Error('No project ID provided');
    
    try {
      setError(null);
      
      await ProjectsAPI.deleteVersion(projectId, versionNumber);
      
      // Refresh version history after deletion
      await refreshVersions();
      
      // Emit event for version deletion
      window.dispatchEvent(new CustomEvent('pandaura:version-deleted', {
        detail: { 
          projectId, 
          versionNumber,
          timestamp: Date.now()
        }
      }));
      
    } catch (err: any) {
      setError(err.message || 'Failed to delete version');
      throw err;
    }
  }, [projectId, refreshVersions]);

  return {
    versions,
    isLoading,
    error,
    createVersion,
    rollbackToVersion,
    deleteVersion,
    getVersionData,
    refreshVersions,
    triggerAutoVersion,
    lastVersionTime,
    canCreateVersion: canCreateVersion()
  };
}

/**
 * Simplified hook for components that only need version history
 */
export function useVersionHistory(projectId: number) {
  const { versions, isLoading, error, refreshVersions } = useVersionControl({
    projectId,
    autoCreateVersions: false
  });

  return {
    versions,
    isLoading,
    error,
    refreshVersions
  };
}
