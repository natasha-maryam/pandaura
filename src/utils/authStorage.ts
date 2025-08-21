import Cookies from 'js-cookie';

// Cookie names
const AUTH_TOKEN_COOKIE = 'pandaura_auth_token';
const AUTH_USER_COOKIE = 'pandaura_auth_user';
const AUTH_ORGS_COOKIE = 'pandaura_auth_orgs';
const AUTH_SELECTED_ORG_COOKIE = 'pandaura_auth_selected_org';
const AUTH_LOGIN_TIME_COOKIE = 'pandaura_auth_login_time';

// Cookie options - expires in 30 days
const cookieOptions = {
  expires: 30, // 30 days
  secure: false, // Allow non-HTTPS for development
  sameSite: 'lax' as const, // More permissive for development
  path: '/'
};

console.log('🍪 AuthStorage: Cookie options configured:', cookieOptions);

export const SESSION_EXPIRY_HOURS = 24;
export const authStorage = {
  // Token storage
  setToken: (token: string) => {
    console.log('🍪 AuthStorage: Setting token cookie');
    Cookies.set(AUTH_TOKEN_COOKIE, token, cookieOptions);
    // Set login time when token is set
    Cookies.set(AUTH_LOGIN_TIME_COOKIE, Date.now().toString(), cookieOptions);
    console.log('🍪 AuthStorage: Token cookie set, verifying...', !!Cookies.get(AUTH_TOKEN_COOKIE));
  },
  
  getToken: (): string | null => {
    const token = Cookies.get(AUTH_TOKEN_COOKIE) || null;
    console.log('🍪 AuthStorage: Getting token cookie:', token ? `${token.substring(0, 10)}...` : 'null');
    return token;
  },
  
  removeToken: () => {
    console.log('🍪 AuthStorage: Removing token cookie');
    Cookies.remove(AUTH_TOKEN_COOKIE, { path: '/' });
    Cookies.remove(AUTH_LOGIN_TIME_COOKIE, { path: '/' });
  },

  // User storage
  setUser: (user: any) => {
    console.log('🍪 AuthStorage: Setting user cookie', user.email);
    Cookies.set(AUTH_USER_COOKIE, JSON.stringify(user), cookieOptions);
    console.log('🍪 AuthStorage: User cookie set, verifying...', !!Cookies.get(AUTH_USER_COOKIE));
  },
  
  getUser: (): any | null => {
    const userCookie = Cookies.get(AUTH_USER_COOKIE);
    if (!userCookie) {
      console.log('🍪 AuthStorage: No user cookie found');
      return null;
    }
    
    try {
      const user = JSON.parse(userCookie);
      console.log('🍪 AuthStorage: Getting user cookie:', user.email);
      return user;
    } catch (error) {
      console.error('🍪 AuthStorage: Failed to parse user cookie:', error);
      return null;
    }
  },
  
  removeUser: () => {
    console.log('🍪 AuthStorage: Removing user cookie');
    Cookies.remove(AUTH_USER_COOKIE, { path: '/' });
  },

  // Organizations storage
  setOrganizations: (orgs: any[]) => {
    console.log('🍪 AuthStorage: Setting organizations cookie', orgs.length, 'orgs');
    Cookies.set(AUTH_ORGS_COOKIE, JSON.stringify(orgs), cookieOptions);
  },
  
  getOrganizations: (): any[] => {
    const orgsCookie = Cookies.get(AUTH_ORGS_COOKIE);
    if (!orgsCookie) {
      console.log('🍪 AuthStorage: No organizations cookie found');
      return [];
    }
    
    try {
      const orgs = JSON.parse(orgsCookie);
      console.log('🍪 AuthStorage: Getting organizations cookie:', orgs.length, 'orgs');
      return orgs;
    } catch (error) {
      console.error('🍪 AuthStorage: Failed to parse organizations cookie:', error);
      return [];
    }
  },
  
  removeOrganizations: () => {
    console.log('🍪 AuthStorage: Removing organizations cookie');
    Cookies.remove(AUTH_ORGS_COOKIE, { path: '/' });
  },

  // Selected organization storage
  setSelectedOrg: (org: any) => {
    console.log('🍪 AuthStorage: Setting selected org cookie', org.org_name);
    Cookies.set(AUTH_SELECTED_ORG_COOKIE, JSON.stringify(org), cookieOptions);
  },
  
  getSelectedOrg: (): any | null => {
    const orgCookie = Cookies.get(AUTH_SELECTED_ORG_COOKIE);
    if (!orgCookie) {
      console.log('🍪 AuthStorage: No selected org cookie found');
      return null;
    }
    
    try {
      const org = JSON.parse(orgCookie);
      console.log('🍪 AuthStorage: Getting selected org cookie:', org.org_name);
      return org;
    } catch (error) {
      console.error('🍪 AuthStorage: Failed to parse selected org cookie:', error);
      return null;
    }
  },
  
  removeSelectedOrg: () => {
    console.log('🍪 AuthStorage: Removing selected org cookie');
    Cookies.remove(AUTH_SELECTED_ORG_COOKIE, { path: '/' });
  },

  // Clear all auth data
  clearAll: () => {
    console.log('🍪 AuthStorage: Clearing all auth cookies');
    Cookies.remove(AUTH_TOKEN_COOKIE, { path: '/' });
    Cookies.remove(AUTH_USER_COOKIE, { path: '/' });
    Cookies.remove(AUTH_ORGS_COOKIE, { path: '/' });
    Cookies.remove(AUTH_SELECTED_ORG_COOKIE, { path: '/' });
    Cookies.remove(AUTH_LOGIN_TIME_COOKIE, { path: '/' });
    console.log('🍪 AuthStorage: All cookies cleared');
  },

  // Check if user is authenticated
  hasAuthData: (): boolean => {
    const token = Cookies.get(AUTH_TOKEN_COOKIE);
    const user = Cookies.get(AUTH_USER_COOKIE);
    const loginTime = Cookies.get(AUTH_LOGIN_TIME_COOKIE);
    let expired = false;
    if (loginTime) {
      const loginTimestamp = parseInt(loginTime, 10);
      const now = Date.now();
      const diffHours = (now - loginTimestamp) / (1000 * 60 * 60);
      expired = diffHours > SESSION_EXPIRY_HOURS;
    }
    const hasAuth = !!(token && user) && !expired;
    console.log('🍪 AuthStorage: Checking auth data:', { hasToken: !!token, hasUser: !!user, expired, hasAuth });
    return hasAuth;
  },

  isSessionExpired: (): boolean => {
    const loginTime = Cookies.get(AUTH_LOGIN_TIME_COOKIE);
    if (!loginTime) return true;
    const loginTimestamp = parseInt(loginTime, 10);
    const now = Date.now();
    const diffHours = (now - loginTimestamp) / (1000 * 60 * 60);
    return diffHours > SESSION_EXPIRY_HOURS;
  }
};
