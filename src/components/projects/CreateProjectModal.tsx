import React, { useState } from 'react';
import { Modal, Button, Input, Dropdown, Textarea } from '../ui';
import { NewProjectForm } from './types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: NewProjectForm) => void;
}

const projectTypes = [
  { value: "", label: "Select project type" },
  { value: "new-installation", label: "New Installation" },
  { value: "migration", label: "Migration/Upgrade" },
  { value: "integration", label: "System Integration" },
  { value: "maintenance", label: "Maintenance/Support" },
];

const plcVendors = [
  { value: "", label: "Select PLC vendor" },
  { value: "siemens", label: "Siemens" },
  { value: "rockwell", label: "Rockwell Automation" },
  { value: "beckhoff", label: "Beckhoff" },
  { value: "schneider", label: "Schneider Electric" },
  { value: "omron", label: "Omron" },
];

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [form, setForm] = useState<NewProjectForm>({
    name: '',
    client: '',
    type: '',
    vendor: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<NewProjectForm>>({});

  const handleSubmit = () => {
    const formErrors: Partial<NewProjectForm> = {};
    if (!form.name.trim()) {
      formErrors.name = 'Project name is required';
    }
    
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length === 0) {
      onSubmit(form);
      handleClose();
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      client: '',
      type: '',
      vendor: '',
      description: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Project"
      size="lg"
    >
      <div className="space-y-4">
        <Input
          label="Project Name"
          required
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter project name"
          error={errors.name}
        />
        <Input
          label="Client Name"
          value={form.client}
          onChange={(e) => setForm(prev => ({ ...prev, client: e.target.value }))}
          placeholder="Enter client name"
        />
        <Dropdown
          label="Project Type"
          options={projectTypes}
          value={form.type}
          onChange={(value) => setForm(prev => ({ ...prev, type: value }))}
        />
        <Dropdown
          label="Target PLC Vendor"
          options={plcVendors}
          value={form.vendor}
          onChange={(value) => setForm(prev => ({ ...prev, vendor: value }))}
        />
        <Textarea
          label="Brief Description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the project scope and objectives..."
          rows={3}
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
        >
          Create Project
        </Button>
      </div>
    </Modal>
  );
}
