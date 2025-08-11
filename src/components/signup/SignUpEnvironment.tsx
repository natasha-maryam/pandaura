
import React, { useState, useEffect } from "react";
import { ArrowLeft, Shield, Monitor, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { Button, Input } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useSignUp } from "../../contexts/SignUpContext";
import { useToast } from "../ui/Toast";
import logo from "../../assets/logo.png";

function generateInstanceId() {
  // Generate a unique instance ID for this browser/device
  const stored = localStorage.getItem('pandaura_instance_id');
  if (stored) return stored;
  
  const newId = "INST-" + Math.random().toString(36).substr(2, 9).toUpperCase();
  localStorage.setItem('pandaura_instance_id', newId);
  return newId;
}

function getDeviceFingerprint() {
  // Create a device fingerprint from various browser properties
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx!.textBaseline = 'top';
  ctx!.font = '14px Arial';
  ctx!.fillText('Device fingerprint', 2, 2);
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

interface SignUpEnvironmentProps {
  nextStep: () => void;
  prevStep: () => void;
  onEnvironmentData: (data: any) => void;
}

export default function SignUpEnvironment({ 
  nextStep, 
  prevStep, 
  onEnvironmentData 
}: SignUpEnvironmentProps) {
  const { signUpData, updateSignUpData } = useSignUp();
  const { bindDevice } = useAuth();
  const { showToast } = useToast();
  
  const [instanceId, setInstanceId] = useState(signUpData.environmentData?.instanceId || "");
  const [fingerprint, setFingerprint] = useState(signUpData.environmentData?.fingerprint || "");
  const [isBinding, setIsBinding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(signUpData.environmentData?.bound || false);
  const [bindingAttempts, setBindingAttempts] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isOrgCreator, setIsOrgCreator] = useState(false);

  useEffect(() => {
    // Generate device identifiers
    const newInstanceId = generateInstanceId();
    const newFingerprint = getDeviceFingerprint();
    setInstanceId(newInstanceId);
    setFingerprint(newFingerprint);
    
    // Check if user is creating a new organization (admin/creator)
    const isCreatingOrg = signUpData.orgChoice === 'create';
    setIsOrgCreator(isCreatingOrg);
    
    // Update context with device data
    updateSignUpData('environmentData', {
      ...signUpData.environmentData,
      instanceId: newInstanceId,
      fingerprint: newFingerprint
    });
  }, []);

  const handleBind = async () => {
    setIsBinding(true);
    setError("");
    
    try {
      // For signup flow, we'll use a special signup device binding
      // that doesn't require full authentication
      const response = await fetch('http://localhost:5000/api/v1/auth/signup-device-bind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceId,
          fingerprint,
          email: signUpData.accountData?.email,
          signupToken: 'temp-signup-' + Date.now(), // Temporary token for signup
          isOrgCreator,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to bind device');
      }

      setSuccess(true);
      setBindingAttempts(0);
      
      // Update context with successful binding
      const environmentData = {
        instanceId,
        fingerprint,
        bound: true,
        bindingTimestamp: new Date().toISOString(),
        isOrgCreator
      };
      
      updateSignUpData('environmentData', environmentData);
      onEnvironmentData(environmentData);

      showToast({
        variant: 'success',
        title: 'Device Bound Successfully',
        message: 'Your account is now securely bound to this device.',
      });

      // Auto-advance to next step after short delay
      setTimeout(() => {
        nextStep();
      }, 2000);
      
    } catch (error: any) {
      console.error('Device binding error:', error);
      setBindingAttempts(prev => prev + 1);
      setError(error.message || 'Failed to bind device. Please try again.');
      
      showToast({
        variant: 'error',
        title: 'Device Binding Failed',
        message: `Attempt ${bindingAttempts + 1}/3: ${error.message || 'Device binding failed'}`,
      });
    } finally {
      setIsBinding(false);
    }
  };

  const handleRetryBinding = () => {
    setError("");
    setSuccess(false);
    handleBind();
  };

  const handleManualOverride = () => {
    // For organization creators/admins - allow manual override
    if (!isOrgCreator) {
      setError("Manual override is only available for organization creators.");
      showToast({
        variant: 'error',
        title: 'Access Denied',
        message: 'Manual override is restricted to organization creators only.',
      });
      return;
    }

    const environmentData = {
      instanceId,
      fingerprint,
      bound: true,
      manualOverride: true,
      bindingTimestamp: new Date().toISOString(),
      isOrgCreator
    };
    
    updateSignUpData('environmentData', environmentData);
    onEnvironmentData(environmentData);

    showToast({
      variant: 'success',
      title: 'Manual Override Applied',
      message: 'Device binding bypassed by organization creator.',
    });

    nextStep();
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
            Environment Binding
          </h2>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-accent" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-primary">Secure Your Account</h3>
            <p className="text-sm text-secondary">
              {isOrgCreator ? 
                'As an organization creator, bind your device for enhanced security.' :
                'Bind your account to this device and environment to prevent unauthorized access.'
              }
            </p>
            {isOrgCreator && (
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-700">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Organization Creator: Manual override available if binding fails
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex items-center space-x-3">
                <Monitor className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Device Instance</p>
                  <p className="text-xs text-secondary font-mono">{instanceId}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-secondary" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Device Fingerprint</p>
                  <p className="text-xs text-secondary font-mono">{fingerprint.substring(0, 16)}...</p>
                </div>
              </div>
            </div>

            {success ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Device Successfully Bound</p>
                    <p className="text-xs text-green-600">Your account is now secured to this environment</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Button
                  onClick={handleBind}
                  disabled={isBinding}
                  className="w-full"
                  size="lg"
                >
                  {isBinding ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Binding Device...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Bind This Device
                    </>
                  )}
                </Button>

                {bindingAttempts > 0 && bindingAttempts < 3 && !success && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleRetryBinding}
                      variant="outline"
                      className="w-full"
                      disabled={isBinding}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Device Binding
                    </Button>
                    <p className="text-sm text-yellow-600 text-center">
                      Attempt {bindingAttempts}/3 failed. Please try again.
                    </p>
                  </div>
                )}

                {(bindingAttempts >= 3 || isOrgCreator) && !success && (
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        {bindingAttempts >= 3 ? (
                          <>
                            <strong>Multiple binding attempts failed.</strong> 
                            {isOrgCreator ? ' As an organization creator, you can use manual override.' : ' Please contact support.'}
                          </>
                        ) : (
                          <>Organization creators can use manual override if needed.</>
                        )}
                      </p>
                    </div>
                    
                    {(bindingAttempts >= 3 || isOrgCreator) && (
                      <>
                        <button
                          onClick={() => setShowAdvanced(!showAdvanced)}
                          className="text-sm text-accent hover:text-accent-dark underline"
                        >
                          {showAdvanced ? 'Hide' : 'Show'} organization creator options
                        </button>

                        {showAdvanced && (
                          <div className="p-3 bg-gray-50 border rounded-lg space-y-3">
                            <p className="text-sm font-medium text-secondary">
                              Organization Creator Options:
                            </p>
                            <Button
                              onClick={handleManualOverride}
                              variant="outline"
                              size="sm"
                              className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                              disabled={!isOrgCreator}
                            >
                              {isOrgCreator ? 'Manual Override (Creator)' : 'Override Not Available'}
                            </Button>
                            <p className="text-xs text-yellow-600">
                              ⚠️ {isOrgCreator ? 
                                'As organization creator, you can bypass device binding. Use with caution.' :
                                'Manual override is only available to organization creators.'
                              }
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {error}
                </p>
              </div>
            )}

            <div className="pt-4 space-y-3">
              <div className="text-center">
                <p className="text-xs text-secondary">
                  Device binding prevents credential reuse on unauthorized devices
                </p>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="secondary"
                  onClick={prevStep}
                  disabled={isBinding}
                >
                  Back
                </Button>
                {success && (
                  <Button onClick={nextStep}>
                    Continue to Finish
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
