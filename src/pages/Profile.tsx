import React, { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Users, 
  CreditCard, 
  Key, 
  Shield, 
  Save,
  Upload,
  Globe,
  Bell,
  Monitor,
  Eye,
  EyeOff,
  Smartphone,
  Download,
  LogOut,
  Clock,
  AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import PandauraOrb from "../components/PandauraOrb";

interface UserProfile {
  name: string;
  email: string;
  company: string;
  timezone: string;
  language: string;
  tier: 'Individual' | 'Team' | 'Enterprise';
  lastLogin: string;
}

interface ProfilePreferences {
  defaultVendor: 'Rockwell' | 'Siemens' | 'Beckhoff';
  defaultExportFormat: 'PDF' | 'DOCX' | 'ZIP' | 'XLSX';
  documentBranding: boolean;
  aiVerbosity: 'Brief' | 'Detailed' | 'Verbose';
  defaultModule: string;
  codeFontSize: number;
  notifications: {
    system: boolean;
    aiUpdates: boolean;
    docGeneration: boolean;
  };
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, organizations, selectedOrg, logout, isAuthenticated, isLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [showPassword, setShowPassword] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/signin', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Initialize profile with real user data
  const [profile, setProfile] = useState<UserProfile>({
    name: user?.fullName || "Loading...",
    email: user?.email || "Loading...",
    company: selectedOrg?.org_name || "Loading...",
    timezone: "America/New_York",
    language: "English",
    tier: "Enterprise",
    lastLogin: "Loading..."
  });

  // Update profile when user data changes
  useEffect(() => {
    if (user && selectedOrg) {
      setProfile(prev => ({
        ...prev,
        name: user.fullName,
        email: user.email,
        company: selectedOrg.org_name || "Unknown Organization",
        tier: selectedOrg.role as 'Individual' | 'Team' | 'Enterprise' || 'Enterprise'
      }));
    }
  }, [user, selectedOrg]);

  const [preferences, setPreferences] = useState<ProfilePreferences>({
    defaultVendor: "Rockwell",
    defaultExportFormat: "PDF",
    documentBranding: true,
    aiVerbosity: "Detailed",
    defaultModule: "Logic Studio",
    codeFontSize: 14,
    notifications: {
      system: true,
      aiUpdates: true,
      docGeneration: false
    }
  });

  const [teamMembers] = useState([
    { name: "Sarah Johnson", email: "sarah@example.com", role: "Admin", lastActive: "2 hours ago" },
    { name: "Mike Davis", email: "mike@example.com", role: "Engineer", lastActive: "1 day ago" },
    { name: "Lisa Chen", email: "lisa@example.com", role: "Viewer", lastActive: "3 days ago" }
  ]);

  const [apiKeys] = useState([
    { name: "Production API", created: "Jul 15, 2025", lastUsed: "Aug 4, 2025", key: "pk_live_..." },
    { name: "Development API", created: "Jun 22, 2025", lastUsed: "Aug 2, 2025", key: "pk_test_..." }
  ]);

  const handleSave = (section: string) => {
    console.log(`Saving ${section} changes`);
    alert(`${section} settings saved successfully!`);
  };

  const handleBackNavigation = () => {
    // Check if there's a previous route from location state
    const previousPath = location.state?.from;
    
    if (previousPath) {
      navigate(previousPath);
    } else {
      // Try to go back in history
      const canGoBack = window.history.length > 1;
      if (canGoBack) {
        navigate(-1);
      } else {
        // Fallback to home if no history available
        navigate('/home');
      }
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="bg-white border border-light rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Profile Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({...prev, name: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({...prev, email: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Company Name</label>
            <input
              type="text"
              value={profile.company}
              onChange={(e) => setProfile(prev => ({...prev, company: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              disabled
              placeholder="Based on current organization"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Timezone</label>
            <select
              value={profile.timezone}
              onChange={(e) => setProfile(prev => ({...prev, timezone: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="America/New_York">Eastern Time (EST/EDT)</option>
              <option value="America/Chicago">Central Time (CST/CDT)</option>
              <option value="America/Denver">Mountain Time (MST/MDT)</option>
              <option value="America/Los_Angeles">Pacific Time (PST/PDT)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language</label>
            <select
              value={profile.language}
              onChange={(e) => setProfile(prev => ({...prev, language: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="English">English</option>
              <option value="Spanish">Español</option>
              <option value="German">Deutsch</option>
              <option value="French">Français</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-1">Company Logo (Optional)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-muted mx-auto mb-2" />
            <p className="text-sm text-muted">Upload PNG logo for document exports</p>
            <button className="mt-2 text-accent hover:underline text-sm">Browse Files</button>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium mb-2">Notification Preferences</h4>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked className="accent-primary" />
              <span className="text-sm">System alerts and maintenance notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked className="accent-primary" />
              <span className="text-sm">AI model updates and new features</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-primary" />
              <span className="text-sm">Document generation completion alerts</span>
            </label>
          </div>
        </div>

        <button
          onClick={() => handleSave('Profile')}
          className="mt-6 bg-primary text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      {/* Organization & Account Details */}
      <div className="bg-white border border-light rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Organization & Account Details</h3>
          {organizations.length > 1 && (
            <span className="text-xs text-muted bg-blue-50 px-2 py-1 rounded">
              {organizations.length} organizations
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <label className="block text-sm font-medium text-blue-900 mb-2">Current Organization</label>
              <p className="text-lg font-semibold text-blue-900">{selectedOrg?.org_name || 'Loading...'}</p>
              <p className="text-sm text-blue-700 mt-1">{selectedOrg?.industry || 'Industry not specified'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-2">Your Role & Permissions</label>
              <div className="flex items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                  selectedOrg?.role === 'Admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                  selectedOrg?.role === 'Editor' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                  selectedOrg?.role === 'Viewer' ? 'bg-green-100 text-green-800 border border-green-200' :
                  'bg-gray-100 text-gray-800 border border-gray-200'
                }`}>
                  {selectedOrg?.role || 'Loading...'}
                </span>
                <span className="text-sm text-muted">
                  {selectedOrg?.role === 'Admin' ? 'Full system access' :
                   selectedOrg?.role === 'Editor' ? 'Create & modify content' :
                   selectedOrg?.role === 'Viewer' ? 'View-only access' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Account Security</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user?.twoFactorEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${user?.twoFactorEnabled ? 'text-green-700' : 'text-red-700'}`}>
                      {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account ID</span>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {user?.userId?.substring(0, 8) || '...'}
                  </code>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted mb-1">Organization Details</label>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Size:</span>
                  <span className="font-medium">{selectedOrg?.size || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">License:</span>
                  <span className="font-medium">On-Premise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Multiple Organizations */}
        {organizations && organizations.length > 1 && (
          <div className="mt-6 pt-6 border-t border-light">
            <h4 className="text-sm font-medium mb-3">Your Organizations ({organizations.length})</h4>
            <div className="space-y-2">
              {organizations.map((org) => (
                <div key={org.org_id} className={`p-3 rounded-lg border ${
                  org.org_id === selectedOrg?.org_id ? 'border-accent bg-accent/5' : 'border-light'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{org.org_name}</p>
                      <p className="text-sm text-muted">{org.industry || 'Industry not specified'}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                        org.role === 'Admin' ? 'bg-red-100 text-red-700' :
                        org.role === 'Editor' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {org.role}
                      </span>
                      {org.org_id === selectedOrg?.org_id && (
                        <p className="text-xs text-accent mt-1">Current</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="bg-white border border-light rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Platform Preferences</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-1">Default PLC Vendor</label>
            <select
              value={preferences.defaultVendor}
              onChange={(e) => setPreferences(prev => ({...prev, defaultVendor: e.target.value as any}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Rockwell">Rockwell Automation</option>
              <option value="Siemens">Siemens</option>
              <option value="Beckhoff">Beckhoff</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Default Export Format</label>
            <select
              value={preferences.defaultExportFormat}
              onChange={(e) => setPreferences(prev => ({...prev, defaultExportFormat: e.target.value as any}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="PDF">PDF</option>
              <option value="DOCX">Microsoft Word (DOCX)</option>
              <option value="ZIP">ZIP Bundle</option>
              <option value="XLSX">Excel (XLSX)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">AI Assistant Behavior</label>
            <select
              value={preferences.aiVerbosity}
              onChange={(e) => setPreferences(prev => ({...prev, aiVerbosity: e.target.value as any}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Brief">Brief replies</option>
              <option value="Detailed">Detailed explanations</option>
              <option value="Verbose">Verbose with examples</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Default Module on Login</label>
            <select
              value={preferences.defaultModule}
              onChange={(e) => setPreferences(prev => ({...prev, defaultModule: e.target.value}))}
              className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Pandaura AS">Pandaura AS</option>
              <option value="Logic Studio">Logic Studio</option>
              <option value="AutoDocs">AutoDocs</option>
              <option value="Tag Database Manager">Tag Database Manager</option>
              <option value="Projects">Projects</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.documentBranding}
              onChange={(e) => setPreferences(prev => ({...prev, documentBranding: e.target.checked}))}
              className="accent-primary"
            />
            <span className="text-sm">Include company branding on exported documents</span>
          </label>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium mb-2">Code Editor Font Size</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10"
              max="20"
              value={preferences.codeFontSize}
              onChange={(e) => setPreferences(prev => ({...prev, codeFontSize: parseInt(e.target.value)}))}
              className="flex-1"
            />
            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
              {preferences.codeFontSize}px
            </span>
          </div>
        </div>

        <button
          onClick={() => handleSave('Preferences')}
          className="mt-6 bg-primary text-white px-6 py-2 rounded flex items-center gap-2 hover:bg-secondary transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );

  const renderTeamSettings = () => (
    <div className="space-y-6">
      <div className="bg-white border border-light rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Team Management</h3>
          <span className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded">
            Enterprise Plan
          </span>
        </div>

        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2">Invite New Member</h4>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Enter email address..."
              className="flex-1 border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select className="border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="Engineer">Engineer</option>
              <option value="Admin">Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
            <button className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary transition-colors">
              Invite
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Team Members (3/10 seats used)</h4>
          <div className="space-y-2">
            {teamMembers.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium text-sm">{member.name}</div>
                  <div className="text-xs text-muted">{member.email}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted">{member.lastActive}</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {member.role}
                  </span>
                  <button className="text-muted hover:text-red-500">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white border border-light rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Security & Authentication</h3>
        
        <div className="space-y-6">
          {/* Password Change */}
          <div>
            <h4 className="text-sm font-medium mb-2">Change Password</h4>
            <div className="space-y-3 max-w-md">
              <input
                type="password"
                placeholder="Current password"
                className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="password"
                placeholder="New password"
                className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                className="w-full border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary transition-colors">
                Update Password
              </button>
            </div>
          </div>

          {/* 2FA Setup */}
          <div>
            <h4 className="text-sm font-medium mb-2">Two-Factor Authentication</h4>
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="text-sm">2FA is enabled via TOTP app</span>
              </div>
              <button
                onClick={() => setShow2FASetup(true)}
                className="text-sm text-green-600 hover:underline"
              >
                Manage
              </button>
            </div>
          </div>

          {/* Session Management */}
          <div>
            <h4 className="text-sm font-medium mb-2">Active Sessions</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-muted" />
                  <div>
                    <div className="text-sm font-medium">Current Session</div>
                    <div className="text-xs text-muted">Chrome on macOS • 192.168.1.100</div>
                  </div>
                </div>
                <span className="text-xs text-green-600">Active</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-muted" />
                  <div>
                    <div className="text-sm">Mobile Browser</div>
                    <div className="text-xs text-muted">Safari on iOS • 2 hours ago</div>
                  </div>
                </div>
                <button className="text-xs text-red-600 hover:underline">Terminate</button>
              </div>
            </div>
            
            <button className="mt-3 text-sm text-red-600 hover:underline">
              Sign Out Everywhere
            </button>
          </div>

          {/* Session Timeout */}
          <div>
            <h4 className="text-sm font-medium mb-2">Session Timeout</h4>
            <select className="border border-light rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent">
              <option value="30">30 minutes</option>
              <option value="120">2 hours</option>
              <option value="480">8 hours</option>
              <option value="never">Never</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderApiKeys = () => (
    <div className="space-y-6">
      <div className="bg-white border border-light rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">API Keys</h3>
          <button className="bg-primary text-white px-4 py-2 rounded text-sm hover:bg-secondary transition-colors">
            Generate New Key
          </button>
        </div>

        <div className="space-y-3">
          {apiKeys.map((key, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-light rounded">
              <div>
                <div className="font-medium text-sm">{key.name}</div>
                <div className="text-xs text-muted">Created: {key.created} • Last used: {key.lastUsed}</div>
                <div className="text-xs font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                  {key.key}••••••••••••••••
                </div>
              </div>
              <div className="flex gap-2">
                <button className="text-sm text-muted hover:text-primary">Regenerate</button>
                <button className="text-sm text-red-600 hover:text-red-700">Revoke</button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <strong>On-Premise Security:</strong> API keys are stored locally and encrypted. 
              All API calls are processed within your network infrastructure.
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    ...(profile.tier !== 'Individual' ? [{ id: 'team', label: 'Team Settings', icon: Users }] : []),
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'security', label: 'Security / 2FA', icon: Shield }
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Show loading state if auth is still loading or user data isn't available */}
      {(isLoading || !user) ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted">Loading profile...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Profile Header */}
          <header className="bg-white border-b border-light px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBackNavigation}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center gap-2 text-muted hover:text-primary"
                  title="Go back"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="text-sm">Back</span>
                </button>
                
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {profile.name ? profile.name.split(' ').map(n => n[0]).join('') : '??'}
                </div>
                <div>
                  <h1 className="text-xl font-bold">{profile.name}</h1>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      selectedOrg?.role === 'Admin' ? 'bg-red-100 text-red-700' :
                      selectedOrg?.role === 'Editor' ? 'bg-blue-100 text-blue-700' :
                      selectedOrg?.role === 'Viewer' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedOrg?.role || profile.tier}
                    </span>
                    {selectedOrg?.org_name && (
                      <span>@ {selectedOrg.org_name}</span>
                    )}
                    <span>•</span>
                    <span>Last login: {profile.lastLogin}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="text-sm text-muted hover:text-primary">Edit Profile</button>
                <button 
                  onClick={() => {
                    logout();
                    navigate('/signin');
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-light p-4">
          <div className="space-y-1">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${
                    activeTab === item.id 
                      ? 'bg-accent-light text-accent' 
                      : 'text-muted hover:text-primary hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'preferences' && renderPreferences()}
          {activeTab === 'team' && renderTeamSettings()}
          {activeTab === 'security' && renderSecurity()}
          {activeTab === 'api' && renderApiKeys()}
          {activeTab === 'billing' && (
            <div className="bg-white border border-light rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium mb-2">Billing & Plan Management</h3>
              <p className="text-muted mb-4">On-premise deployments use local license management</p>
              <div className="text-sm text-left max-w-md mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Current Role:</span>
                    <span className="font-medium">{selectedOrg?.role || profile.tier}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Organization:</span>
                    <span className="font-medium">{selectedOrg?.org_name || 'Loading...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>License Type:</span>
                    <span className="font-medium">On-Premise</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Access Level:</span>
                    <span className="font-medium">
                      {selectedOrg?.role === 'Admin' ? 'Full Access' :
                       selectedOrg?.role === 'Editor' ? 'Edit & View' :
                       selectedOrg?.role === 'Viewer' ? 'View Only' : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
        </>
      )}
      <PandauraOrb />
    </div>
  );
}