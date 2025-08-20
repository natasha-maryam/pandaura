import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authStorage } from '../utils/authStorage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function ProtectedRoute({ children, redirectTo = '/signin' }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const navigate = useNavigate();
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    console.log('🛡️ ProtectedRoute: Auth check started', {
      isLoading,
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      userEmail: user?.email,
      redirectTo,
      currentPath: window.location.pathname,
      cookies_token: !!authStorage.getToken(),
      cookies_user: !!authStorage.getUser(),
      hasInitialized,
      timestamp: new Date().toISOString()
    });

    // Check cookies directly for debugging
    const cookieToken = authStorage.getToken();
    const cookieUser = authStorage.getUser();
    console.log('🛡️ ProtectedRoute: Direct cookie check:', {
      cookieToken: cookieToken ? `${cookieToken.substring(0, 10)}...` : null,
      cookieUser: cookieUser ? cookieUser.email : null,
      cookieHasAuthData: authStorage.hasAuthData()
    });
    
    // Only set initialized to true when loading is complete
    if (!isLoading && !hasInitialized) {
      console.log('🛡️ ProtectedRoute: Setting initialization complete');
      setHasInitialized(true);
    }
    
    // Handle redirect logic only after initialization is complete
    if (!isLoading && hasInitialized && !isAuthenticated) {
      console.log('🛡️ ProtectedRoute: Not authenticated after initialization, starting redirect timer');
      
      // Add a small delay to ensure auth context has time to restore from cookies
      const timeoutId = setTimeout(() => {
        // Check cookies one more time before redirecting
        const hasStoredAuth = authStorage.hasAuthData();
        const finalCookieCheck = {
          token: authStorage.getToken(),
          user: authStorage.getUser(),
          hasAuthData: hasStoredAuth
        };
        
        console.log('🛡️ ProtectedRoute: Final check before redirect:', {
          isAuthenticated,
          hasStoredAuth,
          finalCookieCheck,
          contextState: { hasToken: !!token, hasUser: !!user }
        });
        
        if (!isAuthenticated && !hasStoredAuth) {
          console.log('🚨 ProtectedRoute: Redirecting to signin - final auth check failed', {
            reason: !token ? 'No token' : !user ? 'No user' : 'Unknown',
            hasCookieToken: !!authStorage.getToken(),
            hasCookieUser: !!authStorage.getUser(),
            redirectingTo: redirectTo
          });
          navigate(redirectTo, { replace: true });
        } else if (!isAuthenticated && hasStoredAuth) {
          console.log('🤔 ProtectedRoute: Cookies have auth data but context does not - potential race condition');
          // Give it a bit more time for the context to catch up
          setTimeout(() => {
            if (!isAuthenticated) {
              console.log('🚨 ProtectedRoute: Context still not updated, forcing redirect');
              navigate(redirectTo, { replace: true });
            }
          }, 500);
        }
      }, 300); // Increased delay to 300ms for better reliability
      
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
