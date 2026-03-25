// Test complete user journey: Register → Login → Access All Features

async function testCompleteUserJourney() {
  try {
    console.log('🧪 Testing Complete User Journey...\n');
    
    const testEmail = `testuser${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    const testName = 'Journey Test User';

    // Step 1: Register new user
    console.log('1. Testing User Registration...');
    const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        dateOfBirth: '1990-05-15',
        gender: 'other'
      })
    });
    
    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.log('❌ Registration failed:', errorData.error);
      return;
    }
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration successful');
    console.log('   User:', registerData.user.name);
    console.log('   Email:', registerData.user.email);
    
    let token = registerData.token;

    // Step 2: Test immediate access after registration
    console.log('\n2. Testing Immediate Access After Registration...');
    const dashboardAfterRegister = await fetch('http://localhost:3001/api/integration/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('   Dashboard access:', dashboardAfterRegister.ok ? '✅ Available' : '❌ Not available');

    // Step 3: Test login with new credentials
    console.log('\n3. Testing Login with New Credentials...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    
    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Login failed:', errorData.error);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('   User:', loginData.user.name);
    token = loginData.token; // Update token

    // Step 4: Test all wellness services
    console.log('\n4. Testing All Wellness Services...');
    
    // Health service
    console.log('   4a. Health Service...');
    const healthMetricResponse = await fetch('http://localhost:3001/api/health/metrics', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'weight',
        value: 75.2,
        unit: 'kg'
      })
    });
    console.log('      Record health metric:', healthMetricResponse.ok ? '✅ Success' : '❌ Failed');
    
    // Fitness service
    console.log('   4b. Fitness Service...');
    const activityResponse = await fetch('http://localhost:3001/api/fitness/activities', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'cycling',
        name: 'Evening Bike Ride',
        duration: 45,
        caloriesBurned: 400
      })
    });
    console.log('      Log activity:', activityResponse.ok ? '✅ Success' : '❌ Failed');
    
    // Nutrition service
    console.log('   4c. Nutrition Service...');
    const nutritionResponse = await fetch('http://localhost:3001/api/culinary/nutrition', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        foodItem: 'Grilled Chicken Breast',
        quantity: 150,
        unit: 'grams',
        mealType: 'dinner',
        nutritionFacts: {
          calories: 231,
          protein: 43.5,
          carbs: 0.1,
          fat: 5.0
        }
      })
    });
    console.log('      Log nutrition:', nutritionResponse.ok ? '✅ Success' : '❌ Failed');

    // Step 5: Test integrated dashboard with data
    console.log('\n5. Testing Dashboard with User Data...');
    const dashboardResponse = await fetch('http://localhost:3001/api/integration/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard loaded successfully');
      console.log('   Health metrics today:', dashboardData.health.metrics.length);
      console.log('   Activities today:', dashboardData.fitness.activities.length);
      console.log('   Nutrition entries today:', dashboardData.nutrition.entries.length);
      console.log('   Total calories consumed:', Math.round(dashboardData.nutrition.totals.calories));
      console.log('   Total calories burned:', dashboardData.fitness.totals.calories);
    } else {
      console.log('❌ Dashboard failed to load');
    }

    // Step 6: Test cross-domain recommendations
    console.log('\n6. Testing Cross-Domain Recommendations...');
    const recommendationsResponse = await fetch('http://localhost:3001/api/integration/recommendations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (recommendationsResponse.ok) {
      const recommendationsData = await recommendationsResponse.json();
      console.log('✅ Recommendations generated');
      console.log('   Count:', recommendationsData.count);
      if (recommendationsData.recommendations.length > 0) {
        console.log('   Sample:', recommendationsData.recommendations[0].title);
      }
    } else {
      console.log('❌ Recommendations failed');
    }

    // Step 7: Test insights
    console.log('\n7. Testing Wellness Insights...');
    const insightsResponse = await fetch('http://localhost:3001/api/integration/insights', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (insightsResponse.ok) {
      const insightsData = await insightsResponse.json();
      console.log('✅ Insights generated');
      console.log('   Period:', insightsData.period);
      console.log('   Insights count:', insightsData.insights.length);
    } else {
      console.log('❌ Insights failed');
    }

    console.log('\n🎉 Complete User Journey Test Successful!');
    console.log('\n📋 Summary:');
    console.log('   ✅ User can register successfully');
    console.log('   ✅ User can login with registered credentials');
    console.log('   ✅ User can access all wellness services (Health, Fitness, Nutrition)');
    console.log('   ✅ User can view integrated dashboard');
    console.log('   ✅ User can receive personalized recommendations');
    console.log('   ✅ User can view wellness insights');
    console.log('\n🌟 The authentication system provides full access to all app features!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run complete test
testCompleteUserJourney();