import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { fitnessRouter } from './routes/fitness.js';
import { culinaryRouter } from './routes/culinary.js';
import { integrationRouter } from './routes/integration.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authMiddleware } from './middleware/auth.js';
import { DatabaseManager } from './services/database.js';
import { EventBus } from './services/eventBus.js';
import { NotificationService } from './services/notifications.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize core services
const dbManager = new DatabaseManager();
const eventBus = new EventBus();
const notificationService = new NotificationService(wss);

// Make services available to routes
app.locals.dbManager = dbManager;
app.locals.eventBus = eventBus;
app.locals.notificationService = notificationService;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/health', authMiddleware, healthRouter);
app.use('/api/fitness', authMiddleware, fitnessRouter);
app.use('/api/culinary', authMiddleware, culinaryRouter);
app.use('/api/integration', authMiddleware, integrationRouter);

// Health check endpoint
app.get('/api/health-check', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      database: dbManager.isConnected(),
      eventBus: eventBus.isConnected(),
      notifications: notificationService.isActive()
    }
  });
});

// Error handling
app.use(errorHandler);

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      notificationService.handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    notificationService.removeConnection(ws);
  });
});

// Initialize database and start server
async function startServer() {
  try {
    await dbManager.initialize();
    await eventBus.initialize();
    
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 Integrated Wellness Platform running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health-check`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { app, server, wss };