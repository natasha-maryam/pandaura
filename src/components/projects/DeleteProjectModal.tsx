import React from 'react';
import { Modal, Button } from '../ui';
import { Project } from './types';

interface DeleteProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onConfirm: (project: Project) => void;
}

export default function DeleteProjectModal({ project, onClose, onConfirm }: DeleteProjectModalProps) {
  const handleConfirm = () => {
    if (project) {
      onConfirm(project);
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
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleConfirm}
        >
          Delete Project
        </Button>
      </div>
    </Modal>
  );
}
