import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { DataRecord, ETLJob } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { RetryHandler } from '../utils/retryHandler';
import { DataValidator } from '../utils/dataValidator';
import { DataTransformer } from '../utils/dataTransformer';
import { DataLoader } from '../utils/dataLoader';

export class ETLService {
  private retryHandler: RetryHandler;
  private validator: DataValidator;
  private transformer: DataTransformer;
  private loader: DataLoader;
  private activeJobs: Map<string, ETLJob> = new Map();

  constructor() {
    this.retryHandler = new RetryHandler({
      maxAttempts: config.etl.retryAttempts,
      delay: config.etl.retryDelay,
    });
    this.validator = new DataValidator();
    this.transformer = new DataTransformer();
    this.loader = new DataLoader();
  }

  async startETLProcessing(): Promise<void> {
    logger.info('Starting ETL processing service');

    // Create Kafka topics
    await kafkaClient.createTopics([
      config.kafka.topics.ingestion,
      config.kafka.topics.analytics,
    ]);

    // Consume from ingestion topic
    await kafkaClient.consume(
      'etl-processor',
      [config.kafka.topics.ingestion],
      async (payload) => {
        await this.processRecord(payload);
      }
    );

    logger.info('ETL processing service started');
  }

  private async processRecord(payload: any): Promise<void> {
    try {
      const record: DataRecord = JSON.parse(payload.message.value.toString());
      const jobId = uuidv4();

      const job: ETLJob = {
        id: jobId,
        name: `ETL-${record.source}-${record.type}`,
        source: record.source,
        destination: 'analytics',
        status: 'running',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsFailed: 0,
      };

      this.activeJobs.set(jobId, job);

      // Extract: Data is already extracted (from ingestion)
      // Transform: Transform the data
      const transformedData = await this.transformer.transform(record);

      // Validate: Validate transformed data
      const validationResult = await this.validator.validate(transformedData);

      if (!validationResult.isValid && config.validation.strictMode) {
        throw new Error(`Validation failed: ${validationResult.errors.map((e) => e.message).join(', ')}`);
      }

      // Load: Load to destination
      await this.loader.load(transformedData, 'analytics');

      // Send to analytics topic
      await kafkaClient.sendMessage(
        config.kafka.topics.analytics,
        {
          ...transformedData,
          validationResult,
          etlJobId: jobId,
        },
        record.id
      );

      job.status = 'completed';
      job.completedAt = new Date();
      job.recordsProcessed = 1;

      logger.info(`ETL job completed: ${jobId}`);
    } catch (error: any) {
      logger.error(`ETL processing error: ${error.message}`);
      
      // Update job status
      const job = Array.from(this.activeJobs.values()).find(
        (j) => j.status === 'running'
      );
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        job.recordsFailed = 1;
      }

      // Retry or send to dead letter queue
      if (config.errorHandling.deadLetterQueue) {
        await kafkaClient.sendMessage('dead-letter-queue', {
          payload: payload.message.value.toString(),
          error: error.message,
          timestamp: new Date(),
        });
      }
    }
  }

  async runETLJob(source: string, destination: string, data: any[]): Promise<ETLJob> {
    const jobId = uuidv4();
    const job: ETLJob = {
      id: jobId,
      name: `ETL-${source}-${destination}`,
      source,
      destination,
      status: 'running',
      startedAt: new Date(),
      recordsProcessed: 0,
      recordsFailed: 0,
    };

    this.activeJobs.set(jobId, job);

    try {
      for (const item of data) {
        try {
          const record: DataRecord = {
            id: uuidv4(),
            source,
            type: 'custom',
            timestamp: new Date(),
            data: item,
          };

          const transformed = await this.transformer.transform(record);
          const validated = await this.validator.validate(transformed);

          if (validated.isValid || !config.validation.strictMode) {
            await this.loader.load(transformed, destination);
            job.recordsProcessed++;
          } else {
            job.recordsFailed++;
          }
        } catch (error: any) {
          logger.error(`Error processing record in ETL job: ${error.message}`);
          job.recordsFailed++;
        }
      }

      job.status = 'completed';
      job.completedAt = new Date();
    } catch (error: any) {
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }

    return job;
  }

  getJobStatus(jobId: string): ETLJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): ETLJob[] {
    return Array.from(this.activeJobs.values());
  }
}
