import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authStorage } from '../../utils/authStorage';

const AuthDebugPanel: React.FC = () => {
  const { user, token, isAuthenticated, isLoading, organizations, selectedOrg } = useAuth();

  const handleTestCookies = () => {
    console.log('🧪 Manual cookie test started');
    
    // Test setting a cookie
    authStorage.setToken('test-token-123');
    authStorage.setUser({ userId: 'test', email: 'test@example.com', fullName: 'Test User', twoFactorEnabled: false });
    
    // Test getting a cookie
    const retrievedToken = authStorage.getToken();
    const retrievedUser = authStorage.getUser();
    
    console.log('🧪 Cookie test results:', {
      setToken: 'test-token-123',
      retrievedToken,
      setUser: { email: 'test@example.com' },
      retrievedUser,
      hasAuthData: authStorage.hasAuthData()
    });
    
    // Clean up test data
    authStorage.clearAll();
    
    // Force component re-render to see updated values
    window.location.reload();
  };

  const handleSimulateAuth = () => {
    console.log('🧪 Simulating authentication...');
    
    // Simulate a successful authentication
    authStorage.setToken('mock-jwt-token-12345');
    authStorage.setUser({
      userId: 'mock-user-123',
      email: 'test@pandaura.com',
      fullName: 'Test User',
      twoFactorEnabled: false
    });
    authStorage.setOrganizations([{
      org_id: 'mock-org-123',
      org_name: 'Test Organization',
      role: 'Admin',
      industry: 'Manufacturing',
      size: '50-100'
    }]);
    authStorage.setSelectedOrg({
      org_id: 'mock-org-123',
      org_name: 'Test Organization',
      role: 'Admin',
      industry: 'Manufacturing',
      size: '50-100'
    });
    
    console.log('🧪 Mock auth data set, check if context updates...');
    
    // Force a page refresh to see if it persists
    setTimeout(() => {
      console.log('🧪 Refreshing page to test persistence...');
      window.location.reload();
    }, 2000);
  };
  
  const handleClearCookies = () => {
    console.log('🧪 Clearing all cookies...');
    authStorage.clearAll();
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Auth Debug Panel</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Context State:</strong><br/>
        isLoading: {isLoading.toString()}<br/>
        isAuthenticated: {isAuthenticated.toString()}<br/>
        hasToken: {(!!token).toString()}<br/>
        hasUser: {(!!user).toString()}<br/>
        userEmail: {user?.email || 'none'}<br/>
      </div>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Cookie State:</strong><br/>
        cookieToken: {authStorage.getToken() ? 'present' : 'none'}<br/>
        cookieUser: {authStorage.getUser()?.email || 'none'}<br/>
        hasAuthData: {authStorage.hasAuthData().toString()}<br/>
      </div>
      
      <button 
        onClick={handleTestCookies}
        style={{
          padding: '5px 10px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          marginRight: '5px'
        }}
      >
        Test Cookies
      </button>
      
      <button 
        onClick={handleSimulateAuth}
        style={{
          padding: '5px 10px',
          background: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px',
          marginRight: '5px'
        }}
      >
        Simulate Auth
      </button>
      
      <button 
        onClick={handleClearCookies}
        style={{
          padding: '5px 10px',
          background: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Clear All
      </button>
    </div>
  );
};

export default AuthDebugPanel;
