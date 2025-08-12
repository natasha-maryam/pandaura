// Projects components barrel export
export { default as ProjectsList } from './ProjectsList';
export { default as ProjectOverview } from './ProjectOverview';
export { default as CreateProjectModal } from './CreateProjectModal';
export { default as DeleteProjectModal } from './DeleteProjectModal';
export { default as VersionHistory } from './VersionHistory';
export { default as VersionDiffModal } from './VersionDiffModal';
export { default as ProjectCard } from './ProjectCard';
export { default as ProjectTable } from './ProjectTable';
export { default as QuickToolsList } from './QuickToolsList';

// Export API and hooks
export { ProjectsAPI } from './api';
export { useProjects, useProject } from './hooks';
export { ProjectsProvider, useProjectsContext } from './context';

// Export color utilities
export { getStatusColor, getVendorColor, getClientColor } from './colors';

// Export types explicitly
export type { 
  Project, 
  ProjectVersion, 
  ProjectActivity, 
  NewProjectForm, 
  ViewMode, 
  ProjectViewMode,
  QuickTool,
  FilterOption,
  VersionChange,
  ApiProject,
  CreateProjectData,
  UpdateProjectData
} from './types';
