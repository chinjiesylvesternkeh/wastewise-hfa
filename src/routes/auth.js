import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generateToken } from '../middleware/auth.js';
import { ValidationError, ConflictError, UnauthorizedError } from '../middleware/errorHandler.js';
import { validateUser, validateLogin } from '../utils/validation.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res, next) => {
  try {
    console.log('Registration request received:', req.body);
    
    const { error, value } = validateUser(req.body);
    if (error) {
      console.log('Validation error:', error.details);
      throw new ValidationError('Invalid user data', error.details);
    }

    console.log('Validation passed:', value);

    const { email, password, name, dateOfBirth, gender, height, weight, activityLevel } = value;
    const db = req.app.locals.dbManager;

    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      console.log('User already exists:', email);
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    console.log('Creating user with ID:', userId);

    // Create user
    await db.run(
      `INSERT INTO users (id, email, password_hash, name, date_of_birth, gender, height, weight, activity_level)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, email, passwordHash, name, dateOfBirth, gender, height, weight, activityLevel]
    );

    // Generate token
    const user = { id: userId, email, name };
    const token = generateToken(user);

    console.log('User created successfully:', user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: userId, email, name },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
});

// Login user
router.post('/login', async (req, res, next) => {
  try {
    console.log('Login request received:', { email: req.body.email, password: req.body.password ? '[PROVIDED]' : '[MISSING]' });
    
    const { error, value } = validateLogin(req.body);
    if (error) {
      console.log('Login validation error:', error.details);
      throw new ValidationError('Invalid login data', error.details);
    }

    const { email, password } = value;
    console.log('Login validation passed for email:', email);
    
    const db = req.app.locals.dbManager;

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    console.log('User lookup result:', user ? 'User found' : 'User not found');
    
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for email:', email);
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);
    console.log('Login successful for user:', user.email);

    res.json({
      message: 'Login successful',
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error.message);
    next(error);
  }
});

export { router as authRouter };