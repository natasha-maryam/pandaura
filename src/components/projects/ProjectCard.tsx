import React from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Project } from './types';
import { getStatusColor, getVendorColor, getClientColor } from './colors';

interface ProjectCardProps {
  project: Project;
  onOpenOverview: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectCard({ project, onOpenOverview, onDelete }: ProjectCardProps) {
  return (
    <div className={`bg-surface rounded-lg border border-light p-6 hover:shadow-sm transition-all ${
      project.status === 'archived' ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-primary">{project.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status === 'active' ? 'Active' : project.status}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-secondary mb-3">
            <div>
              <span className="font-medium">Client:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getClientColor(project.client)}`}>
                {project.client}
              </span>
            </div>
            <div>
              <span className="font-medium">Vendor:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getVendorColor(project.vendor)}`}>
                {project.vendor}
              </span>
            </div>
            <div><span className="font-medium">Modified:</span> {project.lastModified}</div>
          </div>
          <p className="text-sm text-muted">{project.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            onClick={() => onOpenOverview(project)}
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
          >
            Open Overview
          </Button>
          <Button
            onClick={() => onDelete(project)}
            variant="ghost"
            size="sm"
            icon={Trash2}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Delete Project"
          />
        </div>
      </div>
    </div>
  );
}
