import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button, Input, Dropdown } from "../ui";
import { useSignUp } from "../../contexts/SignUpContext";

interface SignUpOrgSetupProps {
  nextStep: () => void;
  prevStep: () => void;
  onOrgData: (data: any) => void;
  isJoining?: boolean;
  inviteData?: any;
}

const industryOptions = [
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'oil-gas', label: 'Oil & Gas' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'water-treatment', label: 'Water Treatment' },
  { value: 'power-energy', label: 'Power & Energy' },
  { value: 'mining', label: 'Mining' },
  { value: 'chemical', label: 'Chemical' },
  { value: 'other', label: 'Other' }
];

const sizeOptions = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' }
];

export default function SignUpOrgSetup({ 
  nextStep, 
  prevStep, 
  onOrgData, 
  isJoining = false, 
  inviteData 
}: SignUpOrgSetupProps) {
  const { signUpData } = useSignUp();
  
  const [formData, setFormData] = useState({
    orgName: inviteData?.orgName || (signUpData.orgData?.orgName || ''),
    industry: signUpData.orgData?.industry || '',
    size: signUpData.orgData?.size || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when signUpData changes
  useEffect(() => {
    if (signUpData.orgData) {
      setFormData(prev => ({
        ...prev,
        orgName: inviteData?.orgName || signUpData.orgData?.orgName || prev.orgName,
        industry: signUpData.orgData?.industry || prev.industry,
        size: signUpData.orgData?.size || prev.size
      }));
    }
  }, [signUpData.orgData, inviteData?.orgName]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!isJoining && !formData.orgName.trim()) {
      newErrors.orgName = 'Organization name is required';
    }

    if (!formData.industry) {
      newErrors.industry = 'Please select your industry';
    }

    if (!formData.size) {
      newErrors.size = 'Please select organization size';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      onOrgData(formData);
      nextStep();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center mb-6">
          <button
            onClick={prevStep}
            className="mr-3 p-1 rounded-md hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-secondary" />
          </button>
          <h2 className="text-xl font-semibold text-primary">
            {isJoining ? 'Organization Details' : 'Create Organization'}
          </h2>
        </div>

        {isJoining && (
          <div className="mb-6 p-4 bg-accent-light rounded-lg">
            <p className="text-sm text-primary">
              <strong>Joining:</strong> {inviteData?.orgName}
            </p>
            <p className="text-sm text-secondary">
              Role: {inviteData?.role}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {!isJoining && (
            <Input
              label="Organization / Company Name"
              placeholder="Enter your organization name"
              value={formData.orgName}
              onChange={(e) => handleInputChange('orgName', e.target.value)}
              error={errors.orgName}
              required
            />
          )}

          <Dropdown
            label="Industry Sector"
            placeholder="Select your industry"
            options={industryOptions}
            value={formData.industry}
            onChange={(value) => handleInputChange('industry', value)}
            error={errors.industry}
            required
          />

          <Dropdown
            label="Organization Size"
            placeholder="Select organization size"
            options={sizeOptions}
            value={formData.size}
            onChange={(value) => handleInputChange('size', value)}
            error={errors.size}
            required
          />
        </div>

        <div className="mt-8">
          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
          >
            Continue to Account Setup
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          <p>This information helps us customize your automation workspace</p>
        </div>
      </div>
    </div>
  );
}
