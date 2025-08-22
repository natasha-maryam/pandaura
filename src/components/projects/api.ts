import axios from 'axios';
import { config } from '../../config/environment';
import { authStorage } from '../../utils/authStorage';

// API Types matching the backend
export interface Project {
  id: number;
  user_id: string;
  project_name: string;
  client_name?: string;
  project_type?: string;
  description?: string;
  target_plc_vendor?: 'siemens' | 'rockwell' | 'beckhoff';
  autosave_state?: any; // JSON object
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  projectName: string;
  clientName?: string;
  projectType?: string;
  description?: string;
  targetPLCVendor?: 'siemens' | 'rockwell' | 'beckhoff';
}

export interface UpdateProjectData {
  projectName?: string;
  clientName?: string;
  projectType?: string;
  description?: string;
  targetPLCVendor?: 'siemens' | 'rockwell' | 'beckhoff';
}

// Version Control Types
export interface ProjectVersion {
  id: number;
  version_number: number;
  user_id: string;
  created_at: string;
  message?: string;
  is_auto?: boolean;
  snapshot_info: {
    has_autosave: boolean;
    project_name: string;
    timestamp: number;
  };
}

export interface CreateVersionData {
  state: any;
  message?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  project?: T;
  projects?: T[];
  isOwner?: boolean;
}

// Configure axios instance for projects API
const api = axios.create({
  baseURL: `${config.apiBaseUrl}/api/v1`,
  timeout: 10000,
});

// Helper function to get the current auth token
const getAuthToken = (): string | null => {
  // Use authStorage to get token from cookies
  const token = authStorage.getToken();
  
  if (!token) {
    console.warn('ProjectsAPI: No authentication token found. User may not be logged in.');
    return null;
  }
  
  console.log('ProjectsAPI: Found auth token:', token ? `${token.substring(0, 20)}...` : 'null');
  return token;
};

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('ProjectsAPI interceptor - Added Authorization header');
  } else {
    console.warn('ProjectsAPI interceptor - No token available for request to:', config.url);
  }
  
  return config;
}, (error) => {
  console.error('ProjectsAPI request interceptor error:', error);
  return Promise.reject(error);
});

// Handle API responses and errors
api.interceptors.response.use(
  (response) => {
    console.log('ProjectsAPI Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Projects API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
);

export class ProjectsAPI {
  /**
   * Create a new project
   */
  static async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const response = await api.post<ApiResponse<Project>>('/projects', projectData);
      
      if (!response.data.success || !response.data.project) {
        throw new Error(response.data.message || 'Failed to create project');
      }
      
      return response.data.project;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get all projects for the authenticated user
   */
  static async getProjects(): Promise<Project[]> {
    try {
      const response = await api.get<ApiResponse<Project>>('/projects');
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
      
      return response.data.projects || [];
    } catch (error: any) {
      console.error('ProjectsAPI.getProjects error:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        throw new Error('Your session has expired. Please log in again.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get a single project by ID
   */
  static async getProject(projectId: number): Promise<Project> {
    try {
      const response = await api.get<ApiResponse<Project>>(`/projects/${projectId}`);
      
      if (!response.data.success || !response.data.project) {
        throw new Error(response.data.message || 'Project not found');
      }
      
      return response.data.project;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Update project metadata
   */
  static async updateProject(projectId: number, updates: UpdateProjectData): Promise<Project> {
    try {
      const response = await api.patch<ApiResponse<Project>>(`/projects/${projectId}`, updates);
      
      if (!response.data.success || !response.data.project) {
        throw new Error(response.data.message || 'Failed to update project');
      }
      
      return response.data.project;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Auto-save project state (silent, no user prompts)
   */
  static async autosaveProject(projectId: number, state: any): Promise<void> {
    try {
      const response = await api.put<ApiResponse<never>>(`/projects/${projectId}/autosave`, {
        autosaveState: state
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Auto-save failed');
      }
    } catch (error: any) {
      // Auto-save failures should be logged but not throw errors to avoid disrupting user experience
      console.error('Auto-save failed:', error.response?.data?.error || error.message);
    }
  }

  /**
   * Explicitly save project (with user confirmation)
   */
  static async saveProject(projectId: number, state: any): Promise<void> {
    try {
      const response = await api.put<ApiResponse<never>>(`/projects/${projectId}/save`, {
        state: state
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Save failed');
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Delete a project
   */
  static async deleteProject(projectId: number): Promise<void> {
    try {
      const response = await api.delete<ApiResponse<never>>(`/projects/${projectId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete project');
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Check if the current user owns a project
   */
  static async checkProjectOwnership(projectId: number): Promise<boolean> {
    try {
      const response = await api.get<ApiResponse<never>>(`/projects/${projectId}/ownership`);

      if (!response.data.success) {
        return false;
      }

      return response.data.isOwner || false;
    } catch (error: any) {
      console.error('Ownership check failed:', error.response?.data?.error || error.message);
      return false;
    }
  }

  // ===== VERSION CONTROL METHODS =====

  /**
   * Get version history for a project
   */
  static async getVersionHistory(projectId: number): Promise<ProjectVersion[]> {
    try {
      const response = await api.get<{ success: boolean; versions: ProjectVersion[] }>(`/projects/${projectId}/versions`);
      return response.data.versions || [];
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Create a new version (manual save with message)
   */
  static async createVersion(projectId: number, data: CreateVersionData): Promise<number> {
    try {
      const response = await api.post<{ success: boolean; versionId: number }>(`/projects/${projectId}/create-version`, data);

      if (!response.data.success) {
        throw new Error('Failed to create version');
      }

      return response.data.versionId;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get specific version data
   */
  static async getVersion(projectId: number, versionNumber: number): Promise<any> {
    try {
      // Get version history and find the specific version
      const versions = await this.getVersionHistory(projectId);
      const version = versions.find(v => v.version_number === versionNumber);

      if (!version) {
        throw new Error(`Version ${versionNumber} not found`);
      }

      return version.snapshot_info;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Rollback project to a specific version (Enhanced)
   */
  static async rollbackToVersion(projectId: number, versionNumber: number): Promise<{ rolledBackTo: number; newVersion: number }> {
    try {
      const response = await api.post<{ 
        success: boolean; 
        rolledBackTo: number; 
        newVersion: number;
        message: string;
      }>(`/versions/projects/${projectId}/version/${versionNumber}/rollback`);

      if (!response.data.success) {
        throw new Error('Failed to rollback to version');
      }

      return {
        rolledBackTo: response.data.rolledBackTo,
        newVersion: response.data.newVersion
      };
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Create a new project version snapshot
   */
  static async createVersionSnapshot(projectId: number, message?: string, isAuto: boolean = false): Promise<number> {
    try {
      const response = await api.post<{ success: boolean; version: number }>(`/projects/${projectId}/version`, {
        message,
        isAuto
      });

      if (!response.data.success) {
        throw new Error('Failed to create version snapshot');
      }

      return response.data.version;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Get full version snapshot data
   */
  static async getVersionSnapshot(projectId: number, versionNumber: number): Promise<any> {
    try {
      const response = await api.get<{ success: boolean; data: any }>(`/versions/projects/${projectId}/version/${versionNumber}`);

      if (!response.data.success) {
        throw new Error('Failed to get version snapshot');
      }

      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }

  /**
   * Create auto-save version (used by autosave system)
   */
  static async createAutoSaveVersion(projectId: number, state: any): Promise<void> {
    try {
      const response = await api.post<{ success: boolean }>(`/projects/${projectId}/auto-save`, { state });

      if (!response.data.success) {
        throw new Error('Auto-save version creation failed');
      }
    } catch (error: any) {
      // Auto-save failures should be logged but not throw errors
      console.error('Auto-save version creation failed:', error.response?.data?.error || error.message);
    }
  }

  /**
   * Get latest auto-save state
   */
  static async getLatestAutoSave(projectId: number): Promise<any | null> {
    try {
      const response = await api.get<{ state: any; timestamp: number } | null>(`/projects/${projectId}/auto-save`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get latest auto-save:', error.response?.data?.error || error.message);
      return null;
    }
  }

  /**
   * Delete a specific version
   */
  static async deleteVersion(projectId: number, versionNumber: number): Promise<void> {
    try {
      const response = await api.delete<{ success: boolean }>(`/projects/${projectId}/version/${versionNumber}`);

      if (!response.data.success) {
        throw new Error('Failed to delete version');
      }
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw error;
    }
  }
}

export default ProjectsAPI;
