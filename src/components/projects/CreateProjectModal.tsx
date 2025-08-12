import React, { useState } from 'react';
import { Modal, Button, Input, Dropdown, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { NewProjectForm } from './types';
import { ProjectsAPI, CreateProjectData } from './api';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (project: NewProjectForm) => void;
  onSuccess?: () => void; // Callback for successful project creation
}

const projectTypes = [
  { value: "", label: "Select project type" },
  { value: "new-installation", label: "New Installation" },
  { value: "migration", label: "Migration/Upgrade" },
  { value: "integration", label: "System Integration" },
  { value: "maintenance", label: "Maintenance/Support" },
  { value: "industrial-automation", label: "Industrial Automation" },
];

const plcVendors = [
  { value: "", label: "Select PLC vendor" },
  { value: "siemens", label: "Siemens" },
  { value: "rockwell", label: "Rockwell Automation" },
  { value: "beckhoff", label: "Beckhoff" },
];

export default function CreateProjectModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onSuccess 
}: CreateProjectModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<NewProjectForm>({
    name: '',
    client: '',
    type: '',
    vendor: '',
    description: '',
  });
  const [errors, setErrors] = useState<Partial<NewProjectForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string>('');

  const handleSubmit = async () => {
    const formErrors: Partial<NewProjectForm> = {};
    
    if (!form.name.trim()) {
      formErrors.name = 'Project name is required';
    }
    
    // Validate PLC vendor if provided
    if (form.vendor && !['siemens', 'rockwell', 'beckhoff'].includes(form.vendor)) {
      formErrors.vendor = 'Please select a valid PLC vendor';
    }
    
    setErrors(formErrors);
    setApiError('');
    
    if (Object.keys(formErrors).length === 0) {
      setIsSubmitting(true);
      
      try {
        // Create project data for API
        const projectData: CreateProjectData = {
          projectName: form.name.trim(),
          clientName: form.client.trim() || undefined,
          projectType: form.type || undefined,
          targetPLCVendor: form.vendor as 'siemens' | 'rockwell' | 'beckhoff' | undefined,
          description: form.description.trim() || undefined,
        };

        // Call the API to create the project
        const createdProject = await ProjectsAPI.createProject(projectData);
        
        console.log('Project created successfully:', createdProject);
        
        // Show success toast
        showToast({
          variant: 'success',
          title: 'Success!',
          message: `Project "${form.name.trim()}" has been created successfully.`,
          duration: 4000
        });
        
        // Call the original onSubmit for compatibility
        onSubmit(form);
        
        // Call the success callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        handleClose();
        
      } catch (error: any) {
        console.error('Failed to create project:', error);
        setApiError(error.message || 'Failed to create project. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
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
        {apiError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {apiError}
          </div>
        )}
        
        <Input
          label="Project Name"
          required
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter project name"
          error={errors.name}
          disabled={isSubmitting}
        />
        <Input
          label="Client Name"
          value={form.client}
          onChange={(e) => setForm(prev => ({ ...prev, client: e.target.value }))}
          placeholder="Enter client name"
          disabled={isSubmitting}
        />
        <Dropdown
          label="Project Type"
          options={projectTypes}
          value={form.type}
          onChange={(value) => setForm(prev => ({ ...prev, type: value }))}
          disabled={isSubmitting}
        />
        <Dropdown
          label="Target PLC Vendor"
          options={plcVendors}
          value={form.vendor}
          onChange={(value) => setForm(prev => ({ ...prev, vendor: value }))}
          error={errors.vendor}
          disabled={isSubmitting}
        />
        <Textarea
          label="Brief Description"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe the project scope and objectives..."
          rows={3}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="ghost"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </Button>
      </div>
    </Modal>
  );
}
