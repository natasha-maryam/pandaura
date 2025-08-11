import React, { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle, Circle, RefreshCw, AlertCircle } from "lucide-react";
import { Button, Input } from "../ui";
import { useAuth } from "../../contexts/AuthContext";
import { useSignUp } from "../../contexts/SignUpContext";
import { useToast } from "../ui/Toast";

interface SignUpSecurityProps {
  nextStep: () => void;
  prevStep: () => void;
  onSecurityData: (data: any) => void;
}

export default function SignUpSecurity({
  nextStep,
  prevStep,
  onSecurityData,
}: SignUpSecurityProps) {
  const { signUpData, updateSignUpData } = useSignUp();
  const { setupTwoFactor, verifyTwoFactor, login, logout } = useAuth();
  const { showToast } = useToast();
  
  const [method, setMethod] = useState<"totp" | "sms" | null>(
    signUpData.securityData?.method || null
  );
  const [code, setCode] = useState(signUpData.securityData?.code || "");
  const [secret, setSecret] = useState(signUpData.securityData?.secret || "");
  const [qrCodeUrl, setQrCodeUrl] = useState(signUpData.securityData?.qrCodeUrl || "");
  const [error, setError] = useState("");
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(signUpData.securityData?.verified || false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [setupAttempts, setSetupAttempts] = useState(0);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [showManualSecret, setShowManualSecret] = useState(false);

  // Generate QR Code when TOTP method is selected
  useEffect(() => {
    if (method === "totp" && !secret && !qrCodeUrl && signUpData.accountData) {
      handleSetup2FA();
    }
  }, [method, secret, qrCodeUrl, signUpData.accountData]);

  const handleSetup2FA = async () => {
    if (!signUpData.accountData?.email || !signUpData.accountData?.password) {
      setError("Account credentials not available. Please go back and complete account creation.");
      return;
    }

    setIsSettingUp(true);
    setIsAuthenticating(true);
    setError("");
    
    try {
      // First, temporarily authenticate the user to get access token
      const loginResult = await login(
        signUpData.accountData.email, 
        signUpData.accountData.password
      );

      if (!loginResult.success) {
        throw new Error(loginResult.message || 'Failed to authenticate');
      }

      setIsAuthenticating(false);

      // Now set up 2FA
      const result = await setupTwoFactor();
      setSecret(result.secret);
      setQrCodeUrl(result.qrCodeUrl);
      
      // Update context
      updateSignUpData('securityData', {
        ...signUpData.securityData,
        method: "totp",
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        code: code
      });

      showToast({
        variant: 'success',
        title: '2FA Setup Initiated',
        message: 'Please scan the QR code with your authenticator app.',
      });
    } catch (error: any) {
      console.error('2FA setup error:', error);
      setSetupAttempts(prev => prev + 1);
      setError(error.message || 'Failed to setup 2FA. Please try again.');
      showToast({
        variant: 'error',
        title: '2FA Setup Failed',
        message: `Attempt ${setupAttempts + 1}/3: Unable to generate QR code. ${setupAttempts >= 2 ? 'Please contact support if issue persists.' : 'Please try again.'}`,
      });
    } finally {
      setIsSettingUp(false);
      setIsAuthenticating(false);
    }
  };

  const handleRetrySetup = () => {
    setSecret("");
    setQrCodeUrl("");
    setError("");
    handleSetup2FA();
  };

  const handleVerify2FA = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const result = await verifyTwoFactor(code);
      
      if (result.success) {
        setIsVerified(true);
        
        // Update context with verification status
        const securityData = {
          method: method!,
          secret,
          qrCodeUrl,
          code,
          verified: true
        };
        
        updateSignUpData('securityData', securityData);
        onSecurityData(securityData);

        // Logout the temporary session since 2FA is now set up
        logout();

        showToast({
          variant: 'success',
          title: '2FA Verified',
          message: 'Two-factor authentication has been successfully enabled.',
        });

        // Auto-advance to next step after successful verification
        setTimeout(() => {
          nextStep();
        }, 1500);
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setVerificationAttempts(prev => prev + 1);
      setError(error.message || 'Invalid verification code. Please try again.');
      showToast({
        variant: 'error',
        title: 'Verification Failed',
        message: `Attempt ${verificationAttempts + 1}/5: Invalid code. ${verificationAttempts >= 4 ? 'Please check your authenticator app setup.' : 'Please check your authenticator app and try again.'}`,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMethodChange = (newMethod: "totp" | "sms") => {
    setMethod(newMethod);
    setError("");
    setCode("");
    setIsVerified(false);
    
    if (newMethod === "sms") {
      // SMS method - we'll skip actual setup for now
      updateSignUpData('securityData', {
        method: "sms",
        code: "",
        verified: false
      });
    }
  };

  const handleNext = () => {
    if (!method) {
      setError("Please select a security method.");
      return;
    }
    
    if (method === "totp" && !isVerified) {
      setError("Please verify your 2FA setup before continuing.");
      return;
    }
    
    if (method === "sms" && code.length !== 6) {
      setError("Please enter the 6-digit SMS code.");
      return;
    }
    
    const securityData = {
      method,
      secret,
      qrCodeUrl,
      code,
      verified: method === "sms" || isVerified
    };
    
    updateSignUpData('securityData', securityData);
    onSecurityData(securityData);
    nextStep();
  };

  const canProceed = method === "totp" ? isVerified : (method === "sms" && code.length === 6);

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
            Secure Your Account
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block mb-3 text-base font-medium text-secondary">
              Choose your security method:
            </label>
            <div className="space-y-3">
              <label
                className={`flex items-center border-2 rounded-lg px-4 py-3 cursor-pointer transition-all ${
                  method === "totp"
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 bg-transparent hover:border-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="totp"
                  checked={method === "totp"}
                  onChange={() => handleMethodChange("totp")}
                  className="hidden"
                />
                <span className="mr-3">
                  {method === "totp" ? (
                    <CheckCircle className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </span>
                <div className="flex-1">
                  <span className="text-base font-medium text-primary">
                    Authenticator App (TOTP)
                  </span>
                  <p className="text-sm text-secondary mt-1">
                    Recommended - Use Google Authenticator or similar app
                  </p>
                </div>
                {isVerified && method === "totp" && (
                  <CheckCircle className="w-5 h-5 text-green-600 ml-2" />
                )}
              </label>
              
              <label
                className={`flex items-center border-2 rounded-lg px-4 py-3 cursor-pointer transition-all ${
                  method === "sms"
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 bg-transparent hover:border-accent/50"
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value="sms"
                  checked={method === "sms"}
                  onChange={() => handleMethodChange("sms")}
                  className="hidden"
                />
                <span className="mr-3">
                  {method === "sms" ? (
                    <CheckCircle className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                </span>
                <div className="flex-1">
                  <span className="text-base font-medium text-primary">
                    SMS Backup Code
                  </span>
                  <p className="text-sm text-secondary mt-1">
                    Receive codes via text message
                  </p>
                </div>
              </label>
            </div>
          </div>

          {method === "totp" && (
            <div className="space-y-4">
              {!secret && !qrCodeUrl && (
                <div className="text-center py-4">
                  <Button
                    onClick={handleSetup2FA}
                    disabled={isSettingUp || !signUpData.accountData?.email}
                    className="w-full"
                  >
                    {isSettingUp ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        {isAuthenticating ? 'Authenticating...' : 'Setting up 2FA...'}
                      </>
                    ) : (
                      'Setup Authenticator App'
                    )}
                  </Button>
                  {!signUpData.accountData?.email && (
                    <p className="text-sm text-yellow-600 mt-2 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Account credentials not available
                    </p>
                  )}
                </div>
              )}

              {qrCodeUrl && (
                <div className="text-center space-y-4">
                  <p className="text-sm text-secondary">
                    Scan this QR code with your authenticator app:
                  </p>
                  <div className="flex justify-center">
                    <div className="w-48 h-48 border-2 border-gray-200 rounded-lg flex items-center justify-center bg-white">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=192x192&data=${encodeURIComponent(qrCodeUrl)}`}
                        alt="2FA QR Code"
                        className="w-44 h-44"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setShowManualSecret(!showManualSecret)}
                      className="text-sm text-accent hover:text-accent-dark underline"
                    >
                      {showManualSecret ? 'Hide' : 'Show'} manual setup key
                    </button>
                    {showManualSecret && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-secondary mb-2">Manual setup key:</p>
                        <p className="font-mono text-sm bg-white px-3 py-2 rounded border break-all">{secret}</p>
                      </div>
                    )}
                  </div>

                  {setupAttempts > 0 && setupAttempts < 3 && (
                    <div className="mt-4">
                      <Button
                        onClick={handleRetrySetup}
                        variant="outline"
                        size="sm"
                        disabled={isSettingUp}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry QR Code Generation
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {qrCodeUrl && (
                <div className="space-y-2">
                  <Input
                    label="Verification Code"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      setCode(value);
                      setError("");
                    }}
                    maxLength={6}
                    error={error}
                    disabled={isVerified}
                    className="text-center text-lg font-mono"
                  />
                  {!isVerified && (
                    <div className="space-y-3">
                      <Button
                        onClick={handleVerify2FA}
                        disabled={code.length !== 6 || isVerifying}
                        className="w-full"
                        variant={isVerified ? "success" : "primary"}
                      >
                        {isVerifying ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Enable 2FA'
                        )}
                      </Button>
                      {verificationAttempts > 0 && verificationAttempts < 5 && (
                        <p className="text-sm text-yellow-600 text-center">
                          Attempt {verificationAttempts}/5 - Double-check the code in your authenticator app
                        </p>
                      )}
                      {verificationAttempts >= 3 && !isVerified && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Having trouble?</strong> Make sure your device's time is synchronized and you're using the latest code.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  {isVerified && (
                    <div className="text-center py-2">
                      <div className="inline-flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-medium">2FA Successfully Enabled!</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {method === "sms" && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> SMS-based 2FA is available as a backup option. 
                  For this demo, enter any 6-digit code to continue.
                </p>
              </div>
              <Input
                label="SMS Verification Code"
                placeholder="Enter 6-digit SMS code"
                value={code}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCode(value);
                  setError("");
                }}
                maxLength={6}
                error={error}
                className="text-center text-lg font-mono"
              />
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

          <div className="flex justify-between pt-4">
            <Button
              variant="secondary"
              onClick={prevStep}
              disabled={isVerifying}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed || isVerifying}
            >
              {method === "totp" && isVerified ? 'Continue' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
