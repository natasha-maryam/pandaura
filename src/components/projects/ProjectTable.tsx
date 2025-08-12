import React from 'react';
import { ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Project } from './types';
import { getStatusColor, getVendorColor, getClientColor } from './colors';

interface ProjectTableProps {
  projects: Project[];
  onOpenOverview: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export default function ProjectTable({ projects, onOpenOverview, onDelete }: ProjectTableProps) {
  return (
    <div className="bg-surface rounded-lg border border-light overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-light">
          <tr>
            <th className="text-left p-4 font-medium text-primary">Project Name</th>
            <th className="text-left p-4 font-medium text-primary">Client</th>
            <th className="text-left p-4 font-medium text-primary">Vendor</th>
            <th className="text-left p-4 font-medium text-primary">Status</th>
            <th className="text-left p-4 font-medium text-primary">Last Modified</th>
            <th className="text-left p-4 font-medium text-primary">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.id}
              className={`border-b border-light hover:bg-gray-50 transition-colors ${
                project.status === 'archived' ? 'opacity-60' : ''
              }`}
            >
              <td className="p-4">
                <div>
                  <h3 className="text-lg font-semibold text-primary">{project.name}</h3>
                  <p className="text-sm text-muted mt-1">{project.description}</p>
                </div>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getClientColor(project.client)}`}>
                  {project.client}
                </span>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getVendorColor(project.vendor)}`}>
                  {project.vendor}
                </span>
              </td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status === 'active' ? 'Active' : project.status}
                </span>
              </td>
              <td className="p-4 text-secondary">{project.lastModified}</td>
              <td className="p-4">
                <div className="flex items-center gap-2">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
