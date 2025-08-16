import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useTagSync, TagSyncResponse } from '../hooks/useTagSync';

export interface ProjectSyncContextType {
  // Current project ID (from URL or localStorage)
  currentProjectId: string | null;

  // Tag sync state
  isConnected: boolean;
  isConnecting: boolean;
  lastError: string | null;
  lastSyncTime: number | null;
  queuedSyncs: number;

  // Tag sync actions
  syncTags: (vendor: string, stCode: string) => void;

  // Real-time tag updates
  latestTags: any[];
  onTagsUpdated: (callback: (response: TagSyncResponse) => void) => void;
  offTagsUpdated: (callback: (response: TagSyncResponse) => void) => void;

  // Connection management
  connect: () => void;
  disconnect: () => void;

  // Statistics
  connectionAttempts: number;
}

const ProjectSyncContext = createContext<ProjectSyncContextType | undefined>(undefined);

export interface ProjectSyncProviderProps {
  children: ReactNode;
}

export function ProjectSyncProvider({ children }: ProjectSyncProviderProps) {
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [latestTags, setLatestTags] = useState<any[]>([]);
  const [tagUpdateCallbacks, setTagUpdateCallbacks] = useState<Set<(response: TagSyncResponse) => void>>(new Set());

  // Determine current project ID from URL or localStorage
  useEffect(() => {
    let projectId: string | null = null;

    // Priority 1: URL parameter
    if (urlProjectId) {
      projectId = urlProjectId;
      localStorage.setItem('currentProjectId', projectId);
    }
    // Priority 2: localStorage
    else {
      const savedProjectId = localStorage.getItem('currentProjectId');
      if (savedProjectId) {
        projectId = savedProjectId;
      }
    }

    setCurrentProjectId(projectId);
  }, [urlProjectId]);

  // Handle tag updates from WebSocket
  const handleTagsUpdated = (response: TagSyncResponse) => {
    if (response.tags) {
      setLatestTags(response.tags);
    }

    // Notify all registered callbacks
    tagUpdateCallbacks.forEach(callback => {
      try {
        callback(response);
      } catch (error) {
        console.error('Error in tag update callback:', error);
      }
    });
  };

  // Handle connection errors
  const handleError = (error: string) => {
    console.error('TagSync error:', error);
  };

  // Handle connection state changes
  const handleConnectionChange = (connected: boolean) => {
    console.log(`TagSync connection ${connected ? 'established' : 'lost'}`);
  };

  // Initialize tag sync hook
  const tagSync = useTagSync({
    autoConnect: false, // We'll connect manually when a project is available
    debounceMs: 500,
    onTagsUpdated: handleTagsUpdated,
    onError: handleError,
    onConnectionChange: handleConnectionChange
  });

  // Connect/disconnect based on project ID
  useEffect(() => {
    if (currentProjectId) {
      console.log(`🔄 Connecting to tag sync for project ID: ${currentProjectId}`);
      tagSync.connect();
      tagSync.subscribe(currentProjectId);
    } else {
      console.log('🔄 Disconnecting from tag sync (no project ID)');
      tagSync.unsubscribe();
      tagSync.disconnect();
      setLatestTags([]);
    }
  }, [currentProjectId]); // Removed tagSync from dependencies to prevent reconnection loop

  // Sync tags for the current project
  const syncTags = (vendor: string, stCode: string) => {
    if (!currentProjectId) {
      console.warn('Cannot sync tags: no project ID available');
      return;
    }

    tagSync.syncTags(currentProjectId, vendor, stCode);
  };

  // Register callback for tag updates
  const onTagsUpdated = (callback: (response: TagSyncResponse) => void) => {
    setTagUpdateCallbacks(prev => new Set(prev).add(callback));
  };

  // Unregister callback for tag updates
  const offTagsUpdated = (callback: (response: TagSyncResponse) => void) => {
    setTagUpdateCallbacks(prev => {
      const newSet = new Set(prev);
      newSet.delete(callback);
      return newSet;
    });
  };

  const contextValue: ProjectSyncContextType = {
    // Current project ID
    currentProjectId,

    // Tag sync state
    isConnected: tagSync.isConnected,
    isConnecting: tagSync.isConnecting,
    lastError: tagSync.lastError,
    lastSyncTime: tagSync.lastSyncTime,
    queuedSyncs: tagSync.queuedSyncs,

    // Tag sync actions
    syncTags,

    // Real-time tag updates
    latestTags,
    onTagsUpdated,
    offTagsUpdated,

    // Connection management
    connect: tagSync.connect,
    disconnect: tagSync.disconnect,

    // Statistics
    connectionAttempts: tagSync.connectionAttempts
  };

  return (
    <ProjectSyncContext.Provider value={contextValue}>
      {children}
    </ProjectSyncContext.Provider>
  );
}

export function useProjectSync(): ProjectSyncContextType {
  const context = useContext(ProjectSyncContext);
  if (context === undefined) {
    throw new Error('useProjectSync must be used within a ProjectSyncProvider');
  }
  return context;
}

// Hook for components that only need project ID
export function useCurrentProject() {
  const { currentProjectId } = useProjectSync();
  return { currentProjectId };
}

// Hook for components that only need tag sync functionality
export function useTagSyncOnly() {
  const {
    isConnected,
    isConnecting,
    lastError,
    lastSyncTime,
    queuedSyncs,
    syncTags,
    latestTags,
    onTagsUpdated,
    offTagsUpdated,
    connect,
    disconnect,
    connectionAttempts
  } = useProjectSync();

  return {
    isConnected,
    isConnecting,
    lastError,
    lastSyncTime,
    queuedSyncs,
    syncTags,
    latestTags,
    onTagsUpdated,
    offTagsUpdated,
    connect,
    disconnect,
    connectionAttempts
  };
}
