const fetch = require('node-fetch');

async function testPlatform() {
  console.log('🧪 Testing Integrated Wellness Platform...\n');

  try {
    // Test 1: Check main platform
    console.log('1. Testing main platform...');
    const mainResponse = await fetch('http://localhost:3000');
    console.log('   Main platform:', mainResponse.ok ? '✅ Running' : '❌ Not accessible');

    // Test 2: Check individual apps
    console.log('\n2. Testing individual apps...');
    
    const healthcareResponse = await fetch('http://localhost:3002');
    console.log('   Healthcare app:', healthcareResponse.ok ? '✅ Running' : '❌ Not accessible');
    
    const fitnessResponse = await fetch('http://localhost:3003');
    console.log('   Fitness app:', fitnessResponse.ok ? '✅ Running' : '❌ Not accessible');
    
    const culinaryResponse = await fetch('http://localhost:3004');
    console.log('   Culinary app:', culinaryResponse.ok ? '✅ Running' : '❌ Not accessible');

    // Test 3: Test registration
    console.log('\n3. Testing user registration...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'testpassword123',
      dateOfBirth: '1990-01-01',
      gender: 'other'
    };

    const registerResponse = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('   Registration:', '✅ Success');
      console.log('   User created:', registerData.user.name);
      
      // Test 4: Test login
      console.log('\n4. Testing user login...');
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });

      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('   Login:', '✅ Success');
        console.log('   Welcome:', loginData.user.name);
        
        // Test 5: Test dashboard access
        console.log('\n5. Testing dashboard access...');
        const dashboardResponse = await fetch('http://localhost:3000/api/dashboard', {
          headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        if (dashboardResponse.ok) {
          console.log('   Dashboard:', '✅ Accessible');
        } else {
          console.log('   Dashboard:', '❌ Not accessible');
        }
      } else {
        console.log('   Login:', '❌ Failed');
      }
    } else {
      const errorData = await registerResponse.json();
      console.log('   Registration:', '❌ Failed -', errorData.error);
    }

    console.log('\n🎉 Platform test completed!');
    console.log('\n📱 Access URLs:');
    console.log('   Main Platform: http://localhost:3000');
    console.log('   Healthcare: http://localhost:3002');
    console.log('   Fitness: http://localhost:3003');
    console.log('   Culinary: http://localhost:3004');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testPlatform();