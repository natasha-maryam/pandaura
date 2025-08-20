import { authStorage } from '../utils/authStorage';

// Test the auth storage functionality
export const testAuthStorage = () => {
  console.log('🧪 Testing Auth Storage with Cookies');
  
  // Test data
  const testUser = {
    userId: 'test123',
    fullName: 'Test User',
    email: 'test@example.com',
    twoFactorEnabled: false
  };
  
  const testToken = 'test-token-123';
  
  const testOrgs = [
    {
      org_id: 'org1',
      org_name: 'Test Organization',
      role: 'Admin' as const,
      industry: 'Manufacturing',
      size: '50-100'
    }
  ];

  // Test storing data
  console.log('📝 Storing test data...');
  authStorage.setToken(testToken);
  authStorage.setUser(testUser);
  authStorage.setOrganizations(testOrgs);
  authStorage.setSelectedOrg(testOrgs[0]);
  
  // Test retrieving data
  console.log('📋 Retrieving test data...');
  const retrievedToken = authStorage.getToken();
  const retrievedUser = authStorage.getUser();
  const retrievedOrgs = authStorage.getOrganizations();
  const retrievedSelectedOrg = authStorage.getSelectedOrg();
  
  console.log('🔍 Results:', {
    tokenMatch: retrievedToken === testToken,
    userMatch: JSON.stringify(retrievedUser) === JSON.stringify(testUser),
    orgsMatch: JSON.stringify(retrievedOrgs) === JSON.stringify(testOrgs),
    selectedOrgMatch: JSON.stringify(retrievedSelectedOrg) === JSON.stringify(testOrgs[0]),
    hasAuthData: authStorage.hasAuthData()
  });
  
  // Test clearing data
  console.log('🧹 Clearing test data...');
  authStorage.clearAll();
  
  const afterClear = {
    token: authStorage.getToken(),
    user: authStorage.getUser(),
    orgs: authStorage.getOrganizations(),
    selectedOrg: authStorage.getSelectedOrg(),
    hasAuthData: authStorage.hasAuthData()
  };
  
  console.log('🔍 After clear:', afterClear);
  
  return {
    success: retrievedToken === testToken && 
             JSON.stringify(retrievedUser) === JSON.stringify(testUser) &&
             afterClear.token === null &&
             afterClear.user === null &&
             !afterClear.hasAuthData
  };
};

// Run test if in development
if (import.meta.env.DEV) {
  // Export for manual testing in browser console
  (window as any).testAuthStorage = testAuthStorage;
  (window as any).authStorage = authStorage;
  
  // Log that testing utilities are available
  console.log('🧪 Auth testing utilities available:');
  console.log('  - window.testAuthStorage() - Run full auth storage test');
  console.log('  - window.authStorage - Direct access to auth storage methods');
}
