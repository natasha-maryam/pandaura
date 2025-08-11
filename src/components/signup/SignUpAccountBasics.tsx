import React, { useState } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button, Input } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useSignUp } from "../../contexts/SignUpContext";
import { useToast } from "../ui/Toast";

function validateEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

function passwordRequirements(password: string) {
  return {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

interface SignUpAccountBasicsProps {
  nextStep: () => void;
  prevStep: () => void;
  onAccountData: (data: any) => void;
  isJoining?: boolean;
  inviteData?: any;
}

export default function SignUpAccountBasics({ 
  nextStep, 
  prevStep, 
  onAccountData, 
  isJoining = false, 
  inviteData 
}: SignUpAccountBasicsProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "", // Allow user to input their own email when joining
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
    const { createOrganization, acceptInvite } = useAuth();
  const { signUpData, updateSignUpData } = useSignUp();
  const { showToast } = useToast();

  // Populate form data from context on component mount
  React.useEffect(() => {
    if (signUpData.accountData) {
      setFormData(prev => ({
        ...prev,
        fullName: signUpData.accountData?.fullName || prev.fullName,
        email: signUpData.accountData?.email || prev.email, // Don't pre-fill with invite email, let user choose
        password: signUpData.accountData?.password || prev.password,
        confirmPassword: signUpData.accountData?.confirmPassword || prev.confirmPassword
      }));
    }
  }, [signUpData.accountData]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    
    // Update context in real-time
    updateSignUpData('accountData', {
      fullName: newFormData.fullName,
      email: newFormData.email,
      password: newFormData.password,
      confirmPassword: newFormData.confirmPassword
    });
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation for email
    if (field === 'email' && value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }

    // Real-time validation for password confirmation
    if (field === 'confirmPassword' || (field === 'password' && newFormData.confirmPassword)) {
      const password = field === 'password' ? value : newFormData.password;
      const confirmPassword = field === 'confirmPassword' ? value : newFormData.confirmPassword;
      
      if (confirmPassword && password !== confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const reqs = passwordRequirements(formData.password);
      if (!Object.values(reqs).every(Boolean)) {
        newErrors.password = 'Password does not meet all requirements';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Save account data to context with passwords
        updateSignUpData('accountData', {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });
        
        // Also call the prop callback for backward compatibility
        onAccountData(formData);
        
        // If creating a new organization, create it now
        if (signUpData.orgChoice === 'create' && signUpData.orgData && !isJoining) {
          const result = await createOrganization({
            orgName: signUpData.orgData.orgName,
            industry: signUpData.orgData.industry,
            size: signUpData.orgData.size,
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
          });

          if (result.success) {
            showToast({
              variant: 'success',
              title: 'Organization Created!',
              message: `Welcome to ${signUpData.orgData.orgName}! Your organization has been successfully created.`,
              duration: 5000
            });
            
            // Mark organization as created in context
            updateSignUpData('organizationCreated', true);
            
            // Continue to next step
            nextStep();
          } else {
            showToast({
              variant: 'error',
              title: 'Organization Creation Failed',
              message: result.message || 'Failed to create organization. Please try again.',
              duration: 5000
            });
          }
        // If joining an organization via invite, process the invite now
        } else if (signUpData.orgChoice === 'join' && signUpData.inviteData && isJoining) {
          const result = await acceptInvite({
            code: signUpData.inviteData.code,
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
          });

          if (result.success) {
            showToast({
              variant: 'success',
              title: 'Welcome to the Team!',
              message: `Successfully joined ${signUpData.inviteData.orgName}! Your account has been created.`,
              duration: 5000
            });
            
            // Mark as ready for 2FA setup
            updateSignUpData('organizationCreated', true);
            
            // Continue to next step
            nextStep();
          } else {
            showToast({
              variant: 'error',
              title: 'Join Organization Failed',
              message: result.message || 'Failed to join organization. Please try again.',
              duration: 5000
            });
          }
        } else {
          // For any other case, just continue to next step
          nextStep();
        }
      } catch (error) {
        console.error('Organization creation error:', error);
        showToast({
          variant: 'error',
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.',
          duration: 5000
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const passwordReqs = passwordRequirements(formData.password);

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
            Account Setup
          </h2>
        </div>

        {isJoining && inviteData && (
          <div className="mb-6 p-4 bg-accent-light rounded-lg">
            <p className="text-sm text-primary">
              <strong>Joining:</strong> {inviteData.orgName}
            </p>
            <p className="text-sm text-secondary">
              Role: {inviteData.role}
            </p>
            <p className="text-xs text-secondary mt-2">
              You can use any email address for your account.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your full name"
            value={formData.fullName}
            onChange={(e) => handleInputChange('fullName', e.target.value)}
            error={errors.fullName}
            required
          />

          <Input
            label="Work Email"
            type="email"
            placeholder="Enter your work email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            error={errors.email}
            required
          />

          <div className="relative">
            <Input
              label="Create Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={errors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-secondary hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <div className="text-xs space-y-1 p-3 bg-gray-50 rounded-md">
              <p className="font-medium text-secondary mb-2">Password Requirements:</p>
              <div className="grid grid-cols-1 gap-1">
                <div className={`flex items-center ${passwordReqs.length ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordReqs.length ? '✓' : '○'}</span>
                  At least 12 characters
                </div>
                <div className={`flex items-center ${passwordReqs.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordReqs.uppercase ? '✓' : '○'}</span>
                  Uppercase letter
                </div>
                <div className={`flex items-center ${passwordReqs.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordReqs.lowercase ? '✓' : '○'}</span>
                  Lowercase letter
                </div>
                <div className={`flex items-center ${passwordReqs.number ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordReqs.number ? '✓' : '○'}</span>
                  Number
                </div>
                <div className={`flex items-center ${passwordReqs.special ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="mr-2">{passwordReqs.special ? '✓' : '○'}</span>
                  Special character
                </div>
              </div>
            </div>
          )}

          <div className="relative">
            <Input
              label="Confirm Password"
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-8 text-secondary hover:text-primary transition-colors"
            >
              {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <Button
            onClick={handleContinue}
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Organization...' : 'Continue to Security Setup'}
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          <p>Strong passwords help protect your automation workspace</p>
        </div>
      </div>
    </div>
  );
}