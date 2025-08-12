import React, { createContext, useContext, ReactNode } from 'react';
import { useProjects, UseProjectsReturn } from './hooks';

interface ProjectsContextType extends UseProjectsReturn {
  // Additional context-specific methods can be added here
}

const ProjectsContext = createContext<ProjectsContextType | undefined>(undefined);

export const ProjectsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const projectsData = useProjects({
    autoRefresh: false, // Enable if you want periodic refresh
    refreshInterval: 60000 // Refresh every minute if autoRefresh is enabled
  });

  return (
    <ProjectsContext.Provider value={projectsData}>
      {children}
    </ProjectsContext.Provider>
  );
};

export const useProjectsContext = (): ProjectsContextType => {
  const context = useContext(ProjectsContext);
  if (context === undefined) {
    throw new Error('useProjectsContext must be used within a ProjectsProvider');
  }
  return context;
};

export default ProjectsContext;
