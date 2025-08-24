import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';
import { ProjectVersion } from './api';
import { ProjectsAPI } from './api';

interface DeleteVersionModalProps {
  version: ProjectVersion | null;
  projectId: number;
  onClose: () => void;
  onConfirm: (version: ProjectVersion) => void;
  onSuccess?: () => void; // Callback for successful deletion to trigger refresh
}

export default function DeleteVersionModal({ 
  version, 
  projectId,
  onClose, 
  onConfirm, 
  onSuccess 
}: DeleteVersionModalProps) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!version) return;

    try {
      setIsDeleting(true);
      
      // Call the API to delete the version
      await ProjectsAPI.deleteVersion(projectId, version.version_number);
      
      // Show success toast
      showToast({
        variant: 'success',
        title: 'Version Deleted',
        message: `Version ${version.version_number} has been deleted successfully.`,
        duration: 4000
      });
      
      // Call the original onConfirm for compatibility
      onConfirm(version);
      
      // Call the success callback to trigger refresh
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onClose();
      
    } catch (error: any) {
      console.error('Failed to delete version:', error);
      
      // Show error toast
      showToast({
        variant: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete version. Please try again.',
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatVersionInfo = (version: ProjectVersion) => {
    const date = new Date(version.created_at).toLocaleDateString();
    const time = new Date(version.created_at).toLocaleTimeString();
    return `${date} at ${time}`;
  };

  return (
    <Modal
      isOpen={!!version}
      onClose={onClose}
      title="Delete Version"
      size="sm"
    >
      <div className="mb-6">
        <p className="text-secondary mb-4">
          Are you sure you want to delete <strong>Version {version?.version_number}</strong>? 
        </p>
        
        {version && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Version:</span>
                <span className="text-gray-900">#{version.version_number}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Created:</span>
                <span className="text-gray-900">{formatVersionInfo(version)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">Type:</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  version.is_auto 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {version.is_auto ? 'Auto' : 'Manual'}
                </span>
              </div>
              {version.message && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Message:</span>
                  <p className="text-gray-900 mt-1">{version.message}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <p className="text-sm text-gray-600">
          This action cannot be undone and will permanently remove this version 
          from the project history.
        </p>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="ghost"
          onClick={onClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Delete Version'}
        </Button>
      </div>
    </Modal>
  );
}
