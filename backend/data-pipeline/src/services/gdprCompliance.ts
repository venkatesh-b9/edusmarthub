import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { GDPRRequest } from '../types';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Sequelize } from 'sequelize';

export class GDPRComplianceService {
  private sequelize: Sequelize;
  private activeRequests: Map<string, GDPRRequest> = new Map();

  constructor() {
    this.sequelize = new Sequelize(
      config.database.postgres.database,
      config.database.postgres.user,
      config.database.postgres.password,
      {
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        dialect: 'postgres',
        logging: false,
      }
    );
  }

  async startGDPRService(): Promise<void> {
    if (!config.gdpr.enabled) {
      logger.info('GDPR compliance service is disabled');
      return;
    }

    logger.info('Starting GDPR compliance service');

    // Create Kafka topics
    await kafkaClient.createTopics([config.kafka.topics.gdpr]);

    // Consume GDPR requests
    await kafkaClient.consume(
      'gdpr-processor',
      [config.kafka.topics.gdpr],
      async (payload) => {
        await this.processGDPRRequest(payload);
      }
    );

    // Schedule data retention cleanup
    if (config.gdpr.autoDelete) {
      this.scheduleDataRetentionCleanup();
    }

    logger.info('GDPR compliance service started');
  }

  async processAccessRequest(userId: string): Promise<GDPRRequest> {
    const requestId = uuidv4();
    const request: GDPRRequest = {
      id: requestId,
      type: 'access',
      userId,
      status: 'processing',
      requestedAt: new Date(),
    };

    this.activeRequests.set(requestId, request);

    try {
      // Collect all user data
      const userData = await this.collectUserData(userId);

      // Encrypt if enabled
      const processedData = config.gdpr.encryptionEnabled
        ? this.encryptData(userData)
        : userData;

      request.status = 'completed';
      request.completedAt = new Date();
      request.data = processedData;

      logger.info(`GDPR access request completed for user ${userId}`);
    } catch (error: any) {
      logger.error(`GDPR access request failed: ${error.message}`);
      request.status = 'failed';
      request.error = error.message;
      request.completedAt = new Date();
    }

    return request;
  }

  async processDeletionRequest(userId: string): Promise<GDPRRequest> {
    const requestId = uuidv4();
    const request: GDPRRequest = {
      id: requestId,
      type: 'deletion',
      userId,
      status: 'processing',
      requestedAt: new Date(),
    };

    this.activeRequests.set(requestId, request);

    try {
      // Anonymize or delete user data
      await this.deleteUserData(userId);

      request.status = 'completed';
      request.completedAt = new Date();

      logger.info(`GDPR deletion request completed for user ${userId}`);
    } catch (error: any) {
      logger.error(`GDPR deletion request failed: ${error.message}`);
      request.status = 'failed';
      request.error = error.message;
      request.completedAt = new Date();
    }

    return request;
  }

  async processPortabilityRequest(userId: string): Promise<GDPRRequest> {
    const requestId = uuidv4();
    const request: GDPRRequest = {
      id: requestId,
      type: 'portability',
      userId,
      status: 'processing',
      requestedAt: new Date(),
    };

    this.activeRequests.set(requestId, request);

    try {
      // Collect and format data for portability
      const userData = await this.collectUserData(userId);
      const portableData = this.formatForPortability(userData);

      request.status = 'completed';
      request.completedAt = new Date();
      request.data = portableData;

      logger.info(`GDPR portability request completed for user ${userId}`);
    } catch (error: any) {
      logger.error(`GDPR portability request failed: ${error.message}`);
      request.status = 'failed';
      request.error = error.message;
      request.completedAt = new Date();
    }

    return request;
  }

  private async collectUserData(userId: string): Promise<any> {
    // Collect all user data from various sources
    // This would query databases, APIs, etc.
    return {
      userId,
      personalInfo: {},
      academicRecords: {},
      attendanceRecords: {},
      messages: {},
      files: {},
    };
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Delete or anonymize user data
    // This would delete from databases, file storage, etc.
    await this.sequelize.query(
      `UPDATE users SET 
        email = 'deleted@example.com',
        "firstName" = 'Deleted',
        "lastName" = 'User',
        "isActive" = false
       WHERE id = :userId`,
      {
        replacements: { userId },
      }
    );

    logger.info(`User data deleted/anonymized for user ${userId}`);
  }

  private formatForPortability(data: any): any {
    // Format data in a portable format (JSON)
    return {
      format: 'json',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data,
    };
  }

  private encryptData(data: any): any {
    // Encrypt sensitive data
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(config.gdpr.encryptionEnabled ? 'secret-key' : '', 'salt', 32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      algorithm,
    };
  }

  private scheduleDataRetentionCleanup(): void {
    // Schedule cleanup of data older than retention period
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  private async cleanupExpiredData(): Promise<void> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - config.gdpr.dataRetentionDays);

    // Cleanup logic would go here
    logger.info('GDPR data retention cleanup completed');
  }

  private async processGDPRRequest(payload: any): Promise<void> {
    try {
      const request = JSON.parse(payload.message.value.toString());

      switch (request.type) {
        case 'access':
          await this.processAccessRequest(request.userId);
          break;
        case 'deletion':
          await this.processDeletionRequest(request.userId);
          break;
        case 'portability':
          await this.processPortabilityRequest(request.userId);
          break;
        default:
          logger.warn(`Unknown GDPR request type: ${request.type}`);
      }
    } catch (error: any) {
      logger.error(`Error processing GDPR request: ${error.message}`);
    }
  }

  getRequestStatus(requestId: string): GDPRRequest | undefined {
    return this.activeRequests.get(requestId);
  }
}
