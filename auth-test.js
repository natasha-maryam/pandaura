// Test script to debug authentication flow
console.log('🧪 Starting authentication test...');

// Clear all existing auth data
localStorage.clear();
console.log('✅ Cleared localStorage');

// Test login process
async function testLogin() {
  try {
    console.log('🔐 Attempting login...');
    
    const response = await fetch('http://localhost:5000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@pandaura.com',
        password: 'test123'
      })
    });

    const data = await response.json();
    console.log('📡 Login response:', data);

    if (data.token) {
      console.log('✅ Login successful, storing auth data...');
      
      // Store auth data as the app would
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('authUser', JSON.stringify({
        userId: data.userId,
        fullName: data.fullName,
        email: data.email,
        twoFactorEnabled: data.twoFactorEnabled || false
      }));

      if (data.organizations) {
        localStorage.setItem('authOrgs', JSON.stringify(data.organizations));
      }

      console.log('✅ Auth data stored in localStorage');
      console.log('🔍 Stored data:', {
        token: !!localStorage.getItem('authToken'),
        user: !!localStorage.getItem('authUser'),
        orgs: !!localStorage.getItem('authOrgs')
      });

      // Now test if we can access protected endpoints
      console.log('🔍 Testing authentication...');
      testAuthenticatedRequest();
    } else {
      console.error('❌ Login failed:', data);
    }
  } catch (error) {
    console.error('❌ Login error:', error);
  }
}

async function testAuthenticatedRequest() {
  try {
    const token = localStorage.getItem('authToken');
    console.log('🔍 Testing authenticated request with token...');
    
    const response = await fetch('http://localhost:5000/api/v1/test/db-connection', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    console.log('📡 Authenticated request response:', data);

    if (response.ok) {
      console.log('✅ Authentication is working');
    } else {
      console.error('❌ Authentication failed:', data);
    }
  } catch (error) {
    console.error('❌ Authenticated request error:', error);
  }
}

// Run the test
testLogin();
