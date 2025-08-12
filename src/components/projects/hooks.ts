import { useState, useEffect } from 'react';
import { Project, ApiProject, convertApiToDisplay } from './types';
import { ProjectsAPI } from './api';

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
export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
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
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to load projects');
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
    setProjects(prev => [displayProject, ...prev]);
    
    return displayProject;
  };

  // Update existing project
  const updateProject = async (id: number, data: any): Promise<Project> => {
    const apiProject = await ProjectsAPI.updateProject(id, data);
    const displayProject = convertApiToDisplay(apiProject);
    
    // Update local state
    setProjects(prev => prev.map(p => p.id === id ? displayProject : p));
    
    return displayProject;
  };

  // Delete project
  const deleteProject = async (id: number): Promise<void> => {
    await ProjectsAPI.deleteProject(id);
    
    // Remove from local state
    setProjects(prev => prev.filter(p => p.id !== id));
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
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, lastModified: new Date().toISOString() } : p
    ));
  };

  // Initial load
  useEffect(() => {
    loadProjects();
  }, []);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(loadProjects, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

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
      setError(null);
      const apiProject = await ProjectsAPI.getProject(projectId);
      const displayProject = convertApiToDisplay(apiProject);
      setProject(displayProject);
    } catch (err: any) {
      console.error('Failed to load project:', err);
      setError(err.message || 'Failed to load project');
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
      console.error('Auto-save failed:', err);
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
    loadProject();
  }, [projectId]);

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
