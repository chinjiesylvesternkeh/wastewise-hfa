// Simple test to verify the application is working

async function testApplication() {
  try {
    console.log('🧪 Testing Integrated Wellness Platform...\n');

    // Test health check endpoint
    console.log('1. Testing health check endpoint...');
    const healthResponse = await fetch('http://localhost:3001/api/health-check');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Services:', healthData.services);

    // Test user registration
    console.log('\n2. Testing user registration...');
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'testpassword123',
        dateOfBirth: '1990-01-01',
        gender: 'other'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registration successful');
      console.log('   User:', registerData.user.name);
      
      const token = registerData.token;

      // Test health metric recording
      console.log('\n3. Testing health metric recording...');
      const metricResponse = await fetch('http://localhost:3001/api/health/metrics', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'weight',
          value: 70.5,
          unit: 'kg'
        })
      });

      if (metricResponse.ok) {
        console.log('✅ Health metric recorded successfully');
      } else {
        console.log('❌ Health metric recording failed');
      }

      // Test activity logging
      console.log('\n4. Testing activity logging...');
      const activityResponse = await fetch('http://localhost:3001/api/fitness/activities', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'running',
          name: 'Morning Run',
          duration: 30,
          caloriesBurned: 300
        })
      });

      if (activityResponse.ok) {
        console.log('✅ Activity logged successfully');
      } else {
        console.log('❌ Activity logging failed');
      }

      // Test nutrition entry
      console.log('\n5. Testing nutrition entry...');
      const nutritionResponse = await fetch('http://localhost:3001/api/culinary/nutrition', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          foodItem: 'Apple',
          quantity: 1,
          unit: 'pieces',
          mealType: 'snack',
          nutritionFacts: {
            calories: 95,
            protein: 0.5,
            carbs: 25,
            fat: 0.3
          }
        })
      });

      if (nutritionResponse.ok) {
        console.log('✅ Nutrition entry logged successfully');
      } else {
        console.log('❌ Nutrition entry logging failed');
      }

      // Test dashboard data
      console.log('\n6. Testing dashboard data...');
      const dashboardResponse = await fetch('http://localhost:3001/api/integration/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard data retrieved successfully');
        console.log('   Health metrics today:', dashboardData.health.metrics.length);
        console.log('   Activities today:', dashboardData.fitness.activities.length);
        console.log('   Nutrition entries today:', dashboardData.nutrition.entries.length);
      } else {
        console.log('❌ Dashboard data retrieval failed');
      }

    } else {
      const errorData = await registerResponse.json();
      console.log('❌ User registration failed:', errorData.error);
    }

    console.log('\n🎉 All tests completed!');
    console.log('\n📱 You can now access the web interface at: http://localhost:3001');
    console.log('📋 Try registering a new user and exploring all the wellness features!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
testApplication();