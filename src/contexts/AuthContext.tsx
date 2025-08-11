import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';

export interface OrgInfo {
  org_id: string;
  org_name: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  industry?: string;
  size?: string;
}

export interface User {
  userId: string;
  fullName: string;
  email: string;
  twoFactorEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  organizations: OrgInfo[];
  selectedOrg: OrgInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setSelectedOrg: (org: OrgInfo) => void;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requiresTwoFactor?: boolean; success: boolean; message?: string }>;
  logout: () => void;
  createOrganization: (orgData: any) => Promise<{ success: boolean; message?: string }>;
  validateInvite: (code: string) => Promise<{ valid: boolean; orgName?: string; role?: string; email?: string; message?: string }>;
  acceptInvite: (inviteData: any) => Promise<{ success: boolean; message?: string }>;
  setupTwoFactor: () => Promise<{ secret: string; qrCodeUrl: string }>;
  verifyTwoFactor: (token: string) => Promise<{ success: boolean; message?: string }>;
  bindDevice: (instanceId: string, fingerprint: string) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults
const API_BASE_URL = 'http://localhost:5000/api/v1';
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrgInfo[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<OrgInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!token && !!user;

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('pandaura_token');
    const storedUser = localStorage.getItem('pandaura_user');
    const storedOrgs = localStorage.getItem('pandaura_orgs');
    const storedSelectedOrg = localStorage.getItem('pandaura_selected_org');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      
      if (storedOrgs) {
        const orgs = JSON.parse(storedOrgs);
        setOrganizations(orgs);
        
        if (storedSelectedOrg) {
          setSelectedOrg(JSON.parse(storedSelectedOrg));
        } else if (orgs.length > 0) {
          setSelectedOrg(orgs[0]);
        }
      }

      // Set default auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
    setIsLoading(false);
  }, []);

  // Update localStorage when auth state changes
  useEffect(() => {
    if (token && user) {
      localStorage.setItem('pandaura_token', token);
      localStorage.setItem('pandaura_user', JSON.stringify(user));
      localStorage.setItem('pandaura_orgs', JSON.stringify(organizations));
      if (selectedOrg) {
        localStorage.setItem('pandaura_selected_org', JSON.stringify(selectedOrg));
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      localStorage.removeItem('pandaura_token');
      localStorage.removeItem('pandaura_user');
      localStorage.removeItem('pandaura_orgs');
      localStorage.removeItem('pandaura_selected_org');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token, user, organizations, selectedOrg]);

  const login = async (email: string, password: string, twoFactorToken?: string) => {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
        twoFactorToken
      });

      if (response.data.requiresTwoFactor) {
        return { requiresTwoFactor: true, success: false, message: response.data.message };
      }

      const { token: newToken, userId, orgId, role, orgName, organizations: userOrgs } = response.data;
      
      setToken(newToken);
      setUser({
        userId,
        fullName: '', // Will be updated when we fetch user details
        email,
        twoFactorEnabled: false // Will be updated when we fetch user details
      });

      const formattedOrgs = userOrgs.map((org: any) => ({
        org_id: org.org_id,
        org_name: org.org_name,
        role: org.role,
        industry: org.industry,
        size: org.size
      }));

      setOrganizations(formattedOrgs);
      
      // Set selected org to the primary one from login
      const primaryOrg = formattedOrgs.find((org: OrgInfo) => org.org_id === orgId) || formattedOrgs[0];
      setSelectedOrg(primaryOrg);

      return { success: true, message: 'Login successful' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setSelectedOrg(null);
  };

  const createOrganization = async (orgData: {
    orgName: string;
    industry: string;
    size: string;
    fullName: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await axios.post('/auth/orgs', orgData);
      
      const { token: newToken, userId, orgId, role } = response.data;
      
      setToken(newToken);
      setUser({
        userId,
        fullName: orgData.fullName,
        email: orgData.email,
        twoFactorEnabled: false
      });

      const newOrg: OrgInfo = {
        org_id: orgId,
        org_name: orgData.orgName,
        role: role as 'Admin' | 'Editor' | 'Viewer',
        industry: orgData.industry,
        size: orgData.size
      };

      setOrganizations([newOrg]);
      setSelectedOrg(newOrg);

      return { success: true, message: 'Organization created successfully' };
    } catch (error: any) {
      console.error('Create organization error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to create organization' 
      };
    }
  };

  const validateInvite = async (code: string) => {
    try {
      const response = await axios.get(`/auth/invites/validate?code=${code}`);
      return {
        valid: response.data.valid,
        orgName: response.data.orgName,
        role: response.data.role,
        email: response.data.email
      };
    } catch (error: any) {
      console.error('Validate invite error:', error);
      return { 
        valid: false, 
        message: error.response?.data?.error || 'Invalid invite code' 
      };
    }
  };

  const acceptInvite = async (inviteData: {
    code: string;
    fullName: string;
    email: string;
    password: string;
  }) => {
    try {
      const response = await axios.post('/auth/invites/accept', inviteData);
      
      const { token: newToken, userId, orgId, role } = response.data;
      
      setToken(newToken);
      setUser({
        userId,
        fullName: inviteData.fullName,
        email: inviteData.email,
        twoFactorEnabled: false
      });

      // Fetch user's organizations
      const orgsResponse = await axios.get(`/auth/users/${userId}/orgs`, {
        headers: { Authorization: `Bearer ${newToken}` }
      });

      const formattedOrgs = orgsResponse.data.map((org: any) => ({
        org_id: org.org_id,
        org_name: org.org_name,
        role: org.role,
        industry: org.industry,
        size: org.size
      }));

      setOrganizations(formattedOrgs);
      const primaryOrg = formattedOrgs.find((org: OrgInfo) => org.org_id === orgId) || formattedOrgs[0];
      setSelectedOrg(primaryOrg);

      return { success: true, message: 'Successfully joined organization' };
    } catch (error: any) {
      console.error('Accept invite error:', error);
      return { 
        success: false, 
        message: error.response?.data?.error || 'Failed to accept invite' 
      };
    }
  };

  const setupTwoFactor = async () => {
    const response = await axios.post('/auth/setup-2fa');
    return {
      secret: response.data.secret,
      qrCodeUrl: response.data.otpauth_url
    };
  };

  const verifyTwoFactor = async (token: string) => {
    try {
      await axios.post('/auth/verify-2fa', { token });
      if (user) {
        setUser({ ...user, twoFactorEnabled: true });
      }
      return { success: true, message: '2FA enabled successfully' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || '2FA verification failed' 
      };
    }
  };

  const bindDevice = async (instanceId: string, fingerprint: string) => {
    try {
      await axios.post('/auth/device-bind', {
        instanceId,
        deviceFingerprintHash: fingerprint
      });
      return { success: true, message: 'Device bound successfully' };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Device binding failed' 
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        organizations,
        selectedOrg,
        isAuthenticated,
        isLoading,
        setSelectedOrg,
        login,
        logout,
        createOrganization,
        validateInvite,
        acceptInvite,
        setupTwoFactor,
        verifyTwoFactor,
        bindDevice
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
