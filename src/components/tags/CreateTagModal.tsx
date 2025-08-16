import React, { useState } from 'react';
import { Modal, Button, Input, Dropdown, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { CreateTagData } from './api';
import { validateAddress, getVendorAddressDescription, getAddressExamples } from '../../utils/addressValidation';

interface FormErrors {
  name?: string;
  description?: string;
  type?: string;
  address?: string;
  default_value?: string;
  vendor?: string;
  scope?: string;
  tag_type?: string;
}

interface CreateTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
  onCreate: (tagData: CreateTagData) => Promise<void>;
}

const tagTypes = [
  { value: "BOOL", label: "BOOL" },
  { value: "INT", label: "INT" },
  { value: "DINT", label: "DINT" },
  { value: "REAL", label: "REAL" },
  { value: "STRING", label: "STRING" },
  { value: "TIMER", label: "TIMER" },
  { value: "COUNTER", label: "COUNTER" },
];

// Vendor-specific supported data types
const vendorSupportedTypes = {
  rockwell: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING', 'TIMER', 'COUNTER'],
  siemens: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING'], // Siemens doesn't support TIMER/COUNTER
  beckhoff: ['BOOL', 'INT', 'DINT', 'REAL', 'STRING', 'TIMER', 'COUNTER']
};

// Get available tag types for selected vendor
const getAvailableTagTypes = (vendor: string) => {
  const supportedTypes = vendorSupportedTypes[vendor as keyof typeof vendorSupportedTypes] || vendorSupportedTypes.rockwell;
  return tagTypes.filter(type => supportedTypes.includes(type.value));
};

const vendors = [
  { value: "rockwell", label: "Rockwell" },
  { value: "siemens", label: "Siemens" },
  { value: "beckhoff", label: "Beckhoff" },
];

const scopes = [
  { value: "global", label: "Global" },
  { value: "local", label: "Local" },
  { value: "input", label: "Input" },
  { value: "output", label: "Output" },
];

const tagTypeOptions = [
  { value: "input", label: "Input" },
  { value: "output", label: "Output" },
  { value: "memory", label: "Memory" },
  { value: "temp", label: "Temp" },
  { value: "constant", label: "Constant" },
];

export default function CreateTagModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  projectId,
  onCreate
}: CreateTagModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<Omit<CreateTagData, 'project_id'>>({
    name: '',
    description: '',
    type: 'BOOL',
    address: '',
    default_value: '',
    vendor: 'rockwell',
    scope: 'global',
    tag_type: 'memory',
    is_ai_generated: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const formErrors: FormErrors = {};
    
    if (!form.name.trim()) {
      formErrors.name = 'Tag name is required';
    } 
    
    if (!form.description.trim()) {
      formErrors.description = 'Description is required';
    }
    
    // Validate data type is supported by vendor
    const supportedTypes = vendorSupportedTypes[form.vendor as keyof typeof vendorSupportedTypes] || vendorSupportedTypes.rockwell;
    if (!supportedTypes.includes(form.type)) {
      formErrors.type = `Data type '${form.type}' is not supported by ${form.vendor.charAt(0).toUpperCase() + form.vendor.slice(1)}`;
    }
    
    if (!form.address.trim()) {
      formErrors.address = 'Address is required';
    } else {
      // Validate address format based on vendor
      const addressValidation = validateAddress(form.address, form.vendor);
      if (!addressValidation.isValid) {
        formErrors.address = addressValidation.errorMessage;
      }
    }
    
    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const tagData: CreateTagData = {
        ...form,
        project_id: projectId,
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        default_value: form.default_value?.trim() || '',
      };

      await onCreate(tagData);
      
      showToast({
        variant: 'success',
        title: 'Success!',
        message: `Tag "${form.name.trim()}" has been created successfully.`,
        duration: 4000
      });
      
      onSuccess();
      handleClose();
      
    } catch (error: any) {
      console.error('Failed to create tag:', error);
      
      showToast({
        variant: 'error',
        title: 'Error',
        message: error.message || 'Failed to create tag. Please try again.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      description: '',
      type: 'BOOL',
      address: '',
      default_value: '',
      vendor: 'rockwell',
      scope: 'global',
      tag_type: 'memory',
      is_ai_generated: false,
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // When vendor changes, check if current type is supported
      if (field === 'vendor') {
        const supportedTypes = vendorSupportedTypes[value as keyof typeof vendorSupportedTypes] || vendorSupportedTypes.rockwell;
        if (!supportedTypes.includes(prev.type)) {
          // Reset to first supported type if current type is not supported
          newForm.type = supportedTypes[0] as any;
        }
      }
      
      return newForm;
    });
    
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Re-validate address when vendor changes
    if (field === 'vendor' && form.address) {
      const addressValidation = validateAddress(form.address, value);
      if (!addressValidation.isValid) {
        setErrors(prev => ({ ...prev, address: addressValidation.errorMessage }));
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Tag"
      size="lg"
      actions={
        <>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Tag'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* First row: Vendor selection (most important) */}
        <div>
          <Dropdown
            label="Vendor"
            options={vendors}
            value={form.vendor}
            onChange={(value) => updateForm('vendor', value)}
            required
          />
        </div>

        {/* Second row: Tag Name and Address (depends on vendor) */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Tag Name"
              placeholder="Enter tag name (e.g., Motor_01_Start)"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              error={errors.name}
              required
            />
          </div>
          <div>
            <Input
              label="Address"
              placeholder={`Enter ${form.vendor} address`}
              value={form.address}
              onChange={(e) => updateForm('address', e.target.value)}
              error={errors.address}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              <div className="mb-1">{getVendorAddressDescription(form.vendor)}</div>
              <div>
                <span className="font-medium">Examples:</span> {getAddressExamples(form.vendor).join(', ')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <Textarea
            label="Description"
            placeholder="Enter tag description"
            value={form.description}
            onChange={(e) => updateForm('description', e.target.value)}
            error={errors.description}
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Dropdown
              label="Data Type"
              options={getAvailableTagTypes(form.vendor)}
              value={form.type}
              onChange={(value) => updateForm('type', value)}
              required
            />
          </div>
          <div>
            <Dropdown
              label="Scope"
              options={scopes}
              value={form.scope}
              onChange={(value) => updateForm('scope', value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Dropdown
              label="Tag Type"
              options={tagTypeOptions}
              value={form.tag_type}
              onChange={(value) => updateForm('tag_type', value)}
              required
            />
          </div>
          <div>
            <Input
              label="Default Value"
              placeholder="Enter default value (optional)"
              value={form.default_value || ''}
              onChange={(e) => updateForm('default_value', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <div><span className="font-medium">Name:</span> {form.name || 'Not specified'}</div>
            <div><span className="font-medium">Address:</span> {form.address || 'Not specified'}</div>
            <div><span className="font-medium">Type:</span> {form.type} ({form.vendor})</div>
            <div><span className="font-medium">Scope:</span> {form.scope}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
