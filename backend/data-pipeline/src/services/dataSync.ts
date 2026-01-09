import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { SyncJob } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { RetryHandler } from '../utils/retryHandler';
import axios from 'axios';

export class DataSyncService {
  private retryHandler: RetryHandler;
  private activeJobs: Map<string, SyncJob> = new Map();

  constructor() {
    this.retryHandler = new RetryHandler({
      maxAttempts: config.errorHandling.retryAttempts,
      delay: config.errorHandling.retryDelay,
    });
  }

  async startSyncService(): Promise<void> {
    logger.info('Starting data synchronization service');

    // Create Kafka topics
    await kafkaClient.createTopics([config.kafka.topics.sync]);

    // Consume sync requests
    await kafkaClient.consume(
      'sync-processor',
      [config.kafka.topics.sync],
      async (payload) => {
        await this.processSyncRequest(payload);
      }
    );

    logger.info('Data synchronization service started');
  }

  async syncData(source: string, destination: string, data?: any[]): Promise<SyncJob> {
    const jobId = uuidv4();
    const job: SyncJob = {
      id: jobId,
      source,
      destination,
      status: 'running',
      recordsSynced: 0,
      startedAt: new Date(),
    };

    this.activeJobs.set(jobId, job);

    try {
      logger.info(`Starting sync job ${jobId}: ${source} -> ${destination}`);

      // Fetch data from source if not provided
      const dataToSync = data || await this.fetchFromSource(source);

      // Transform data if needed
      const transformedData = await this.transformForDestination(dataToSync, destination);

      // Sync to destination
      await this.syncToDestination(destination, transformedData);

      job.status = 'completed';
      job.completedAt = new Date();
      job.recordsSynced = transformedData.length;

      logger.info(`Sync job ${jobId} completed: ${job.recordsSynced} records synced`);
    } catch (error: any) {
      logger.error(`Sync job ${jobId} failed: ${error.message}`);
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }

    return job;
  }

  private async fetchFromSource(source: string): Promise<any[]> {
    // Fetch data from source service
    const response = await this.retryHandler.execute(async () => {
      return await axios.get(source, { timeout: 30000 });
    });

    return Array.isArray(response.data.data) ? response.data.data : [response.data.data];
  }

  private async transformForDestination(data: any[], destination: string): Promise<any[]> {
    // Transform data based on destination requirements
    return data.map((item) => ({
      ...item,
      syncedAt: new Date().toISOString(),
      destination,
    }));
  }

  private async syncToDestination(destination: string, data: any[]): Promise<void> {
    // Sync data to destination
    // This would integrate with the destination service
    for (const item of data) {
      await this.retryHandler.execute(async () => {
        // In production, this would make API calls to destination
        await new Promise((resolve) => setTimeout(resolve, 10));
      });
    }
  }

  private async processSyncRequest(payload: any): Promise<void> {
    try {
      const request = JSON.parse(payload.message.value.toString());
      await this.syncData(request.source, request.destination, request.data);
    } catch (error: any) {
      logger.error(`Error processing sync request: ${error.message}`);
    }
  }

  getJobStatus(jobId: string): SyncJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): SyncJob[] {
    return Array.from(this.activeJobs.values());
  }
}
