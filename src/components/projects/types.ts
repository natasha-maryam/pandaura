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
