import React, { useState, useEffect } from 'react';
import { Plus, Search, FolderOpen, ChevronLeft, Grid, List, RefreshCw } from 'lucide-react';
import { Button, Input, Dropdown } from '../ui';
import { useAuth } from '../../contexts/AuthContext';
import { Project, FilterOption, ProjectViewMode, ApiProject, convertApiToDisplay } from './types';
import { ProjectsAPI } from './api';
import ProjectCard from './ProjectCard';
import ProjectTable from './ProjectTable';

interface ProjectsListProps {
  onBack: () => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onNewProject: () => void;
  refreshTrigger?: number; // Used to trigger refresh from parent
  onRefreshComplete?: () => void; // Callback when refresh completes
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function ProjectsList({ 
  onBack, 
  onOpenProject, 
  onDeleteProject, 
  onNewProject,
  refreshTrigger = 0,
  onRefreshComplete
}: ProjectsListProps) {
  const { isAuthenticated, token, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');

  // Load projects from API
  const loadProjects = async () => {
    // Don't load projects if user is not authenticated
    if (!isAuthenticated || !token) {
      console.log('ProjectsList: User not authenticated, skipping project load');
      setIsLoading(false);
      setError('Please log in to view projects');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('ProjectsList: Loading projects for authenticated user:', user?.email);
      console.log('ProjectsList loadProjects - Token debug:', {
        localStorage: localStorage.getItem('authToken') ? 'exists' : 'missing',
        sessionStorage: sessionStorage.getItem('authToken') ? 'exists' : 'missing',
        localStorageKeys: Object.keys(localStorage),
        authTokenPreview: localStorage.getItem('authToken')?.substring(0, 10) + '...' || 'none'
      });
      
      const apiProjects = await ProjectsAPI.getProjects();
      const displayProjects = apiProjects.map(convertApiToDisplay);
      
      console.log('ProjectsList: Loaded', displayProjects.length, 'projects');
      setProjects(displayProjects);
      
      // Call refresh complete callback if provided
      if (onRefreshComplete) {
        onRefreshComplete();
      }
    } catch (err: any) {
      console.error('Failed to load projects:', err);
      setError(err.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  // Load projects on component mount and when refresh is triggered or auth changes
  useEffect(() => {
    if (isAuthenticated && token) {
      loadProjects();
    }
  }, [refreshTrigger, isAuthenticated, token]);

  // Handle project deletion - just show confirmation dialog
  const handleDeleteProject = (project: Project) => {
    // Only call the callback to show the delete confirmation modal
    onDeleteProject(project);
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Projects Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            icon={ChevronLeft}
            size="sm"
          >
            Back
          </Button>
          <h1 className="text-3xl font-bold text-primary">Projects</h1>
          <span className="text-sm text-secondary px-2 py-1 bg-light rounded">
            {filteredProjects.length} projects
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={loadProjects}
            variant="ghost"
            icon={RefreshCw}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          {/* View Toggle */}
          <div className="flex border border-light rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-gray-50'}`}
              title="Card View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-white text-muted hover:bg-gray-50'}`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button
            onClick={onNewProject}
            icon={Plus}
            iconPosition="left"
          >
            New Project
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            iconPosition="left"
          />
        </div>
        <div className="w-48">
          <Dropdown
            options={filterOptions}
            value={filterStatus}
            onChange={setFilterStatus}
            placeholder="Filter projects"
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <Button
              onClick={loadProjects}
              variant="ghost"
              size="sm"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 text-secondary mx-auto mb-4 animate-spin" />
          <p className="text-secondary">Loading projects...</p>
        </div>
      )}

      {/* Projects List */}
      {!isLoading && !error && (
        <div className={viewMode === 'grid' ? "space-y-4" : ""}>
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-lg border border-light">
              <FolderOpen className="w-16 h-16 text-muted mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No projects found</h3>
              <p className="text-secondary mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter criteria."
                  : "Get started by creating your first project."
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button
                  onClick={onNewProject}
                  icon={Plus}
                  iconPosition="left"
                >
                  Create New Project
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpenOverview={onOpenProject}
                onDelete={handleDeleteProject}
              />
            ))
          ) : (
            <ProjectTable
              projects={filteredProjects}
              onOpenOverview={onOpenProject}
              onDelete={handleDeleteProject}
            />
          )}
        </div>
      )}
    </div>
  );
}
