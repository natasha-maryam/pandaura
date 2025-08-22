import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, ArrowRight, Activity, Save, Clock, AlertCircle } from 'lucide-react';
import { Button, Card } from '../ui';
import { Project } from './types';
import { ProjectVersion } from './api';
import { useProject } from './hooks';
import { useVersionControl } from '../../hooks/useVersionControl';
import VersionHistory from './VersionHistory';
import VersionDiffModal from './VersionDiffModal';
import ErrorBoundary from '../ErrorBoundary';

import { getStatusColor, getVendorColor, getClientColor } from './colors';

interface ProjectOverviewProps {
  project: Project;
  onBack: () => void;
  onOpenWorkspace: (project: Project) => void;
}

// Wrap the component with error boundary
export default function ProjectOverviewWrapper(props: ProjectOverviewProps) {
  return (
    <ErrorBoundary>
      <ProjectOverviewContent {...props} />
    </ErrorBoundary>
  );
}

function ProjectOverviewContent({ project, onBack, onOpenWorkspace }: ProjectOverviewProps) {
  // ========================================
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC ABOVE HOOKS
  // ========================================
  
  // State hooks - always called
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [selectedVersionForDiff, setSelectedVersionForDiff] = useState<ProjectVersion | null>(null);
  
  // Custom hooks - always called (even if project is null)
  const {
    project: liveProject,
    isLoading: projectLoading,
    error: projectError,
    isDirty,
    lastSaved,
    autosave,
    save,
    markDirty
  } = useProject(project?.id || 0); // Use 0 as fallback to ensure hook is always called

const {
    versions: realVersions,
  isLoading: versionsLoading,
  error: versionsError,
  rollbackToVersion,
    deleteVersion,
  refreshVersions
  } = useVersionControl({ 
    projectId: project?.id || 0, // Use 0 as fallback to ensure hook is always called
    autoCreateVersions: true 
  });

  // Memoization hooks - always called
  const { safeVersions, recentActivity } = useMemo(() => {
    const versions = realVersions || [];
    return {
      safeVersions: versions,
      recentActivity: versions.slice(0, 5).map(version => ({
        action: version.is_auto ? 'Auto-saved project' : 'Manually saved version',
        user: `User ${version.user_id}`,
        timestamp: new Date(version.created_at).toLocaleString(),
        details: version.message || `Version ${version.version_number} created`
      }))
    };
  }, [realVersions]);

  // Callback hooks - always called
  const handleSaveProject = useCallback(async () => {
    if (!save) return; // Guard clause but hook is still called
    try {
      const projectState = {
        currentView: 'overview',
        savedAt: new Date().toISOString(),
        hasUnsavedChanges: false
      };
      
      await save(projectState);
      setHasUnsavedChanges(false);
      setShowSaveConfirm(false);
      
      console.log('Project saved successfully');
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }, [save]);

  const handleOpenWorkspace = useCallback(() => {
    if (hasUnsavedChanges || isDirty) {
      setShowSaveConfirm(true);
    } else {
      onOpenWorkspace(project);
    }
  }, [hasUnsavedChanges, isDirty, onOpenWorkspace, project]);

  const handleConfirmOpenWorkspace = useCallback(() => {
    setShowSaveConfirm(false);
    onOpenWorkspace(project);
  }, [onOpenWorkspace, project]);

  const handleViewDiff = useCallback((version: ProjectVersion) => {
    setSelectedVersionForDiff(version);
  }, []);

  const handleRollback = useCallback(async (version: ProjectVersion) => {
    if (!rollbackToVersion) return; // Guard clause but hook is still called
    try {
      console.log('Rolling back to version:', version.version_number);
      await rollbackToVersion(version.version_number);
      console.log('Rollback completed successfully');
    } catch (error) {
      console.error('Rollback failed:', error);
      // Show error in a toast or notification instead of alert
      const errorMessage = error instanceof Error ? error.message : 'Failed to rollback to version. Please try again.';
      // You can dispatch a toast notification here if you have a toast system
      console.error(errorMessage);
    }
  }, [rollbackToVersion]);

  const handleDelete = useCallback(async (version: ProjectVersion) => {
    if (!deleteVersion) return; // Guard clause but hook is still called
    try {
      console.log('Deleting version:', version.version_number);
      await deleteVersion(version.version_number);
      console.log('Version deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete version. Please try again.';
      console.error(errorMessage);
    }
  }, [deleteVersion]);

  // Effect hooks - always called
  useEffect(() => {
    if (!isDirty || !autosave) {
      return; // Early return in effect is OK
    }

    const autoSaveTimer = setTimeout(async () => {
      const projectState = {
        currentView: 'overview',
        lastActivity: new Date().toISOString(),
        hasUnsavedChanges: hasUnsavedChanges
      };

      await autosave(projectState);
      console.log('Auto-saved project state');
    }, 30000);

    return () => clearTimeout(autoSaveTimer);
  }, [isDirty, hasUnsavedChanges, autosave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges || isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isDirty]);

  useEffect(() => {
    if (!project?.id) return; // Early return in effect is OK
    
    console.log('Project Overview - Version Control Debug:', {
      projectId: project.id,
      versionsLoading,
      versionsError,
      versionsCount: safeVersions.length,
      versions: safeVersions,
      recentActivityCount: recentActivity.length
    });
  }, [project?.id, versionsLoading, versionsError, safeVersions, recentActivity]);

  // ========================================
  // NOW WE CAN SAFELY DO CONDITIONAL RENDERING
  // ========================================

  // Check if project exists
  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">No Project Selected</h3>
          <p className="text-red-600 mb-4">No project data was provided.</p>
          <Button onClick={onBack}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  // Check loading state
  if (projectLoading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-secondary">Loading project...</p>
        </div>
      </div>
    );
  }

  // Check error state
  if (projectError) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-700 mb-2">Failed to load project</h3>
          <p className="text-red-600 mb-4">{projectError}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Use live project data from API if available, otherwise fallback to passed project
  const displayProject = liveProject || project;

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
              <h1 className="text-3xl font-bold text-primary">Project: {displayProject.name}</h1>
              <div className="flex items-center gap-4 text-sm text-secondary">
                <span>Last modified {displayProject.lastModified}</span>
                {isDirty && (
                  <div className="flex items-center gap-1 text-orange-600">
                    <Clock className="w-4 h-4" />
                    <span>Auto-saving...</span>
                  </div>
                )}
                {lastSaved && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Save className="w-4 h-4" />
                    <span>Saved {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Action buttons with save functionality */}
          <div className="flex items-center gap-3">
            {(hasUnsavedChanges || isDirty) && (
              <Button
                onClick={handleSaveProject}
                variant="secondary"
                icon={Save}
                iconPosition="left"
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {(hasUnsavedChanges || isDirty) && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <p className="text-orange-700">
                You have unsaved changes. These will be auto-saved every 30 seconds, or you can save them manually.
              </p>
            </div>
          </div>
        )}

        {/* Save Confirmation Modal */}
        {showSaveConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Unsaved Changes</h3>
              <p className="text-secondary mb-6">
                You have unsaved changes. Would you like to save them before opening the workspace?
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="ghost"
                  onClick={handleConfirmOpenWorkspace}
                >
                  Don't Save
                </Button>
                <Button
                  onClick={handleSaveProject}
                  icon={Save}
                  iconPosition="left"
                >
                  Save & Continue
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Project Metadata */}
        <Card className="mb-6">
          <div className="grid grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-secondary">Name</label>
                <p className="text-primary">{displayProject.name}</p>
              </div>
              <div className='flex flex-col gap-2'>
                <label className="text-sm font-medium text-secondary">Client</label>
                <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getClientColor(displayProject.client)}`}>
                  {displayProject.client}
                </span>
              </div>
              <div className='flex flex-col'>
                <label className="text-sm font-medium text-secondary">Type</label>
                <p className="text-primary w-fit">{displayProject.type}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className='flex flex-col gap-2'>
                <label className="text-sm font-medium text-secondary">Target PLC Vendor</label>
                <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getVendorColor(displayProject.vendor)}`}>
                  {displayProject.vendor}
                </span>
              </div>
              <div className='flex flex-col gap-2'>
                <label className="text-sm font-medium text-secondary">Status</label>
                <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getStatusColor(displayProject.status)}`}>
                  {displayProject.status === 'active' ? 'Active' : displayProject.status}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-secondary">Description</label>
                <p className="text-primary">{displayProject.description}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Open Project Workspace */}
        <div className="mb-6">
          <Button
            onClick={handleOpenWorkspace}
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
            versions={safeVersions}
            isLoading={versionsLoading}
            error={versionsError}
            projectId={project.id}
            onViewDiff={handleViewDiff}
            onRollback={handleRollback}
            onDelete={handleDelete}
            onRefresh={refreshVersions}
          />

          {/* Recent Activity */}
          <Card>
            <div className="flex items-center gap-2 p-4 border-b border-light">
              <Activity className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-primary">Recent Activity</h3>
            </div>
            <div className="p-4">
              {versionsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-secondary">Loading recent activity...</p>
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-secondary">No recent activity</p>
                  <p className="text-xs text-muted mt-1">Activity will appear here as you work on the project</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
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
        version={selectedVersionForDiff}
        projectId={project.id}
        onClose={() => setSelectedVersionForDiff(null)}
        onRollback={(version) => {
          handleRollback(version);
          setSelectedVersionForDiff(null);
        }}
      />
    </>
  );
}