import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import axios from 'axios';
import { authStorage } from '../utils/authStorage';

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
  setSelectedOrg: (org: OrgInfo | null) => void;
  login: (email: string, password: string, twoFactorToken?: string) => Promise<{ requiresTwoFactor?: boolean; success: boolean; message?: string }>;
  logout: () => void;
  createOrganization: (orgData: any) => Promise<{ success: boolean; message?: string }>;
  validateInvite: (code: string) => Promise<{ valid: boolean; orgName?: string; role?: string; email?: string; message?: string }>;
  acceptInvite: (inviteData: any) => Promise<{ success: boolean; message?: string }>;
  setupTwoFactor: () => Promise<{ secret: string; qrCodeUrl: string }>;
  verifyTwoFactor: (token: string) => Promise<{ success: boolean; message?: string }>;
  bindDevice: (instanceId: string, fingerprint: string) => Promise<{ success: boolean; message?: string }>;
}

import { config } from '../config/environment';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configure axios defaults using environment-aware config
const API_BASE_URL = `${config.apiBaseUrl}/api/v1`;
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<OrgInfo[]>([]);
  const [selectedOrgState, setSelectedOrgState] = useState<OrgInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const isAuthenticated = !!token && !!user;

  // Custom setSelectedOrg that also persists to cookies
  const setSelectedOrg = (org: OrgInfo | null) => {
    setSelectedOrgState(org);
    if (org) {
      authStorage.setSelectedOrg(org);
    } else {
      authStorage.removeSelectedOrg();
    }
  };

  // Debug authentication state changes
  useEffect(() => {
    console.log('🔍 AuthContext: Authentication state changed:', {
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userEmail: user?.email,
      isLoading
    });
  }, [isAuthenticated, token, user, isLoading]);

  // Set axios auth header when token changes
  useEffect(() => {
    console.log('🔍 AuthContext: Token effect triggered, token:', token ? `${token.substring(0, 10)}...` : 'null', 'isInitialized:', isInitialized);
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Persist token to cookies
      console.log('🔍 AuthContext: Setting token to cookies...');
      authStorage.setToken(token);
    } else if (isInitialized) {
      // Only remove token from cookies if we're not in the initialization phase
      delete axios.defaults.headers.common['Authorization'];
      console.log('🔍 AuthContext: Removing token from cookies (post-initialization)...');
      authStorage.removeToken();
    } else {
      // During initialization, just remove the header but don't touch cookies yet
      delete axios.defaults.headers.common['Authorization'];
      console.log('🔍 AuthContext: Removing auth header only (during initialization)...');
    }
  }, [token, isInitialized]);

  // Initialize authentication state from cookies
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    console.log('🔍 AuthContext: Starting initialization...');
    const storedToken = authStorage.getToken();
    const storedUser = authStorage.getUser();
    const storedOrgs = authStorage.getOrganizations();
    const storedSelectedOrg = authStorage.getSelectedOrg();

    console.log('🔍 AuthContext: Raw cookie data:', {
      storedToken,
      storedUser,
      storedOrgs,
      storedSelectedOrg
    });

    console.log('🔍 AuthContext: Stored data analysis:', {
      hasToken: !!storedToken,
      hasUser: !!storedUser,
      hasOrgs: storedOrgs && storedOrgs.length > 0,
      hasSelectedOrg: !!storedSelectedOrg,
      tokenPrefix: storedToken ? `${storedToken.substring(0, 10)}...` : 'none',
      userEmail: storedUser?.email || 'none'
    });

    if (storedToken && storedUser) {
      try {
        console.log('🔍 AuthContext: Attempting to restore authentication state...');
        
        // Only set state if component is still mounted
        if (isMounted) {
          console.log('🔍 AuthContext: Setting user state...');
          setUser(storedUser);
          
          console.log('🔍 AuthContext: Setting token state...');
          setToken(storedToken);
          
          if (storedOrgs && storedOrgs.length > 0) {
            console.log('🔍 AuthContext: Setting organizations state...');
            setOrganizations(storedOrgs);
          }
          
          if (storedSelectedOrg) {
            console.log('🔍 AuthContext: Setting selected org state...');
            setSelectedOrgState(storedSelectedOrg);
          }
          
          console.log('🔍 AuthContext: State restoration complete');
        }
        
        console.log('🔍 AuthContext: Authentication state restored successfully', {
          userEmail: storedUser.email,
          userId: storedUser.userId,
          isAuthenticated: !!(storedToken && storedUser)
        });
      } catch (error) {
        console.error('❌ Failed to restore auth state:', error);
        // Clear corrupted data only if still mounted
        if (isMounted) {
          console.log('🧹 Clearing corrupted auth data...');
          authStorage.clearAll();
        }
      }
    } else {
      console.log('🔍 AuthContext: No stored authentication data found', {
        missingToken: !storedToken,
        missingUser: !storedUser
      });
    }
    
    // Set loading to false only after attempting to restore auth state and if still mounted
    if (isMounted) {
      console.log('🔍 AuthContext: Setting loading to false and marking as initialized');
      setIsLoading(false);
      setIsInitialized(true);
    }

    return () => {
      console.log('🔍 AuthContext: Cleanup called');
      isMounted = false; // Cleanup function to prevent state updates
    };
  }, []); // Remove dependencies to prevent re-initialization

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

      const { 
        token: newToken, 
        userId, 
        fullName, 
        email: userEmail, 
        twoFactorEnabled, 
        orgId, 
        role, 
        orgName, 
        organizations: userOrgs 
      } = response.data;
      
      // Set token first
      setToken(newToken);
      
      // Set user data and persist to cookies
      const userData = {
        userId,
        fullName: fullName || '',
        email: userEmail || email,
        twoFactorEnabled: twoFactorEnabled || false
      };
      setUser(userData);
      authStorage.setUser(userData);

      // Format and set organizations data
      const formattedOrgs = userOrgs.map((org: any) => ({
        org_id: org.org_id,
        org_name: org.org_name,
        role: org.role,
        industry: org.industry,
        size: org.size
      }));

      setOrganizations(formattedOrgs);
      authStorage.setOrganizations(formattedOrgs);
      
      // Set selected org to the primary one from login response
      const primaryOrg = formattedOrgs.find((org: OrgInfo) => org.org_id === orgId) || formattedOrgs[0];
      setSelectedOrgState(primaryOrg);
      authStorage.setSelectedOrg(primaryOrg);

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
    console.log('🔍 AuthContext: Logging out user');
    setToken(null);
    setUser(null);
    setOrganizations([]);
    setSelectedOrgState(null);
    
    // Clear all auth cookies
    authStorage.clearAll();
    
    console.log('🔍 AuthContext: Logout complete, cookies cleared');
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
      
      // Set token first
      setToken(newToken);
      
      // Set user data
      const userData = {
        userId,
        fullName: orgData.fullName,
        email: orgData.email,
        twoFactorEnabled: false
      };
      setUser(userData);

      // Create organization data
      const newOrg: OrgInfo = {
        org_id: orgId,
        org_name: orgData.orgName,
        role: role as 'Admin' | 'Editor' | 'Viewer',
        industry: orgData.industry,
        size: orgData.size
      };

      setOrganizations([newOrg]);
      setSelectedOrgState(newOrg);

      // Persist user data to cookies
      authStorage.setUser(userData);
      authStorage.setOrganizations([newOrg]);
      authStorage.setSelectedOrg(newOrg);

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
      
      // Set token first
      setToken(newToken);
      
      // Set basic user data
      const userData = {
        userId,
        fullName: inviteData.fullName,
        email: inviteData.email,
        twoFactorEnabled: false
      };
      setUser(userData);

      // Fetch complete user's organizations data
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
      
      // Set selected org to the primary one from invite
      const primaryOrg = formattedOrgs.find((org: OrgInfo) => org.org_id === orgId) || formattedOrgs[0];
      setSelectedOrgState(primaryOrg);

      // Persist data to cookies
      authStorage.setUser(userData);
      authStorage.setOrganizations(formattedOrgs);
      authStorage.setSelectedOrg(primaryOrg);

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
    try {
      // Ensure we have a current token - use cookies instead of localStorage
      const currentToken = token || authStorage.getToken();
      if (!currentToken) {
        throw new Error('No authentication token available');
      }

      const response = await axios.post('/auth/setup-2fa', {}, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        }
      });
      return {
        secret: response.data.secret,
        qrCodeUrl: response.data.qrCode || response.data.otpauth_url
      };
    } catch (error: any) {
      console.error('Setup 2FA error:', error);
      throw new Error(error.response?.data?.error || 'Failed to setup 2FA');
    }
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
        selectedOrg: selectedOrgState,
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
