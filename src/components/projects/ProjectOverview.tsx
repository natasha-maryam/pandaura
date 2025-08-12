import React, { useState } from 'react';
import { ChevronLeft, ArrowRight, Activity } from 'lucide-react';
import { Button, Card } from '../ui';
import { Project, ProjectVersion } from './types';
import VersionHistory from './VersionHistory';
import VersionDiffModal from './VersionDiffModal';
import { getStatusColor, getVendorColor, getClientColor } from './colors';

interface ProjectOverviewProps {
  project: Project;
  onBack: () => void;
  onOpenWorkspace: (project: Project) => void;
}

export default function ProjectOverview({ project, onBack, onOpenWorkspace }: ProjectOverviewProps) {
  const [selectedVersion, setSelectedVersion] = useState<ProjectVersion | null>(null);

  const handleViewDiff = (version: ProjectVersion) => {
    setSelectedVersion(version);
  };

  const handleRollback = (version: ProjectVersion) => {
    // In real app, make API call here
    console.log('Rolling back to version:', version.id);
    // Show success toast, refresh project data, etc.
  };

  const handleExportVersion = (version: ProjectVersion) => {
    // In real app, make API call to export version
    console.log('Exporting version:', version.id);
    // Show success toast, download file, etc.
  };

  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Project Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={onBack}
              variant="ghost"
              icon={ChevronLeft}
              size="sm"
            >
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-primary">Project: {project.name}</h1>
              <p className="text-secondary">Last modified {project.lastModified}</p>
            </div>
          </div>
        </div>

        {/* Project Metadata */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary">Name</label>
                <p className="text-primary">{project.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary">Client</label>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getClientColor(project.client)}`}>
                  {project.client}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary">Type</label>
                <p className="text-primary">{project.type}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary">Target PLC Vendor</label>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getVendorColor(project.vendor)}`}>
                  {project.vendor}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary">Status</label>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                  {project.status === 'active' ? 'Active' : project.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary">Description</label>
                <p className="text-primary">{project.description}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Open Project Workspace */}
        <div className="mb-6">
          <Button
            onClick={() => onOpenWorkspace(project)}
            size="lg"
            icon={ArrowRight}
            iconPosition="right"
            className="w-full py-4"
          >
            Open Full Project Workspace
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Version History */}
          <VersionHistory
            versions={project.versions}
            onViewDiff={handleViewDiff}
            onRollback={handleRollback}
          />

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center gap-2 p-4 border-b border-light">
              <Activity className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-primary">Recent Activity</h3>
            </div>
            <div className="p-4">
              {project.recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-secondary">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-background rounded-md"
                    >
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm text-primary">{activity.action}</p>
                        <p className="text-xs text-muted">
                          {activity.user} • {activity.timestamp}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-secondary mt-1">{activity.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Version Diff Modal */}
      <VersionDiffModal
        version={selectedVersion}
        onClose={() => setSelectedVersion(null)}
        onRollback={handleRollback}
        onExport={handleExportVersion}
      />
    </>
  );
}
