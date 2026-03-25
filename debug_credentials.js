// Debug the test credentials issue

async function debugCredentials() {
  try {
    console.log('🔍 Debugging Test Credentials Access...\n');

    // Test the exact credentials from simple-login.html
    const testEmail = 'authtest@example.com';
    const testPassword = 'testpassword123';

    console.log('1. Testing login with credentials from simple-login.html...');
    console.log('   Email:', testEmail);
    console.log('   Password:', testPassword);

    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    console.log('   Response status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('   User:', loginData.user);
      console.log('   Token received:', !!loginData.token);
      
      const token = loginData.token;

      // Test accessing the main dashboard page
      console.log('\n2. Testing main page access...');
      const mainPageResponse = await fetch('http://localhost:3001/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Main page status:', mainPageResponse.status);

      // Test API endpoints
      console.log('\n3. Testing API endpoints...');
      
      const endpoints = [
        '/api/health/metrics',
        '/api/fitness/activities', 
        '/api/culinary/recipes',
        '/api/integration/dashboard'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`http://localhost:3001${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log(`   ${endpoint}: ${response.status} ${response.ok ? '✅' : '❌'}`);
          
          if (!response.ok) {
            const errorData = await response.json();
            console.log(`     Error: ${errorData.error || errorData.message}`);
          }
        } catch (error) {
          console.log(`   ${endpoint}: ERROR - ${error.message}`);
        }
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed');
      console.log('   Error:', errorData);
      
      // Check if user exists in database
      console.log('\n   Checking if user exists...');
      
      // Try to register this user to see what happens
      console.log('\n   Attempting to register test user...');
      const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auth Test User',
          email: testEmail,
          password: testPassword,
          dateOfBirth: '1990-01-01',
          gender: 'other'
        })
      });
      
      console.log('   Register response status:', registerResponse.status);
      const registerData = await registerResponse.json();
      console.log('   Register response:', registerData);
    }

    // Also test health check
    console.log('\n4. Testing health check...');
    const healthResponse = await fetch('http://localhost:3001/api/health-check');
    const healthData = await healthResponse.json();
    console.log('   Health check:', healthData);

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run debug
debugCredentials();