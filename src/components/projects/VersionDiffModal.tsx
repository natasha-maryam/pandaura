import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { ProjectVersion } from './api';
import { FileText, RotateCcw, Download, Code } from 'lucide-react';

interface VersionDiffModalProps {
  version: ProjectVersion | null;
  onClose: () => void;
  onRollback: (version: ProjectVersion) => void;
  onExport?: (version: ProjectVersion) => void;
}

// Helper function to format version state for display
const formatVersionState = (state: any) => {
  if (!state) return 'No state data available';
  
  try {
    return JSON.stringify(state, null, 2);
  } catch {
    return 'Invalid state data';
  }
};

export default function VersionDiffModal({ version, onClose, onRollback, onExport }: VersionDiffModalProps) {
  const [showRollbackConfirm, setShowRollbackConfirm] = useState(false);
  const [showStateDetails, setShowStateDetails] = useState(false);

  if (!version) return null;

  const handleRollback = () => {
    onRollback(version);
    setShowRollbackConfirm(false);
    onClose();
  };

  const handleExport = () => {
    if (onExport) {
      onExport(version);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return new Date().toLocaleString();
    }
  };

  return (
    <>
      <Modal
        isOpen={!!version}
        onClose={onClose}
        title={`Version ${version.version_number} - Project State`}
        size="lg"
      >
        <div className="space-y-6">
          {/* Version Info Header */}
          <div className="bg-background rounded-lg p-4 border border-light">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-primary">Version {version.version_number}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  version.is_auto 
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  {version.is_auto ? 'Auto-save' : 'Manual'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {onExport && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={Download}
                    onClick={handleExport}
                  >
                    Export
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  icon={RotateCcw}
                  onClick={() => setShowRollbackConfirm(true)}
                  className="text-orange-600 hover:text-orange-700"
                >
                  Rollback
                </Button>
              </div>
            </div>
            <div className="text-sm text-secondary">
              <span className="font-medium">User {version.user_id}</span> • {formatTimestamp(version.created_at)}
            </div>
            {version.message && (
              <p className="text-sm text-primary mt-2">{version.message}</p>
            )}
          </div>

          {/* Version State Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-primary">Project State</h4>
              <Button
                size="sm"
                variant="outline"
                icon={Code}
                onClick={() => setShowStateDetails(!showStateDetails)}
              >
                {showStateDetails ? 'Hide Details' : 'Show Details'}
              </Button>
            </div>
            
            <div className="bg-background border border-light rounded-md p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-accent" />
                <span className="font-medium text-primary">Version Snapshot</span>
              </div>
              
              {showStateDetails ? (
                <div className="bg-surface rounded-md p-3 max-h-96 overflow-y-auto">
                  <pre className="text-xs text-primary whitespace-pre-wrap font-mono">
                    {formatVersionState(version.snapshot_info)}
                  </pre>
                </div>
              ) : (
                <div className="text-sm text-secondary">
                  <p>This version contains a snapshot of the project state at the time it was saved.</p>
                  <p className="mt-2">Click "Show Details" to view the raw state data, or use "Rollback" to restore this version.</p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This system stores complete project state snapshots rather than individual file changes. 
                Rolling back will restore the entire project to this version's state.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </Modal>

      {/* Rollback Confirmation */}
      <Modal
        isOpen={showRollbackConfirm}
        onClose={() => setShowRollbackConfirm(false)}
        title="Confirm Rollback"
        size="sm"
      >
        <div className="mb-6">
          <p className="text-secondary mb-4">
            Are you sure you want to rollback to <strong>Version {version.version_number}</strong>?
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <p className="text-sm text-orange-800">
              <strong>Warning:</strong> This action will create a new version with the rollback changes. 
              Your current work will be preserved as the latest version.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowRollbackConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleRollback}
            icon={RotateCcw}
          >
            Rollback to Version {version.version_number}
          </Button>
        </div>
      </Modal>
    </>
  );
}
