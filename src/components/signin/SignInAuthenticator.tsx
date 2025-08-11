import React, { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle, RefreshCw } from "lucide-react";
import { Button, Input } from "../ui";
import logo from "../../assets/logo.png";

interface SignInAuthenticatorProps {
  email: string;
  onVerify: (code: string, rememberDevice: boolean) => Promise<{ success: boolean; message?: string }>;
  onBack: () => void;
  isLoading?: boolean;
}

export default function SignInAuthenticator({
  email,
  onVerify,
  onBack,
  isLoading = false
}: SignInAuthenticatorProps) {
  const [code, setCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  // Auto-submit when 6 digits are entered
  useEffect(() => {
    if (code.length === 6 && !isLoading) {
      handleVerify();
    }
  }, [code, isLoading]);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setError("");
    
    try {
      const result = await onVerify(code, rememberDevice);
      
      if (!result.success) {
        setAttempts(prev => prev + 1);
        setError(result.message || 'Invalid authentication code');
        setCode(""); // Clear the code for retry
      }
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      setError(err.message || 'Verification failed');
      setCode(""); // Clear the code for retry
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 6) {
      setCode(value);
      setError("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && !isLoading) {
      handleVerify();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden py-20 px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-transparent" />
      </div>
      
      {/* Logo Section */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <img
          src={logo}
          alt="Pandaura AS Logo"
          className="h-16 w-auto filter-none"
          style={{ filter: 'none', imageRendering: 'crisp-edges' }}
        />
        <h1 className="text-2xl font-bold text-primary text-center mt-3">
          Two-Factor Authentication
        </h1>
        <p className="text-sm text-muted text-center mt-2 max-w-md">
          Enter the 6-digit code from your authenticator app for <strong>{email}</strong>
        </p>
      </div>
      
      {/* 2FA Form */}
      <div className="w-full max-w-sm bg-surface border border-light rounded-lg shadow-card z-10 p-8">
        <div className="space-y-6">
          {/* Code Input */}
          <div className="space-y-4">
            <div className="relative">
              <input
                id="twofa-code"
                name="twofa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                autoFocus
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={handleCodeChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all text-center text-2xl tracking-[0.5em] font-mono"
                placeholder="000000"
              />
              <label
                htmlFor="twofa-code"
                className="absolute left-4 top-2 text-sm text-muted transition-all 
                           peer-focus:text-xs peer-focus:text-secondary"
              >
                Authentication Code
              </label>
            </div>
            
            {/* Progress indicator */}
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < code.length
                      ? 'bg-accent'
                      : 'bg-light'
                  }`}
                />
              ))}
            </div>
            
            {/* Remember Device Option */}
            <label className="flex items-center space-x-3 cursor-pointer text-sm text-muted mt-4">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2"
              />
              <span>Trust this device for 30 days</span>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-error text-sm text-center bg-error-light border border-error/20 rounded-md p-3 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
              {attempts > 0 && (
                <span className="ml-2 text-xs">
                  (Attempt {attempts}/5)
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleVerify}
              disabled={code.length !== 6 || isLoading}
              className="w-full bg-primary hover:bg-secondary disabled:bg-disabled disabled:text-muted text-white py-3 rounded-md shadow-sm transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-2 font-medium"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin inline" />
                  Verifying...
                </>
              ) : (
                'Verify & Sign In'
              )}
            </button>
            
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="w-full text-muted hover:text-primary text-sm transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </button>
          </div>

          {/* Help Text */}
          {attempts >= 3 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Having trouble?</strong> Make sure your device's time is synchronized and you're using the latest code from your authenticator app.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 pt-4 text-center space-x-4 text-xs text-muted z-10">
        <span>Need help? Contact your system administrator</span>
      </div>
    </div>
  );
}
