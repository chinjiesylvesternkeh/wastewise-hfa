// Test the complete login flow with existing credentials

async function testLoginFlow() {
  try {
    console.log('🧪 Testing Complete Login Flow...\n');

    // Test login with existing test credentials
    console.log('1. Testing login with test credentials...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'authtest@example.com',
        password: 'testpassword123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log('   User:', loginData.user.name);
      console.log('   Email:', loginData.user.email);
      
      const token = loginData.token;

      // Test accessing all wellness services
      console.log('\n2. Testing Health Service Access...');
      const healthResponse = await fetch('http://localhost:3001/api/health/metrics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Health service:', healthResponse.ok ? '✅ Accessible' : '❌ Not accessible');

      console.log('\n3. Testing Fitness Service Access...');
      const fitnessResponse = await fetch('http://localhost:3001/api/fitness/activities', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Fitness service:', fitnessResponse.ok ? '✅ Accessible' : '❌ Not accessible');

      console.log('\n4. Testing Nutrition Service Access...');
      const nutritionResponse = await fetch('http://localhost:3001/api/culinary/recipes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('   Nutrition service:', nutritionResponse.ok ? '✅ Accessible' : '❌ Not accessible');

      console.log('\n5. Testing Dashboard Integration...');
      const dashboardResponse = await fetch('http://localhost:3001/api/integration/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('   Dashboard:', '✅ Accessible');
        console.log('   Date:', dashboardData.date);
        console.log('   Health metrics:', dashboardData.health.metrics.length);
        console.log('   Activities:', dashboardData.fitness.activities.length);
        console.log('   Nutrition entries:', dashboardData.nutrition.entries.length);
        console.log('   Active goals:', dashboardData.goals.length);
      } else {
        console.log('   Dashboard:', '❌ Not accessible');
        const errorData = await dashboardResponse.json();
        console.log('   Error:', errorData.error);
      }

      console.log('\n6. Testing Recommendations...');
      const recommendationsResponse = await fetch('http://localhost:3001/api/integration/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (recommendationsResponse.ok) {
        const recommendationsData = await recommendationsResponse.json();
        console.log('   Recommendations:', '✅ Accessible');
        console.log('   Count:', recommendationsData.count);
      } else {
        console.log('   Recommendations:', '❌ Not accessible');
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData.error);
      
      // Try with alternative test user
      console.log('\n   Trying with test@example.com...');
      const altLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword123'
        })
      });
      
      if (altLoginResponse.ok) {
        const altLoginData = await altLoginResponse.json();
        console.log('✅ Alternative login successful');
        console.log('   User:', altLoginData.user.name);
      } else {
        console.log('❌ Alternative login also failed');
      }
    }

    console.log('\n🎉 Login flow test completed!');
    console.log('\n📱 Frontend URLs to test:');
    console.log('   Main app: http://localhost:3001/');
    console.log('   Simple login: http://localhost:3001/simple-login.html');
    console.log('   Simple register: http://localhost:3001/simple-register.html');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testLoginFlow();