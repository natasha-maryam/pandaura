import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/signin' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Auth check', {
      isLoading,
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userEmail: user?.email,
      redirectTo,
      currentPath: window.location.pathname,
      localStorage_token: !!localStorage.getItem('authToken'),
      localStorage_user: !!localStorage.getItem('authUser'),
      hasInitialized
    });
    
    // Only set initialized to true when loading is complete AND we have auth data or no auth data
    if (!isLoading && !hasInitialized) {
      console.log('🛡️ ProtectedRoute: Authentication initialization complete');
      setHasInitialized(true);
    }
    
    // Add a small delay to ensure auth context has time to restore from localStorage
    if (!isLoading && hasInitialized && !isAuthenticated) {
      const timeoutId = setTimeout(() => {
        // Double-check authentication after a brief delay
        if (!isAuthenticated) {
          console.log('🚨 ProtectedRoute: Redirecting to signin - not authenticated after delay', {
            reason: !token ? 'No token' : !user ? 'No user' : 'Unknown',
            hasLocalToken: !!localStorage.getItem('authToken'),
            hasLocalUser: !!localStorage.getItem('authUser')
          });
          navigate(redirectTo, { replace: true });
        }
      }, 100); // 100ms delay
      
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading, isAuthenticated, navigate, redirectTo, token, user, hasInitialized]);

  // Show loading while checking authentication - ensure enough time for auth to initialize
  if (isLoading || !hasInitialized) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted">
            {isLoading ? 'Loading authentication...' : 'Initializing...'}
          </p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
