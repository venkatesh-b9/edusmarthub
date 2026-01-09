/**
 * Health Check Routes
 * Provides comprehensive health monitoring for all services
 */

import { Router, Request, Response } from 'express';
import { connectDatabase } from '../config/database';
import { connectMongoDB } from '../config/mongodb';
import { connectRabbitMQ } from '../config/rabbitmq';
import os from 'os';
import axios from 'axios';

const router = Router();

// Helper function to check database connection
const checkDatabase = async (): Promise<boolean> => {
  try {
    const db = await connectDatabase();
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
};

// Helper function to check MongoDB connection
const checkMongoDB = async (): Promise<boolean> => {
  try {
    const mongo = await connectMongoDB();
    await mongo.db().admin().ping();
    return true;
  } catch {
    return false;
  }
};

// Helper function to check RabbitMQ connection
const checkRabbitMQ = async (): Promise<boolean> => {
  try {
    const channel = await connectRabbitMQ();
    return channel !== null;
  } catch {
    return false;
  }
};

// Helper function to check AI service
const checkAIService = async (serviceName?: string): Promise<{
  healthy: boolean;
  response_time?: number;
  error?: string;
}> => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const endpoint = serviceName
      ? `${aiServiceUrl}/api/v1/ai/${serviceName}/health`
      : `${aiServiceUrl}/health`;

    const startTime = Date.now();
    const response = await axios.get(endpoint, { timeout: 5000 });
    const responseTime = Date.now() - startTime;

    return {
      healthy: response.status === 200,
      response_time: responseTime,
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: error.message || 'Service unavailable',
    };
  }
};

// Helper function to check file storage
const checkFileStorage = async (): Promise<boolean> => {
  // Implement file storage check (S3, local, etc.)
  // For now, return true as placeholder
  return true;
};

// Helper function to check email service
const checkEmailService = async (): Promise<boolean> => {
  // Implement email service check
  // For now, return true as placeholder
  return true;
};

// Helper function to check SMS service
const checkSMSService = async (): Promise<boolean> => {
  // Implement SMS service check
  // For now, return true as placeholder
  return true;
};

// Basic health check
router.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      mongodb: await checkMongoDB(),
      rabbitmq: await checkRabbitMQ(),
      file_storage: await checkFileStorage(),
      email_service: await checkEmailService(),
      sms_service: await checkSMSService(),
    },
    system: {
      memory: {
        used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        percentage: Math.round(
          ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        ),
      },
      uptime: Math.round(process.uptime()),
      load: os.loadavg(),
    },
  };

  // Check if all critical services are healthy
  const allHealthy =
    health.services.database &&
    health.services.mongodb &&
    health.services.rabbitmq;

  res.status(allHealthy ? 200 : 503).json(health);
});

// AI Service Health Check
router.get('/health/ai', async (req: Request, res: Response) => {
  const services = [
    'timetable',
    'performance',
    'attendance',
    'nlq',
    'early-warning',
    'essay-grading',
    'sentiment',
    'learning-path',
  ];

  const aiHealth: Record<string, any> = {};

  // Check each AI service
  for (const service of services) {
    aiHealth[service] = await checkAIService(service);
  }

  // Check general AI service health
  aiHealth.general = await checkAIService();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: aiHealth,
  });
});

// Get model versions
router.get('/health/ai/models', async (req: Request, res: Response) => {
  try {
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    const response = await axios.get(`${aiServiceUrl}/api/v1/ai/models/versions`, {
      timeout: 5000,
    });

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      models: response.data,
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'error',
      error: error.message || 'Failed to fetch model versions',
    });
  }
});

// Feature flag status check
router.get('/features/:featureName/status', async (req: Request, res: Response) => {
  const { featureName } = req.params;

  // In a real implementation, check feature flags from database or config
  // For now, return enabled for all features
  const featureFlags: Record<string, boolean> = {
    advanced_ai_analytics: true,
    teacher_ai_assistant: true,
    parent_ai_insights: true,
    timetable_optimization: true,
    // Add more feature flags as needed
  };

  const enabled = featureFlags[featureName] ?? false;

  res.json({
    enabled,
    message: enabled
      ? 'Feature is enabled'
      : 'Feature is disabled or not available',
  });
});

// Error logging endpoint
router.post('/errors/log', async (req: Request, res: Response) => {
  const { error, errorInfo, componentName, url, userAgent, timestamp, userId } = req.body;

  // In a real implementation, log to database or logging service
  console.error('Frontend Error:', {
    error,
    errorInfo,
    componentName,
    url,
    userAgent,
    timestamp,
    userId,
  });

  res.status(200).json({ success: true });
});

// System recovery endpoint
router.post('/system/recover', async (req: Request, res: Response) => {
  const { component } = req.body;

  // In a real implementation, perform recovery actions
  console.log('Recovery requested for component:', component);

  res.json({
    success: true,
    message: 'Recovery initiated',
  });
});

export default router;
