import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wellness-platform-secret-key-change-in-production';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Make database available to route handlers
    req.db = req.app.locals.dbManager;
    req.eventBus = req.app.locals.eventBus;
    req.notifications = req.app.locals.notificationService;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    res.status(401).json({ 
      error: 'Invalid token.' 
    });
  }
};

export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};