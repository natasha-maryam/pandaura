import { useState, useEffect, useRef, useCallback } from "react";
import { Project, ApiProject, convertApiToDisplay } from "./types";
import { ProjectsAPI } from "./api";
import { useVersionControl } from "../../hooks/useVersionControl";

export interface UseProjectsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseProjectsReturn {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createProject: (data: any) => Promise<Project>;
  updateProject: (id: number, data: any) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  autosaveProject: (id: number, state: any) => Promise<void>;
  saveProject: (id: number, state: any) => Promise<void>;
}

/**
 * Custom hook for managing projects with API integration
 */
export function useProjects(
  options: UseProjectsOptions = {}
): UseProjectsReturn {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load projects from API
  const loadProjects = async () => {
    try {
      setError(null);
      const apiProjects = await ProjectsAPI.getProjects();
      const displayProjects = apiProjects.map(convertApiToDisplay);
      setProjects(displayProjects);
    } catch (err: any) {
      console.error("Failed to load projects:", err);
      setError(err.message || "Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh projects
  const refresh = async () => {
    setIsLoading(true);
    await loadProjects();
  };

  // Create new project
  const createProject = async (data: any): Promise<Project> => {
    const apiProject = await ProjectsAPI.createProject(data);
    const displayProject = convertApiToDisplay(apiProject);

    // Add to local state
    setProjects((prev) => [displayProject, ...prev]);

    return displayProject;
  };

  // Update existing project
  const updateProject = async (id: number, data: any): Promise<Project> => {
    const apiProject = await ProjectsAPI.updateProject(id, data);
    const displayProject = convertApiToDisplay(apiProject);

    // Update local state
    setProjects((prev) => prev.map((p) => (p.id === id ? displayProject : p)));

    return displayProject;
  };

  // Delete project
  const deleteProject = async (id: number): Promise<void> => {
    await ProjectsAPI.deleteProject(id);

    // Remove from local state
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  // Auto-save project state
  const autosaveProject = async (id: number, state: any): Promise<void> => {
    await ProjectsAPI.autosaveProject(id, state);
    // Note: Auto-save doesn't update local state as it's background operation
  };

  // Explicitly save project
  const saveProject = async (id: number, state: any): Promise<void> => {
    await ProjectsAPI.saveProject(id, state);

    // Update the project's updated_at timestamp in local state
    setProjects((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, lastModified: new Date().toISOString() } : p
      )
    );
  };

  // Initial load
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) {
      // No cleanup needed if auto-refresh is disabled
      return;
    }

    const interval = setInterval(loadProjects, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadProjects]);

  return {
    projects,
    isLoading,
    error,
    refresh,
    createProject,
    updateProject,
    deleteProject,
    autosaveProject,
    saveProject,
  };
}

/**
 * Hook for managing a single project with auto-save functionality
 */
export function useProject(projectId: number, autosaveInterval = 30000) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load single project
  const loadProject = async () => {
    try {
      console.log(`useProject: Loading project ${projectId}...`);
      setError(null);
      const apiProject = await ProjectsAPI.getProject(projectId);
      console.log(
        `useProject: Project ${projectId} loaded successfully:`,
        apiProject
      );
      const displayProject = convertApiToDisplay(apiProject);
      setProject(displayProject);
    } catch (err: any) {
      console.error("Failed to load project:", err);

      // Enhanced error handling for network issues
      let errorMessage = "Failed to load project";
      if (err.code === "ERR_NETWORK") {
        errorMessage =
          "Cannot connect to server. Please check if the backend is running on port 5000.";
      } else if (err.code === "ERR_INSUFFICIENT_RESOURCES") {
        errorMessage =
          "Server resource error. Please try refreshing the page or restart the backend.";
      } else if (err.response?.status === 404) {
        errorMessage = `Project with ID ${projectId} not found.`;
      } else if (err.response?.status === 401) {
        errorMessage = "Your session has expired. Please log in again.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Update project data
  const updateProject = async (data: any): Promise<void> => {
    if (!project) return;

    const apiProject = await ProjectsAPI.updateProject(project.id, data);
    const displayProject = convertApiToDisplay(apiProject);
    setProject(displayProject);
    setIsDirty(false);
    setLastSaved(new Date());
  };

  // Auto-save functionality
  const autosave = async (state: any): Promise<void> => {
    if (!project) return;

    try {
      await ProjectsAPI.autosaveProject(project.id, state);
      setLastSaved(new Date());
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  };

  // Explicit save
  const save = async (state: any): Promise<void> => {
    if (!project) return;

    await ProjectsAPI.saveProject(project.id, state);
    setIsDirty(false);
    setLastSaved(new Date());
  };

  // Mark project as dirty (has unsaved changes)
  const markDirty = () => setIsDirty(true);

  // Initial load
  useEffect(() => {
    if (projectId && projectId > 0) {
      loadProject();
    }
  }, [projectId]); // Remove loadProject from dependencies to prevent infinite loop

  return {
    project,
    isLoading,
    error,
    isDirty,
    lastSaved,
    updateProject,
    autosave,
    save,
    markDirty,
    reload: loadProject,
  };
}

/**
 * Enhanced autosave hook with comprehensive state management
 * Follows the autosave integration guide requirements
 * Now integrated with version control system
 */
export function useProjectAutosave(projectId: number, initialState: any = {}) {
  const [projectState, setProjectState] = useState(initialState);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lastSavedStateRef = useRef<any>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const significantChangeCountRef = useRef(0);

  // Version control integration
  const { triggerAutoVersion, createVersion } = useVersionControl({
    projectId: projectId ?? -1, // use a safe dummy id
    autoCreateVersions: true,
    versionInterval: 10 * 60 * 1000,
  });

  // Deep comparison function to detect changes
  const hasChanged = useCallback((current: any, last: any): boolean => {
    return JSON.stringify(current) !== JSON.stringify(last);
  }, []);

  // Autosave function with retry logic
  const performAutosave = useCallback(
    async (state: any, isManualSave = false): Promise<boolean> => {
      if (!projectId || !hasChanged(state, lastSavedStateRef.current)) {
        return true;
      }

      setIsSaving(true);
      setSaveError(null);

      try {
        if (isManualSave) {
          await ProjectsAPI.saveProject(projectId, { autosaveState: state });
        } else {
          await ProjectsAPI.autosaveProject(projectId, state);
        }

        lastSavedStateRef.current = structuredClone(state);
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        retryCountRef.current = 0;

        // Version control integration
        if (isManualSave) {
          // For manual saves, create a proper version with message
          try {
            await createVersion(
              `Manual save - ${new Date().toLocaleString()}`,
              state
            );
            console.log("Manual version created successfully");
          } catch (versionError) {
            console.error("Failed to create manual version:", versionError);
            // Don't fail the save if version creation fails
          }
        } else {
          // For auto-saves, increment change counter and trigger auto-version if needed
          significantChangeCountRef.current++;

          // Create auto-version every 10 significant changes or based on time interval
          if (significantChangeCountRef.current >= 10) {
            try {
              await triggerAutoVersion(
                state,
                `Auto-version after ${significantChangeCountRef.current} changes`
              );
              significantChangeCountRef.current = 0; // Reset counter
            } catch (versionError) {
              console.error("Failed to create auto-version:", versionError);
              // Don't fail the save if version creation fails
            }
          }
        }

        return true;
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.error || error.message || "Auto-save failed";
        console.error("Auto-save failed:", errorMessage);

        // Retry logic for network errors
        if (retryCountRef.current < maxRetries && !isManualSave) {
          retryCountRef.current++;
          console.log(
            `Retrying auto-save (attempt ${retryCountRef.current}/${maxRetries})`
          );

          // Exponential backoff: 2s, 4s, 8s
          const retryDelay = Math.pow(2, retryCountRef.current) * 1000;
          setTimeout(() => performAutosave(state, false), retryDelay);
        } else {
          setSaveError(errorMessage);

          // Cache to localStorage as fallback
          try {
            const fallbackKey = `pandaura_project_${projectId}_fallback`;
            localStorage.setItem(
              fallbackKey,
              JSON.stringify({
                state,
                timestamp: Date.now(),
                projectId,
              })
            );
            console.log("State cached to localStorage as fallback");
          } catch (localError) {
            console.error("Failed to cache state to localStorage:", localError);
          }
        }

        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [projectId, hasChanged]
  );

  // Debounced autosave
  const debouncedAutosave = useCallback(
    (state: any) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        performAutosave(state, false);
      }, 2000); // 2 second debounce
    },
    [performAutosave]
  );

  // Update project state and trigger autosave
  const updateProjectState = useCallback(
    (updates: Partial<any> | ((prev: any) => any)) => {
      setProjectState((prev: any) => {
        const newState =
          typeof updates === "function"
            ? updates(prev)
            : { ...prev, ...updates };

        // Check if state actually changed
        if (hasChanged(newState, lastSavedStateRef.current)) {
          setHasUnsavedChanges(true);
          debouncedAutosave(newState);
        }

        return newState;
      });
    },
    [hasChanged, debouncedAutosave]
  );

  // Manual save function
  const saveNow = useCallback(async (): Promise<boolean> => {
    return await performAutosave(projectState, true);
  }, [performAutosave, projectState]);

  // Manual save with custom version message
  const saveWithMessage = useCallback(
    async (message: string): Promise<boolean> => {
      if (!projectId) return false;

      try {
        // First perform the autosave
        const saveSuccess = await performAutosave(projectState, false);

        if (saveSuccess) {
          // Then create a version with the custom message
          await createVersion(message, projectState);
          console.log("Manual version created with message:", message);
        }

        return saveSuccess;
      } catch (error) {
        console.error("Failed to save with message:", error);
        return false;
      }
    },
    [projectId, performAutosave, projectState, createVersion]
  );

  // Load fallback state from localStorage
  const loadFallbackState = useCallback(() => {
    try {
      const fallbackKey = `pandaura_project_${projectId}_fallback`;
      const fallbackData = localStorage.getItem(fallbackKey);

      if (fallbackData) {
        const { state, timestamp } = JSON.parse(fallbackData);
        const fallbackAge = Date.now() - timestamp;

        // Only use fallback if it's less than 1 hour old
        if (fallbackAge < 60 * 60 * 1000) {
          console.log("Loaded fallback state from localStorage");
          setProjectState(state);
          setHasUnsavedChanges(true);

          // Try to save the fallback state
          performAutosave(state, false);
        }

        // Clean up old fallback
        localStorage.removeItem(fallbackKey);
      }
    } catch (error) {
      console.error("Failed to load fallback state:", error);
    }
  }, [projectId, performAutosave]);

  // Initialize with fallback check
  useEffect(() => {
    if (projectId) {
      loadFallbackState();
    }
  }, [projectId, loadFallbackState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    projectState,
    updateProjectState,
    isSaving,
    lastSaved,
    saveError,
    hasUnsavedChanges,
    saveNow,
    saveWithMessage,
    loadFallbackState,
  };
}
