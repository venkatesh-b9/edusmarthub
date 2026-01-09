import express, { Express } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './config';
import logger from './utils/logger';
import { ConnectionManager } from './utils/connectionManager';
import { MessagePersistence } from './utils/messagePersistence';

// Services
import { ClassroomMonitoringService } from './services/classroomMonitoring';
import { DocumentCollaborationService } from './services/documentCollaboration';
import { NotificationService } from './services/notificationService';
import { PollingQuizService } from './services/pollingQuiz';
import { ScreenShareWhiteboardService } from './services/screenShareWhiteboard';
import { BusTrackingService } from './services/busTracking';
import { ExamProctoringService } from './services/examProctoring';
import { EmergencyBroadcastService } from './services/emergencyBroadcast';
import { ParentTeacherChatService } from './services/parentTeacherChat';
import { DashboardUpdatesService } from './services/dashboardUpdates';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.socket.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: config.socket.pingTimeout,
  pingInterval: config.socket.pingInterval,
  maxHttpBufferSize: config.socket.maxHttpBufferSize,
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.socket.corsOrigin,
  credentials: true,
}));
app.use(compression());
app.use(express.json());
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim()),
  },
}));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'realtime-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Initialize services
const messagePersistence = new MessagePersistence();
const connectionManager = new ConnectionManager(io);

// Initialize all services
const classroomMonitoring = new ClassroomMonitoringService(io);
const documentCollaboration = new DocumentCollaborationService(io);
const notificationService = new NotificationService(io);
const pollingQuiz = new PollingQuizService(io);
const screenShareWhiteboard = new ScreenShareWhiteboardService(io);
const busTracking = new BusTrackingService(io);
const examProctoring = new ExamProctoringService(io);
const emergencyBroadcast = new EmergencyBroadcastService(io);
const parentTeacherChat = new ParentTeacherChatService(io);
const dashboardUpdates = new DashboardUpdatesService(io);

// Initialize message persistence
messagePersistence.initialize().then(() => {
  logger.info('Message persistence initialized');
});

// Cleanup old messages periodically
setInterval(() => {
  messagePersistence.cleanupOldMessages();
}, 24 * 60 * 60 * 1000); // Daily

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down realtime service...');

  httpServer.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('Socket.IO server closed');
  });

  await connectionManager.cleanup();
  await messagePersistence.cleanupOldMessages();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    httpServer.listen(config.server.port, () => {
      logger.info(`Realtime service running on port ${config.server.port}`);
      logger.info(`Socket.IO server ready`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io, app };
