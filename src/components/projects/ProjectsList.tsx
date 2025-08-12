import React, { useState } from 'react';
import { Plus, Search, FolderOpen, ChevronLeft, Grid, List } from 'lucide-react';
import { Button, Input, Dropdown } from '../ui';
import { Project, FilterOption, ProjectViewMode } from './types';
import ProjectCard from './ProjectCard';
import ProjectTable from './ProjectTable';

interface ProjectsListProps {
  projects: Project[];
  onBack: () => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onNewProject: () => void;
}

const filterOptions: FilterOption[] = [
  { value: "all", label: "All Projects" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function ProjectsList({ 
  projects, 
  onBack, 
  onOpenProject, 
  onDeleteProject, 
  onNewProject 
}: ProjectsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<ProjectViewMode>('grid');

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
        </div>
        <div className="flex items-center gap-4">
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

      {/* Projects List */}
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
              onDelete={onDeleteProject}
            />
          ))
        ) : (
          <ProjectTable
            projects={filteredProjects}
            onOpenOverview={onOpenProject}
            onDelete={onDeleteProject}
          />
        )}
      </div>
    </div>
  );
}
