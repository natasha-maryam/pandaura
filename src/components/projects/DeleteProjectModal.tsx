import React, { useState } from 'react';
import { Modal, Button } from '../ui';
import { useToast } from '../ui/Toast';
import { Project } from './types';
import { ProjectsAPI } from './api';

interface DeleteProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => void;
  onSuccess?: () => void; // Callback for successful deletion to trigger refresh
}

export default function DeleteProjectModal({ 
  project, 
  onClose, 
  onConfirm, 
  onSuccess 
}: DeleteProjectModalProps) {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!project) return;

    try {
      setIsDeleting(true);
      
      // Call the API to delete the project
      await ProjectsAPI.deleteProject(project.id);
      
      // Show success toast
      showToast({
        variant: 'success',
        title: 'Project Deleted',
        message: `Project "${project.name}" has been deleted successfully.`,
        duration: 4000
      });
      
      // Call the original onConfirm for compatibility
      onConfirm(project);
      
      // Call the success callback to trigger refresh
      if (onSuccess) {
        onSuccess();
      }
      
      // Close the modal
      onClose();
      
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      
      // Show error toast
      showToast({
        variant: 'error',
        title: 'Delete Failed',
        message: error.message || 'Failed to delete project. Please try again.',
        duration: 5000
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={!!project}
      onClose={onClose}
      title="Delete Project"
      size="sm"
    >
      <div className="mb-6">
        <p className="text-secondary">
          Are you sure you want to delete <strong>{project?.name}</strong>? 
          This action cannot be undone and will permanently remove all project data, 
          including version history and activity logs.
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
          {isDeleting ? 'Deleting...' : 'Delete Project'}
        </Button>
      </div>
    </Modal>
  );
}
