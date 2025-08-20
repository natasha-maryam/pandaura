import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { OrgInfo } from "../contexts/AuthContext";
import SplashScreen from "../pages/SplashScreen";
import { SignInAuthenticator, SignInOrgSelector } from "../components/signin";
import { Eye, EyeOff, Building2 } from "lucide-react"; 
import logo from "../assets/logo.png";

// Industrial automation tooltips for inspiration
const inspirationalTooltips = [
  "The future of automation isn't wired — it's written.",
  "Logic is your language. We just make it speak faster.",
  "Great integrators don't copy-paste. They build systems that last.",
  "Your plant doesn't wait. Neither should your tools.",
  "Structured text. Unstructured power.",
  "You didn't choose automation for paperwork.",
  "Code once. Deploy everywhere. Trust always.",
  "Real engineers ship reliable logic.",
  "Automation that adapts, not breaks.",
  "Your vision. Our intelligence. Perfect integration."
];

type SignInStep = 'credentials' | 'twoFactor' | 'orgSelection' | 'complete';

export default function SignInPage() {
  const navigate = useNavigate();
  const { login, setSelectedOrg, organizations: contextOrganizations, isAuthenticated, isLoading: authLoading } = useAuth();

  // Only redirect if already authenticated (this shouldn't interfere with signup flow)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Flow state
  const [currentStep, setCurrentStep] = useState<SignInStep>('credentials');
  const [organizations, setOrganizations] = useState<OrgInfo[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  
  // UI state
  const [currentTooltip, setCurrentTooltip] = useState("");
  const [usedTooltips, setUsedTooltips] = useState<string[]>([]);

  // Set a random tooltip on component mount
  useEffect(() => {
    const availableTooltips = inspirationalTooltips.filter(tip => !usedTooltips.includes(tip));
    const tooltipsToUse = availableTooltips.length > 0 ? availableTooltips : inspirationalTooltips;
    const randomTooltip = tooltipsToUse[Math.floor(Math.random() * tooltipsToUse.length)];
    setCurrentTooltip(randomTooltip);
    setUsedTooltips(prev => [...prev, randomTooltip]);
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password);
      
      if (result.requiresTwoFactor) {
        // User has 2FA enabled, show authenticator screen
        setCurrentStep('twoFactor');
      } else if (result.success) {
        // Login successful, check if user has multiple orgs
        // Wait a moment for the AuthContext to update, then check organizations
        setTimeout(() => {
          if (contextOrganizations && contextOrganizations.length > 1) {
            // User has multiple organizations, show selector
            setOrganizations(contextOrganizations);
            setCurrentStep('orgSelection');
          } else {
            // Single or no organization, proceed to home
            setCurrentStep('complete');
            handleSuccessfulLogin();
          }
        }, 100);
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FAVerification = async (code: string, rememberDevice: boolean) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await login(email.trim(), password, code);
      
      if (result.success) {
        // Store remember device preference (for future implementation)
        if (rememberDevice) {
          localStorage.setItem('pandaura_trusted_device', 'true');
        }
        
        // Check for multiple organizations after 2FA success
        setTimeout(() => {
          if (contextOrganizations && contextOrganizations.length > 1) {
            setOrganizations(contextOrganizations);
            setCurrentStep('orgSelection');
          } else {
            setCurrentStep('complete');
            handleSuccessfulLogin();
          }
        }, 100);
        
        return { success: true };
      } else {
        return { success: false, message: result.message || 'Invalid authentication code' };
      }
    } catch (err: any) {
      console.error('2FA verification error:', err);
      return { success: false, message: err.message || 'Verification failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgSelection = (selectedOrg: OrgInfo) => {
    setSelectedOrg(selectedOrg);
    setCurrentStep('complete');
    handleSuccessfulLogin();
  };

  const handleSuccessfulLogin = () => {
    setShowSplash(true);
    setTimeout(() => {
      navigate("/home");
    }, 1500);
  };

  const handleBackToCredentials = () => {
    setCurrentStep('credentials');
    setError("");
  };

  // Show splash screen when login is complete
  if (showSplash) return <SplashScreen />;

  // Show 2FA authenticator screen
  if (currentStep === 'twoFactor') {
    return (
      <SignInAuthenticator
        email={email}
        onVerify={handle2FAVerification}
        onBack={handleBackToCredentials}
        isLoading={isLoading}
      />
    );
  }

  // Show organization selector (for future use when user has multiple orgs)
  if (currentStep === 'orgSelection' && organizations.length > 1) {
    return (
      <SignInOrgSelector
        organizations={organizations}
        onOrgSelect={handleOrgSelection}
        userEmail={email}
        isLoading={isLoading}
      />
    );
  }
 
  // Default: Show credentials form
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden py-20 px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="w-full h-full bg-gradient-to-br from-accent/5 to-transparent" />
      </div>
      
      {/* Logo and Tooltip Section */}
      <div className="z-10 mb-8 flex flex-col items-center">
        <img
          src={logo}
          alt="Pandaura AS Logo"
          className="h-24 w-auto filter-none"
          style={{ filter: 'none', imageRendering: 'crisp-edges' }}
        />
        <h1 className="text-3xl font-bold text-primary text-center mt-4">
          Pandaura AS
        </h1>
        <h2 className="text-lg text-secondary text-center">
          Industrial Automation Suite
        </h2>
        
        {/* Rotating Tooltip */}
        {currentTooltip && (
          <div className="mt-4 text-center max-w-md animate-fade-in">
            <p className="text-sm text-muted italic px-4 py-2 bg-surface/50 rounded-md border border-light/50">
              "{currentTooltip}"
            </p>
          </div>
        )}
      </div>
      
      {/* Login Form */}
      <div className="w-full max-w-sm bg-surface border border-light rounded-lg shadow-card z-10 p-8">
        <h3 className="text-xl font-semibold text-primary text-center mb-6">
          Sign in to Pandaura AS
        </h3>
        
        <form className="space-y-6" onSubmit={handleCredentialsSubmit} autoComplete="on">
          {/* Email Field */}
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all disabled:opacity-50"
              placeholder=" "
            />
            <label
              htmlFor="email"
              className="absolute left-4 top-2 text-sm text-muted transition-all 
                         peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
            >
              Email Address
            </label>
          </div>
          
          {/* Password Field */}
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all disabled:opacity-50"
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute left-4 top-2 text-sm text-muted transition-all 
                         peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              disabled={isLoading}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary transition-colors disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Remember Me & Options */}
          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer text-sm text-muted">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
                className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2"
              />
              <span>Remember me</span>
            </label>
            
            <button
              type="button"
              className="text-sm text-accent hover:text-secondary transition-colors"
              onClick={() => {
                // Future: implement forgot password
                alert('Password reset functionality will be implemented soon.');
              }}
            >
              Forgot password?
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-error text-sm text-center bg-error-light border border-error/20 rounded-md p-3">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-secondary disabled:bg-disabled disabled:text-muted text-white py-3 rounded-md shadow-sm transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-2 font-medium"
          >
            {isLoading ? 'Signing in...' : 'Continue'}
          </button>
        </form>
        
        {/* SSO Section (Future Implementation) */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-light" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-muted">or continue with</span>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              disabled
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-light rounded-md shadow-sm bg-surface text-sm font-medium text-muted hover:bg-light disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Building2 className="w-5 h-5 mr-2" />
              Enterprise SSO (Coming Soon)
            </button>
          </div>
        </div>
        
        {/* Footer Links */}
        <div className="mt-6 pt-4 border-t border-light text-center space-x-4 text-xs text-muted">
          <button 
            onClick={() => navigate("/terms")}
            className="hover:text-primary transition-colors"
          >
            Terms of Use
          </button>
          <span>•</span>
          <button 
            onClick={() => navigate("/privacy")}
            className="hover:text-primary transition-colors"
          >
            Privacy Policy
          </button>
        </div>
      </div>

      {/* Sign Up Link */}
      <div className="mt-8 text-center text-sm text-muted z-10">
        Don't have an account?{" "}
        <button
          onClick={() => navigate("/signup")}
          className="text-accent hover:text-secondary font-medium transition-colors"
        >
          Sign up here
        </button>
      </div>
    </div>
  );
}
