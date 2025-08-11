import React from "react";
import { CheckCircle, Shield, Users, ArrowRight } from "lucide-react";
import { Button } from "../ui";
import { useSignUp } from "../../contexts/SignUpContext";

interface SignUpFinishProps {
  onComplete: () => Promise<void>;
  isLoading: boolean;
}

export default function SignUpFinish({ onComplete, isLoading }: SignUpFinishProps) {
  const { signUpData } = useSignUp();
  
  const getOrgName = () => {
    if (signUpData.orgChoice === 'create') {
      return signUpData.orgData?.orgName || 'your organization';
    } else if (signUpData.orgChoice === 'join') {
      return signUpData.inviteData?.orgName || 'the organization';
    }
    return 'your organization';
  };

  const getUserRole = () => {
    if (signUpData.orgChoice === 'join') {
      return signUpData.inviteData?.role || 'Member';
    }
    return 'Admin';
  };

  const getSecurityStatus = () => {
    if (signUpData.securityData?.verified) {
      return '2FA Authentication enabled';
    } else if (signUpData.securityData?.method === 'sms') {
      return 'SMS backup authentication configured';
    }
    return 'Basic authentication';
  };

  const getDeviceStatus = () => {
    if (signUpData.environmentData?.bound) {
      if (signUpData.environmentData.manualOverride) {
        return 'Device binding overridden by administrator';
      }
      return 'Device securely bound to account';
    }
    return 'Device binding skipped';
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Success Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Welcome to Pandaura AS!
            </h1>
            <p className="text-lg text-secondary">
              Account created and joined <strong>{getOrgName()}</strong>
            </p>
            <p className="text-sm text-secondary mt-1">
              You're ready to collaborate with your team.
            </p>
          </div>
        </div>

        {/* Setup Summary */}
        <div className="space-y-4 mb-8">
          <h3 className="text-sm font-semibold text-secondary uppercase tracking-wide">
            Setup Summary
          </h3>
          
          <div className="space-y-3">
            {/* Organization & Role */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">{getOrgName()}</p>
                <p className="text-xs text-blue-600">Role: {getUserRole()}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>

            {/* Security */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">Security Setup</p>
                <p className="text-xs text-green-600">{getSecurityStatus()}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>

            {/* Device Binding */}
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900">Device Security</p>
                <p className="text-xs text-purple-600">{getDeviceStatus()}</p>
              </div>
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-4 bg-gray-50 rounded-lg mb-8">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-secondary">Account Email:</span>
              <span className="text-sm text-primary">{signUpData.accountData?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-secondary">Full Name:</span>
              <span className="text-sm text-primary">{signUpData.accountData?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-secondary">Organization:</span>
              <span className="text-sm text-primary">{getOrgName()}</span>
            </div>
            {signUpData.environmentData?.instanceId && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-secondary">Device Instance:</span>
                <span className="text-xs font-mono text-secondary">{signUpData.environmentData.instanceId}</span>
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="space-y-4">
          <Button
            onClick={onComplete}
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Finalizing Setup...
              </>
            ) : (
              <>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-secondary">
            Your organization context and team permissions are now active.
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Security Notice:</strong> Your account has been configured with enhanced security features. 
            {signUpData.securityData?.verified && " Keep your authenticator app accessible for future logins."}
            {signUpData.environmentData?.bound && " Your device binding helps protect against unauthorized access."}
          </p>
        </div>
      </div>
    </div>
  );
}
