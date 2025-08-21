// Backend API Types
export interface ApiProject {
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

// API Request/Response Types
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

// Frontend Display Types (for existing components compatibility)
export interface Project {
  id: number;
  name: string;
  client: string;
  vendor: string;
  type: string;
  lastModified: string;
  description: string;
  status: 'active' | 'archived';
  versions: ProjectVersion[];
  recentActivity: ProjectActivity[];
}

// Type converters between API and Display types
export const convertApiToDisplay = (apiProject: any): Project => {
  return {
    id: apiProject.id,
    name: apiProject.projectName || apiProject.project_name || '',
    client: apiProject.clientName || apiProject.client_name || 'N/A',
    vendor: apiProject.targetPLCVendor || apiProject.target_plc_vendor || 'N/A',
    type: apiProject.projectType || apiProject.project_type || '',
    lastModified: apiProject.updatedAt || apiProject.updated_at || '',
    description: apiProject.description || '',
    status: 'active', // Default status
    versions: [], // Will be populated separately if needed
    recentActivity: [] // Will be populated separately if needed
  };
};

export const convertDisplayToApi = (project: Partial<Project>): any => {
  return {
    projectName: project.name,
    clientName: project.client,
    projectType: project.type,
    targetPLCVendor: project.vendor as 'siemens' | 'rockwell' | 'beckhoff' | undefined,
    description: project.description
  };
};

export interface ProjectVersion {
  id: number;
  type: 'Autosave' | 'Manual Save';
  user: string;
  timestamp: string;
  message?: string;
  changes?: VersionChange[];
}

export interface VersionChange {
  file: string;
  type: 'added' | 'modified' | 'deleted';
  linesAdded: number;
  linesRemoved: number;
}

export interface ProjectActivity {
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

export interface NewProjectForm {
  name: string;
  client: string;
  type: string;
  vendor: string;
  description: string;
}

export type ViewMode = 'home' | 'projects' | 'project-overview' | 'quick-tools';
export type ProjectViewMode = 'grid' | 'list';

export interface QuickTool {
  name: string;
  icon: any; // LucideIcon
  path: string;
  description: string;
  comingSoon: boolean;
}

export interface FilterOption {
  value: string;
  label: string;
}
