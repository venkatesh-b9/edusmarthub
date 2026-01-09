import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { BatchJob } from '../types';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { json2csv } from 'json2csv';

export class BatchProcessingService {
  private activeJobs: Map<string, BatchJob> = new Map();
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    this.setupScheduledProcessing();
  }

  private setupScheduledProcessing(): void {
    // Schedule batch processing based on config
    this.cronJob = cron.schedule(config.batch.schedule, async () => {
      await this.runScheduledBatch();
    });

    logger.info(`Batch processing scheduled: ${config.batch.schedule}`);
  }

  async startBatchProcessing(): Promise<void> {
    logger.info('Starting batch processing service');

    // Create Kafka topics
    await kafkaClient.createTopics([config.kafka.topics.batch]);

    // Consume batch processing requests
    await kafkaClient.consume(
      'batch-processor',
      [config.kafka.topics.batch],
      async (payload) => {
        await this.processBatchRequest(payload);
      }
    );

    logger.info('Batch processing service started');
  }

  private async runScheduledBatch(): Promise<void> {
    logger.info('Running scheduled batch processing');
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - config.batch.windowSizeHours * 60 * 60 * 1000);

    await this.runBatchJob('scheduled', startTime, endTime);
  }

  async runBatchJob(type: string, startTime: Date, endTime: Date): Promise<BatchJob> {
    const jobId = uuidv4();
    const job: BatchJob = {
      id: jobId,
      type,
      startTime,
      endTime,
      status: 'running',
      recordsProcessed: 0,
    };

    this.activeJobs.set(jobId, job);

    try {
      logger.info(`Starting batch job ${jobId} for period ${startTime} to ${endTime}`);

      // Collect data from various sources
      const data = await this.collectBatchData(startTime, endTime);

      // Process data
      const processedData = await this.processBatchData(data);

      // Generate report
      const outputPath = await this.generateReport(jobId, processedData, type);

      job.status = 'completed';
      job.recordsProcessed = processedData.length;
      job.outputPath = outputPath;

      logger.info(`Batch job ${jobId} completed: ${processedData.length} records processed`);
    } catch (error: any) {
      logger.error(`Batch job ${jobId} failed: ${error.message}`);
      job.status = 'failed';
      job.error = error.message;
    }

    return job;
  }

  private async collectBatchData(startTime: Date, endTime: Date): Promise<any[]> {
    // In production, this would query databases/APIs
    // For now, return mock structure
    return [
      {
        type: 'attendance',
        count: 1000,
        period: { startTime, endTime },
      },
      {
        type: 'grades',
        count: 500,
        period: { startTime, endTime },
      },
    ];
  }

  private async processBatchData(data: any[]): Promise<any[]> {
    // Process and aggregate data
    return data.map((item) => ({
      ...item,
      processedAt: new Date(),
      aggregated: true,
    }));
  }

  private async generateReport(jobId: string, data: any[], type: string): Promise<string> {
    const outputDir = path.join(process.cwd(), 'reports', type);
    await mkdir(outputDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-${timestamp}.${config.batch.outputFormat}`;
    const filepath = path.join(outputDir, filename);

    if (config.batch.outputFormat === 'json') {
      await writeFile(filepath, JSON.stringify(data, null, 2));
    } else if (config.batch.outputFormat === 'csv') {
      const csv = json2csv.parse(data);
      await writeFile(filepath, csv);
    }

    logger.info(`Report generated: ${filepath}`);
    return filepath;
  }

  private async processBatchRequest(payload: any): Promise<void> {
    try {
      const request = JSON.parse(payload.message.value.toString());
      await this.runBatchJob(
        request.type || 'custom',
        new Date(request.startTime),
        new Date(request.endTime)
      );
    } catch (error: any) {
      logger.error(`Error processing batch request: ${error.message}`);
    }
  }

  getJobStatus(jobId: string): BatchJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): BatchJob[] {
    return Array.from(this.activeJobs.values());
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }
}
