const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory user store (for demo without MongoDB)
let users = [];
let userIdCounter = 1;

// MongoDB connection for user authentication
mongoose.connect('mongodb://localhost:27017/wellness_gateway', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Gateway DB connected');
}).catch(err => {
  console.warn('⚠️ Gateway DB connection failed, using in-memory storage:', err.message);
  // Continue without MongoDB for demo purposes
});

// User Schema for authentication
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dateOfBirth: Date,
  gender: String,
  preferences: {
    healthcare: { type: Boolean, default: true },
    fitness: { type: Boolean, default: true },
    culinary: { type: Boolean, default: true }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, gender } = req.body;

    // Check if user exists (in-memory or MongoDB)
    let existingUser;
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      existingUser = await User.findOne({ email });
    } else {
      // Use in-memory storage
      existingUser = users.find(u => u.email === email);
    }

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      user = new User({
        name,
        email,
        password: hashedPassword,
        dateOfBirth,
        gender
      });
      await user.save();
    } else {
      // Use in-memory storage
      user = {
        _id: userIdCounter++,
        name,
        email,
        password: hashedPassword,
        dateOfBirth,
        gender,
        preferences: {
          healthcare: true,
          fitness: true,
          culinary: true
        },
        createdAt: new Date()
      };
      users.push(user);
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user._id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user (in-memory or MongoDB)
    let user;
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      user = await User.findOne({ email });
    } else {
      // Use in-memory storage
      user = users.find(u => u.email === email);
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      user: { id: user._id, email: user.email, name: user.name },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    let user;
    if (mongoose.connection.readyState === 1) {
      // MongoDB is connected
      user = await User.findById(req.user.id).select('-password');
    } else {
      // Use in-memory storage
      user = users.find(u => u._id === req.user.id);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        user = userWithoutPassword;
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Proxy middleware for the three apps
const healthcareProxy = createProxyMiddleware({
  target: 'http://localhost:3002',
  changeOrigin: true,
  pathRewrite: {
    '^/healthcare': ''
  }
});

const fitnessProxy = createProxyMiddleware({
  target: 'http://localhost:3003',
  changeOrigin: true,
  pathRewrite: {
    '^/fitness': ''
  }
});

const culinaryProxy = createProxyMiddleware({
  target: 'http://localhost:3004',
  changeOrigin: true,
  pathRewrite: {
    '^/culinary': ''
  }
});

// Protected routes that proxy to individual apps
app.use('/healthcare', authenticateToken, healthcareProxy);
app.use('/fitness', authenticateToken, fitnessProxy);
app.use('/culinary', authenticateToken, culinaryProxy);

// Dashboard route
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Fetch data from all three apps using node-fetch or axios
    const fetchPromises = [
      fetchWithTimeout('http://localhost:3002/api/dashboard'),
      fetchWithTimeout('http://localhost:3003/api/dashboard'),
      fetchWithTimeout('http://localhost:3004/api/dashboard')
    ];

    const [healthcareRes, fitnessRes, culinaryRes] = await Promise.allSettled(fetchPromises);

    const dashboard = {
      user: req.user,
      healthcare: healthcareRes.status === 'fulfilled' ? healthcareRes.value : null,
      fitness: fitnessRes.status === 'fulfilled' ? fitnessRes.value : null,
      culinary: culinaryRes.status === 'fulfilled' ? culinaryRes.value : null,
      timestamp: new Date().toISOString()
    };

    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// Simple fetch function with timeout
async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Serve main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.listen(PORT, () => {
  console.log(`🌟 Integrated Wellness Gateway running on port ${PORT}`);
  console.log(`📱 Access the platform at: http://localhost:${PORT}`);
  console.log(`🏥 Healthcare App: http://localhost:3002`);
  console.log(`💪 Fitness App: http://localhost:3003`);
  console.log(`🍽️ Culinary App: http://localhost:3004`);
});

module.exports = app;