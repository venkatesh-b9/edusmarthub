import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { errorHandler } from './shared/utils/errors';
import logger from './shared/utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectMongoDB, disconnectMongoDB } from './config/mongodb';
import { connectRabbitMQ, disconnectRabbitMQ } from './config/rabbitmq';
import { generalLimiter } from './shared/middleware/rateLimit';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './services/auth/auth.routes';
import userRoutes from './services/user/user.routes';
import schoolRoutes from './services/school/school.routes';
import attendanceRoutes from './services/attendance/attendance.routes';
import academicsRoutes from './services/academics/academics.routes';
import communicationRoutes from './services/communication/communication.routes';
import fileRoutes from './services/file/file.routes';
import paymentRoutes from './services/payment/payment.routes';
import analyticsRoutes from './services/analytics/analytics.routes';
import timetableRoutes from './services/timetable/timetable.routes';
import healthRoutes from './routes/health.routes';

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v1';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Rate limiting
app.use(generalLimiter);

// Health check routes (before API routes for faster response)
app.use('/health', healthRoutes);

// API Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/schools`, schoolRoutes);
app.use(`/api/${API_VERSION}/attendance`, attendanceRoutes);
app.use(`/api/${API_VERSION}/academics`, academicsRoutes);
app.use(`/api/${API_VERSION}/communication`, communicationRoutes);
app.use(`/api/${API_VERSION}/files`, fileRoutes);
app.use(`/api/${API_VERSION}/payments`, paymentRoutes);
app.use(`/api/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`/api/${API_VERSION}/timetable`, timetableRoutes);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join_school', (schoolId: string) => {
    socket.join(schoolId);
    logger.info(`Socket ${socket.id} joined school ${schoolId}`);
  });

  socket.on('join_user', (userId: string) => {
    socket.join(userId);
    logger.info(`Socket ${socket.id} joined user ${userId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Set Socket.IO instance for communication service
import { CommunicationService } from './services/communication/communication.service';
const communicationService = new CommunicationService();
communicationService.setSocketIO(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down server...');
  
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  await disconnectDatabase();
  await disconnectMongoDB();
  await disconnectRabbitMQ();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    // Connect to databases
    await connectDatabase();
    await connectMongoDB();
    await connectRabbitMQ();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API version: ${API_VERSION}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, io };
