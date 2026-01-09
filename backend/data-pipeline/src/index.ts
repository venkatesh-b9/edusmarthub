import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { config } from './config';
import logger from './utils/logger';
import { kafkaClient } from './utils/kafkaClient';

// Services
import { DataIngestionService } from './services/dataIngestion';
import { ETLService } from './services/etlService';
import { BatchProcessingService } from './services/batchProcessing';
import { RealTimeAggregationService } from './services/realTimeAggregation';
import { DataCleansingService } from './services/dataCleansing';
import { AnomalyDetectionService } from './services/anomalyDetection';
import { BackupArchivalService } from './services/backupArchival';
import { DataSyncService } from './services/dataSync';
import { GDPRComplianceService } from './services/gdprCompliance';
import { PredictiveAnalyticsService } from './services/predictiveAnalytics';
import { MonitoringAlertingService } from './services/monitoringAlerting';

dotenv.config();

const app: Express = express();

// Middleware
app.use(helmet());
app.use(cors());
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
    service: 'data-pipeline',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const monitoringService = (app as any).monitoringService as MonitoringAlertingService;
    if (monitoringService) {
      const metrics = await monitoringService.getMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } else {
      res.status(503).json({ error: 'Metrics not available' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

// Initialize services
const dataIngestion = new DataIngestionService();
const etlService = new ETLService();
const batchProcessing = new BatchProcessingService();
const realTimeAggregation = new RealTimeAggregationService();
const dataCleansing = new DataCleansingService();
const anomalyDetection = new AnomalyDetectionService();
const backupArchival = new BackupArchivalService();
const dataSync = new DataSyncService();
const gdprCompliance = new GDPRComplianceService();
const predictiveAnalytics = new PredictiveAnalyticsService();
const monitoringAlerting = new MonitoringAlertingService();

// Store services in app for metrics endpoint
(app as any).monitoringService = monitoringAlerting;

// Start all services
const startServices = async () => {
  try {
    // Connect to Kafka
    await kafkaClient.connect();

    // Start services
    await dataIngestion.startIngestion();
    await etlService.startETLProcessing();
    await batchProcessing.startBatchProcessing();
    await realTimeAggregation.startAggregation();
    await dataCleansing.startCleansing();
    await anomalyDetection.startAnomalyDetection();
    await backupArchival.startBackupService();
    await dataSync.startSyncService();
    await gdprCompliance.startGDPRService();
    await predictiveAnalytics.startPredictiveService();
    await monitoringAlerting.startMonitoring();

    logger.info('All data pipeline services started');
  } catch (error) {
    logger.error(`Error starting services: ${error}`);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down data pipeline...');

  await dataIngestion.stopIngestion();
  batchProcessing.stop();
  realTimeAggregation.stop();
  backupArchival.stop();
  await monitoringAlerting.cleanup();
  await kafkaClient.disconnect();

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
const startServer = async () => {
  try {
    await startServices();

    app.listen(config.server.port, () => {
      logger.info(`Data pipeline service running on port ${config.server.port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app };
