import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SplashScreen from "../pages/SplashScreen";
import { authenticateUser } from "../utils/mockAuth";
import { Eye, EyeOff } from "lucide-react"; 
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

export default function SignInPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [error, setError] = useState("");
  const [showSplash, setShowSplash] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!showTwoFA) {
      // First step: validate credentials
      const isAuthenticated = authenticateUser(email, password);
      
      if (isAuthenticated) {
        setError("");
        setShowTwoFA(true);
      } else {
        setError("Invalid username or password.");
      }
    } else {
      // Second step: validate 2FA
      if (twoFACode.length === 6) {
        setError("");
        setShowSplash(true);
        setTimeout(() => {
          navigate("/home");
        }, 1500);
      } else {
        setError("Please enter a valid 6-digit authentication code.");
      }
    }
  };

  if (showSplash) return <SplashScreen />;

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
          {showTwoFA ? "Two-Factor Authentication" : "Sign in to Pandaura AS"}
        </h3>
        
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="on">
          {!showTwoFA ? (
            <>
              {/* Username/Email Field */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  autoComplete="username"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all"
                  placeholder=" "
                />
                <label
                  htmlFor="email"
                  className="absolute left-4 top-2 text-sm text-muted transition-all 
                             peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
                >
                  Username or Email
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
                  className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all"
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
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* 2FA Code Field */
            <div className="space-y-4">
              <p className="text-sm text-muted text-center">
                Enter the 6-digit code from your authenticator app or email.
              </p>
              <div className="relative">
                <input
                  id="twofa"
                  name="twofa"
                  type="text"
                  required
                  autoFocus
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="peer w-full px-4 pt-6 pb-3 bg-surface text-primary border border-light rounded-md shadow-sm outline-none focus:ring-2 focus:ring-accent focus:border-accent placeholder-transparent transition-all text-center text-lg tracking-widest"
                  placeholder=" "
                />
                <label
                  htmlFor="twofa"
                  className="absolute left-4 top-2 text-sm text-muted transition-all 
                             peer-focus:text-xs peer-focus:text-secondary peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-placeholder-shown:text-disabled"
                >
                  Authentication Code
                </label>
              </div>
              
              {/* Trust Device Option */}
              <label className="flex items-center space-x-2 cursor-pointer text-sm text-muted">
                <input
                  type="checkbox"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  className="w-4 h-4 text-primary bg-surface border-strong rounded focus:ring-accent focus:ring-2"
                />
                <span>Trust this device for 30 days</span>
              </label>
            </div>
          )}

          {error && (
            <div className="text-error text-sm text-center bg-error-light border border-error/20 rounded-md p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-primary hover:bg-secondary text-white py-3 rounded-md shadow-sm transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-2 font-medium"
          >
            {showTwoFA ? "Verify & Sign In" : "Continue"}
          </button>
          
          {showTwoFA && (
            <button
              type="button"
              onClick={() => {
                setShowTwoFA(false);
                setTwoFACode("");
                setError("");
              }}
              className="w-full text-muted hover:text-primary text-sm transition-colors"
            >
              ← Back to login
            </button>
          )}
        </form>
        
        {/* Footer Links */}
        {!showTwoFA && (
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
        )}
      </div>
    </div>
  );
}
