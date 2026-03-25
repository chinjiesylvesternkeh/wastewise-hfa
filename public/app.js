// Global variables
let authToken = localStorage.getItem('authToken');
let currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
let ws = null;

// API base URL
const API_BASE = '/api';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    
    // Check if we're already logged in
    if (authToken && currentUser) {
        console.log('User already logged in:', currentUser.name);
        showDashboard();
        connectWebSocket();
        loadDashboardData();
        return; // Don't set up login forms if already logged in
    }

    // Form event listeners with error handling
    try {
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        const healthForm = document.getElementById('health-metric-form');
        const activityForm = document.getElementById('activity-form');
        const nutritionForm = document.getElementById('nutrition-form');

        console.log('Forms found:', {
            loginForm: !!loginForm,
            registerForm: !!registerForm,
            healthForm: !!healthForm,
            activityForm: !!activityForm,
            nutritionForm: !!nutritionForm
        });

        if (loginForm) {
            loginForm.addEventListener('submit', handleLogin);
            console.log('Login form event listener attached');
        } else {
            console.error('Login form not found!');
        }
        
        if (registerForm) {
            registerForm.addEventListener('submit', handleRegister);
            console.log('Register form event listener attached');
            
            // Also add a direct button click listener as backup
            const registerButton = registerForm.querySelector('button[type="submit"]');
            if (registerButton) {
                registerButton.addEventListener('click', function(e) {
                    console.log('Register button clicked directly');
                });
            }
        } else {
            console.error('Register form not found!');
        }
        
        if (healthForm) healthForm.addEventListener('submit', handleHealthMetric);
        if (activityForm) activityForm.addEventListener('submit', handleActivity);
        if (nutritionForm) nutritionForm.addEventListener('submit', handleNutrition);
        
        console.log('All event listeners attached successfully');
        
        // Auto-fill remembered login credentials
        function loadRememberedCredentials() {
            const rememberedEmail = localStorage.getItem('rememberedEmail');
            const loginEmailField = document.getElementById('login-email');
            
            if (rememberedEmail && loginEmailField) {
                loginEmailField.value = rememberedEmail;
                console.log('Auto-filled login email:', rememberedEmail);
            }
        }
        
        // Load remembered credentials
        loadRememberedCredentials();
        
        // Make sure register tab is accessible
        const registerTab = document.querySelector('.tab:nth-child(2)'); // Second tab (Register)
        if (registerTab) {
            registerTab.addEventListener('click', function() {
                console.log('Register tab clicked');
            });
        }
        
    } catch (error) {
        console.error('Error setting up event listeners:', error);
    }
});

// Authentication functions
function handleRegisterClick(event) {
    console.log('Register button clicked via onclick handler');
    // This will trigger the form submission which should call handleRegister
    return true; // Allow form submission to proceed
}

async function handleLogin(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    console.log('Login attempt:', { email, password: password ? '[PROVIDED]' : '[EMPTY]' });

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        console.log('Login response status:', response.status);
        const data = await response.json();
        console.log('Login response data:', data);

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Remember login credentials for next time
            localStorage.setItem('rememberedEmail', email);
            localStorage.setItem('rememberedName', data.user.name);
            
            showNotification('Login successful!', 'success');
            showDashboard();
            connectWebSocket();
            loadDashboardData();
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    console.log('Registration form submitted');
    
    const formData = {
        name: document.getElementById('register-name').value,
        email: document.getElementById('register-email').value,
        password: document.getElementById('register-password').value,
        dateOfBirth: document.getElementById('register-dob').value,
        gender: document.getElementById('register-gender').value
    };

    console.log('Form data:', formData);

    try {
        console.log('Sending registration request...');
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showNotification('Registration successful!', 'success');
            showDashboard();
            connectWebSocket();
            loadDashboardData();
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Network error. Please try again.', 'error');
    }
}

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    
    if (ws) {
        ws.close();
    }
    
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
    
    showNotification('Logged out successfully', 'success');
}

// UI functions
function switchTab(tabName, event) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        console.log('Removed active from tab:', tab.textContent);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        console.log('Removed active from content:', content.id);
    });
    
    // Add active class to selected tab
    if (event && event.target) {
        event.target.classList.add('active');
        console.log('Added active to clicked tab:', event.target.textContent);
    } else {
        // Fallback: find the tab by text content
        document.querySelectorAll('.tab').forEach(tab => {
            if (tab.textContent.toLowerCase().includes(tabName.toLowerCase())) {
                tab.classList.add('active');
                console.log('Added active to tab (fallback):', tab.textContent);
            }
        });
    }
    
    // Show the corresponding content
    const tabContent = document.getElementById(`${tabName}-tab`);
    if (tabContent) {
        tabContent.classList.add('active');
        console.log('Showed tab content:', tabName);
    } else {
        console.error('Tab content not found:', `${tabName}-tab`);
    }
}

function showDashboard() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('dashboard').style.display = 'grid';
    document.getElementById('user-info').style.display = 'block';
    document.getElementById('user-name').textContent = `Welcome, ${currentUser.name}!`;
}

function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type === 'error' ? 'error' : ''}`;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// WebSocket connection
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'register',
            userId: currentUser.id
        }));
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = function() {
        console.log('WebSocket disconnected');
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
    };
}

function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'notification':
            showNotification(data.message, 'success');
            break;
        case 'medication_reminder':
            showNotification(`💊 ${data.message}`, 'success');
            break;
        case 'achievement':
            showNotification(`🎉 ${data.message}`, 'success');
            break;
        default:
            console.log('Unknown WebSocket message:', data);
    }
}

// API helper function
async function apiCall(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        ...options
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API call failed');
    }

    return data;
}

// Health functions
async function handleHealthMetric(e) {
    e.preventDefault();
    
    const type = document.getElementById('metric-type').value;
    const value = parseFloat(document.getElementById('metric-value').value);
    
    // Determine unit based on type
    const units = {
        'weight': 'kg',
        'blood_pressure_systolic': 'mmHg',
        'heart_rate': 'bpm',
        'blood_glucose': 'mg/dL',
        'temperature': '°C'
    };

    try {
        await apiCall('/health/metrics', {
            method: 'POST',
            body: JSON.stringify({
                type,
                value,
                unit: units[type] || 'unit'
            })
        });

        showNotification('Health metric recorded successfully!', 'success');
        document.getElementById('health-metric-form').reset();
        loadHealthMetrics();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadHealthMetrics() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const data = await apiCall(`/health/metrics?startDate=${today}`);
        
        document.getElementById('health-metrics-count').textContent = data.metrics.length;
        
        const container = document.getElementById('recent-metrics');
        container.innerHTML = '<h4>Today\'s Metrics</h4>';
        
        data.metrics.slice(0, 3).forEach(metric => {
            const div = document.createElement('div');
            div.className = 'metric-item';
            div.innerHTML = `
                <strong>${metric.type.replace('_', ' ').toUpperCase()}</strong>
                <div class="metric-value">${metric.value} ${metric.unit}</div>
                <small>${new Date(metric.timestamp).toLocaleTimeString()}</small>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Failed to load health metrics:', error);
    }
}

// Fitness functions
async function handleActivity(e) {
    e.preventDefault();
    
    const type = document.getElementById('activity-type').value;
    const duration = parseInt(document.getElementById('activity-duration').value);
    const caloriesBurned = parseInt(document.getElementById('activity-calories').value) || null;

    try {
        await apiCall('/fitness/activities', {
            method: 'POST',
            body: JSON.stringify({
                type,
                name: type.charAt(0).toUpperCase() + type.slice(1),
                duration,
                caloriesBurned
            })
        });

        showNotification('Activity logged successfully!', 'success');
        document.getElementById('activity-form').reset();
        loadActivities();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadActivities() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const data = await apiCall(`/fitness/activities?startDate=${today}`);
        
        document.getElementById('activities-count').textContent = data.activities.length;
        
        const totalCalories = data.activities.reduce((sum, activity) => 
            sum + (activity.calories_burned || 0), 0);
        document.getElementById('calories-burned').textContent = totalCalories;
        
        const container = document.getElementById('recent-activities');
        container.innerHTML = '<h4>Today\'s Activities</h4>';
        
        data.activities.slice(0, 3).forEach(activity => {
            const div = document.createElement('div');
            div.className = 'activity-item';
            div.innerHTML = `
                <strong>${activity.name}</strong>
                <div>${activity.duration} minutes</div>
                ${activity.calories_burned ? `<div>${activity.calories_burned} calories</div>` : ''}
                <small>${new Date(activity.timestamp).toLocaleTimeString()}</small>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        console.error('Failed to load activities:', error);
    }
}

// Nutrition functions
async function handleNutrition(e) {
    e.preventDefault();
    
    const foodItem = document.getElementById('food-item').value;
    const quantity = parseFloat(document.getElementById('food-quantity').value);
    const unit = document.getElementById('food-unit').value;
    const mealType = document.getElementById('meal-type').value;
    const calories = parseInt(document.getElementById('food-calories').value);

    try {
        await apiCall('/culinary/nutrition', {
            method: 'POST',
            body: JSON.stringify({
                foodItem,
                quantity,
                unit,
                mealType,
                nutritionFacts: {
                    calories,
                    protein: 0,
                    carbs: 0,
                    fat: 0
                }
            })
        });

        showNotification('Food logged successfully!', 'success');
        document.getElementById('nutrition-form').reset();
        loadNutrition();
    } catch (error) {
        showNotification(error.message, 'error');
    }
}

async function loadNutrition() {
    try {
        const today = new Date().toISOString().split('T')[0];
        const data = await apiCall(`/culinary/nutrition/daily/${today}`);
        
        document.getElementById('daily-calories').textContent = Math.round(data.dailyTotals.calories);
        document.getElementById('meals-logged').textContent = data.entriesCount;
        
        const container = document.getElementById('recent-nutrition');
        container.innerHTML = '<h4>Today\'s Meals</h4>';
        
        Object.entries(data.mealBreakdown).forEach(([mealType, breakdown]) => {
            if (breakdown.count > 0) {
                const div = document.createElement('div');
                div.className = 'meal-item';
                div.innerHTML = `
                    <strong>${mealType.toUpperCase()}</strong>
                    <div>${Math.round(breakdown.calories)} calories</div>
                    <small>${breakdown.count} items</small>
                `;
                container.appendChild(div);
            }
        });
    } catch (error) {
        console.error('Failed to load nutrition data:', error);
    }
}

// Load all dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadHealthMetrics(),
        loadActivities(),
        loadNutrition()
    ]);
}