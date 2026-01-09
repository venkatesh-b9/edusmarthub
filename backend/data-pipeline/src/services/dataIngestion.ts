import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import axios from 'axios';
import { DataRecord } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { RetryHandler } from '../utils/retryHandler';

export class DataIngestionService {
  private retryHandler: RetryHandler;
  private ingestionInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.retryHandler = new RetryHandler({
      maxAttempts: config.errorHandling.retryAttempts,
      delay: config.errorHandling.retryDelay,
    });
  }

  async startIngestion(): Promise<void> {
    logger.info('Starting data ingestion service');

    // Create Kafka topics if needed
    await kafkaClient.createTopics([config.kafka.topics.ingestion]);

    // Start ingesting from multiple sources
    await this.ingestFromSource('attendance', config.dataSources.attendance);
    await this.ingestFromSource('grades', config.dataSources.grades);
    await this.ingestFromSource('users', config.dataSources.users);
    await this.ingestFromSource('analytics', config.dataSources.analytics);

    // Set up periodic ingestion
    this.ingestionInterval = setInterval(() => {
      this.ingestAllSources();
    }, 60000); // Every minute

    logger.info('Data ingestion service started');
  }

  async stopIngestion(): Promise<void> {
    if (this.ingestionInterval) {
      clearInterval(this.ingestionInterval);
      this.ingestionInterval = null;
    }
    logger.info('Data ingestion service stopped');
  }

  private async ingestAllSources(): Promise<void> {
    const sources = [
      { name: 'attendance', url: config.dataSources.attendance },
      { name: 'grades', url: config.dataSources.grades },
      { name: 'users', url: config.dataSources.users },
      { name: 'analytics', url: config.dataSources.analytics },
    ];

    await Promise.all(
      sources.map((source) => this.ingestFromSource(source.name, source.url))
    );
  }

  private async ingestFromSource(sourceName: string, sourceUrl: string): Promise<void> {
    try {
      const response = await this.retryHandler.execute(async () => {
        return await axios.get(sourceUrl, {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
          },
        });
      });

      const data = response.data.data || response.data;
      const records = Array.isArray(data) ? data : [data];

      for (const item of records) {
        const record: DataRecord = {
          id: uuidv4(),
          source: sourceName,
          type: this.inferDataType(item),
          timestamp: new Date(),
          data: item,
          metadata: {
            ingestionTime: new Date().toISOString(),
            sourceUrl,
          },
        };

        // Send to Kafka
        await kafkaClient.sendMessage(
          config.kafka.topics.ingestion,
          record,
          `${sourceName}-${record.id}`
        );
      }

      logger.info(`Ingested ${records.length} records from ${sourceName}`);
    } catch (error: any) {
      logger.error(`Error ingesting from ${sourceName}: ${error.message}`);
      
      // Send to dead letter queue if enabled
      if (config.errorHandling.deadLetterQueue) {
        await this.sendToDeadLetterQueue(sourceName, sourceUrl, error);
      }
    }
  }

  async ingestCustomData(source: string, data: any): Promise<void> {
    try {
      const record: DataRecord = {
        id: uuidv4(),
        source,
        type: this.inferDataType(data),
        timestamp: new Date(),
        data,
        metadata: {
          ingestionTime: new Date().toISOString(),
          custom: true,
        },
      };

      await kafkaClient.sendMessage(
        config.kafka.topics.ingestion,
        record,
        `${source}-${record.id}`
      );

      logger.info(`Ingested custom data from ${source}`);
    } catch (error: any) {
      logger.error(`Error ingesting custom data: ${error.message}`);
      throw error;
    }
  }

  private inferDataType(data: any): string {
    if (data.studentId) return 'student';
    if (data.teacherId) return 'teacher';
    if (data.attendance) return 'attendance';
    if (data.grade || data.score) return 'grade';
    if (data.schoolId) return 'school';
    return 'unknown';
  }

  private async sendToDeadLetterQueue(source: string, url: string, error: any): Promise<void> {
    try {
      await kafkaClient.sendMessage('dead-letter-queue', {
        source,
        url,
        error: error.message,
        timestamp: new Date(),
        retryCount: 0,
      });
      logger.warn(`Sent failed ingestion to dead letter queue: ${source}`);
    } catch (dlqError) {
      logger.error(`Failed to send to dead letter queue: ${dlqError}`);
    }
  }
}
