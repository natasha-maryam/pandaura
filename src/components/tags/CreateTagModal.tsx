import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Dropdown, Textarea } from '../ui';
import { useToast } from '../ui/Toast';
import { CreateTagData } from './api';
import { validateAddress, getVendorAddressDescription, getAddressExamples } from '../../utils/addressValidation';
import { VendorType, vendorConfigs, isValidDataType, isValidScope } from '../../utils/vendorDataTypes';

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
  customTypes?: Array<{ value: string; label: string }>;
  onCustomTypeAdded?: (type: string) => void;
}

const vendors = [
  { value: "rockwell", label: vendorConfigs.rockwell.name },
  { value: "siemens", label: vendorConfigs.siemens.name },
  { value: "beckhoff", label: vendorConfigs.beckhoff.name },
];

// Helper function to convert vendorConfigs data types to dropdown options
const getAvailableTagTypes = (vendor: VendorType) => {
  return vendorConfigs[vendor].dataTypes.map(type => ({
    value: type,
    label: type
  }));
};

// Helper function to get vendor-specific scopes as dropdown options
const getAvailableScopes = (vendor: VendorType) => {
  return vendorConfigs[vendor].scopes.map(scope => ({
    value: scope.toLowerCase(),
    label: scope
  }));
};

export default function CreateTagModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  projectId,
  onCreate,
  customTypes = [],
  onCustomTypeAdded
}: CreateTagModalProps) {
  const { showToast } = useToast();
  const [customTypeInput, setCustomTypeInput] = useState('');
  const [isAddingCustomType, setIsAddingCustomType] = useState(false);
  // keep a local copy so we can immediately show newly added custom types
  const [localCustomTypes, setLocalCustomTypes] = useState<Array<{ value: string; label: string }>>(customTypes);

  useEffect(() => {
    setLocalCustomTypes(customTypes);
  }, [customTypes]);
  type FormData = Omit<CreateTagData, 'project_id'> & {
    type: string; // Allow any string type to support custom Beckhoff types
  };

  const [form, setForm] = useState<FormData>({
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
    if (!isValidDataType(form.vendor as VendorType, form.type)) {
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
    setCustomTypeInput('');
    setIsAddingCustomType(false);
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const updateForm = (field: keyof typeof form, value: any) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // When vendor changes, check if current type is supported and update scope
      if (field === 'vendor') {
        const vendorType = value as VendorType;
        
        // Check if current data type is supported by new vendor
        if (!isValidDataType(vendorType, prev.type)) {
          // Only assign type if it's in the allowed set of types
          const defaultType = (vendorConfigs[vendorType].dataTypes[0] === 'BOOL' ? 'BOOL' : 'INT') as CreateTagData['type'];
          newForm.type = defaultType;
        }
        
        // Check if current scope is supported by new vendor
        if (!isValidScope(vendorType, prev.scope)) {
          // Only assign scope if it's in the allowed set of scopes
          const defaultScope = (vendorConfigs[vendorType].scopes[0].toLowerCase() === 'global' ? 'global' : 'local') as CreateTagData['scope'];
          newForm.scope = defaultScope;
        }

        // Update tag type based on vendor
        if (vendorType === 'siemens') {
          newForm.tag_type = 'memory';
        } else if (vendorType === 'rockwell' && !['input', 'output', 'memory'].includes(prev.tag_type)) {
          newForm.tag_type = 'memory';
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
            {form.vendor === 'beckhoff' ? (
              <div>
                {isAddingCustomType ? (
                  <Input
                    label="Custom Data Type"
                    placeholder="Enter custom data type name (e.g., ST_CUSTOM_STRUCT)"
                    value={customTypeInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const value = e.target.value.toUpperCase();
                      setCustomTypeInput(value);
                    }}
                    onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                      const formattedType = customTypeInput.trim();
                      if (formattedType) {
                        // Add to custom types if not already present
                        // Add to local list immediately so dropdown shows it
                        if (!localCustomTypes.some(t => t.value === formattedType)) {
                          setLocalCustomTypes(prev => [...prev, { value: formattedType, label: formattedType }]);
                        }
                        // Update form type first so dropdown can match the option
                        updateForm('type', formattedType);
                        // Then hide the custom input and clear the buffer
                        setIsAddingCustomType(false);
                        setCustomTypeInput('');
                        // Notify parent if provided
                        if (!customTypes.some(t => t.value === formattedType)) {
                          onCustomTypeAdded?.(formattedType);
                        }
                      } else {
                        // If empty, revert to first available type
                        setIsAddingCustomType(false);
                        setCustomTypeInput('');
                        updateForm('type', getAvailableTagTypes(form.vendor as VendorType)[0].value);
                      }
                    }}
                    required
                  />
                ) : (
                  <Dropdown
                    label="Data Type"
                    options={(() => {
                      const base = [
                        ...getAvailableTagTypes(form.vendor as VendorType),
                        ...localCustomTypes.map(type => ({ value: type.value, label: type.label || type.value })),
                      ];
                      // Ensure current form.type is present so the dropdown can show it as selected
                      if (form.type && !base.some(o => o.value === form.type) && form.type !== 'custom') {
                        base.unshift({ value: form.type, label: form.type });
                      }
                      base.push({ value: 'custom', label: '+ Add Custom Type' });
                      return base;
                    })()}
                    value={form.type}
                    onChange={(value: string) => {
                      if (value === 'custom') {
                        setIsAddingCustomType(true);
                      } else {
                        updateForm('type', value);
                      }
                    }}
                    required
                  />
                )}
                {/* Ensure newly added custom types are immediately available */}
                {form.type !== 'custom' && (
                  <div className="mt-1 text-xs text-gray-500">
                    <div>
                      <span className="font-medium">Common Types:</span> {vendorConfigs[form.vendor as VendorType].dataTypes.join(', ')}
                    </div>
                    {localCustomTypes.length > 0 && (
                      <div className="mt-1">
                        <span className="font-medium">Custom Types:</span> {localCustomTypes.map(t => t.value).join(', ')}
                      </div>
                    )}
                    <div className="mt-1">
                      <span className="font-medium">Note:</span> You can add custom data types for Beckhoff PLCs
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <Dropdown
                  label="Data Type"
                  options={getAvailableTagTypes(form.vendor as VendorType)}
                  value={form.type as string}
                  onChange={(value) => updateForm('type', value)}
                  required
                />
                <div className="mt-1 text-xs text-gray-500">
                  <div>
                    <span className="font-medium">Supported Types:</span> {vendorConfigs[form.vendor as VendorType].dataTypes.join(', ')}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <Dropdown
              label="Scope"
              options={getAvailableScopes(form.vendor as VendorType)}
              value={form.scope}
              onChange={(value) => updateForm('scope', value)}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              {form.vendor === 'siemens' ? (
                <div>Scope defined by DB (Data Block), I (Inputs), Q (Outputs), M (Memory)</div>
              ) : form.vendor === 'rockwell' ? (
                <div>Scope affects tag category in Studio 5000</div>
              ) : (
                <div>Scope defines variable accessibility</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Dropdown
              label="Tag Type"
              options={[
                { value: "input", label: "Input" },
                { value: "output", label: "Output" },
                { value: "memory", label: "Memory" },
                { value: "temp", label: "Temp" },
                { value: "constant", label: "Constant" }
              ].filter(option => {
                // Filter tag types based on vendor compatibility
                if (form.vendor === 'siemens') {
                  return ['memory', 'input', 'output', 'temp'].includes(option.value);
                }
                if (form.vendor === 'rockwell') {
                  return ['input', 'output', 'memory'].includes(option.value);
                }
                return true; // Show all for Beckhoff
              })}
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
