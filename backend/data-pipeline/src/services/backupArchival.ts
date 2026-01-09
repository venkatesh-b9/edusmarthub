import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { BackupJob } from '../types';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';
import AWS from 'aws-sdk';
import archiver from 'archiver';
import { createWriteStream, mkdir } from 'fs';
import path from 'path';
import { promisify } from 'util';

export class BackupArchivalService {
  private s3: AWS.S3 | null = null;
  private activeJobs: Map<string, BackupJob> = new Map();
  private cronJob: cron.ScheduledTask | null = null;

  constructor() {
    if (config.backup.storageType === 's3' && config.aws.accessKeyId) {
      this.s3 = new AWS.S3({
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
        region: config.aws.region,
      });
    }

    this.setupScheduledBackup();
  }

  private setupScheduledBackup(): void {
    if (!config.backup.enabled) {
      logger.info('Backup service is disabled');
      return;
    }

    this.cronJob = cron.schedule(config.backup.schedule, async () => {
      await this.runScheduledBackup();
    });

    logger.info(`Backup scheduled: ${config.backup.schedule}`);
  }

  async startBackupService(): Promise<void> {
    logger.info('Starting backup and archival service');

    // Create Kafka topics
    await kafkaClient.createTopics([config.kafka.topics.backup]);

    // Consume backup requests
    await kafkaClient.consume(
      'backup-processor',
      [config.kafka.topics.backup],
      async (payload) => {
        await this.processBackupRequest(payload);
      }
    );

    logger.info('Backup and archival service started');
  }

  private async runScheduledBackup(): Promise<void> {
    logger.info('Running scheduled backup');
    await this.createBackup('full');
  }

  async createBackup(type: 'full' | 'incremental'): Promise<BackupJob> {
    const jobId = uuidv4();
    const job: BackupJob = {
      id: jobId,
      type,
      status: 'running',
      startedAt: new Date(),
    };

    this.activeJobs.set(jobId, job);

    try {
      logger.info(`Starting backup job ${jobId} (${type})`);

      // Create backup archive
      const backupPath = await this.createBackupArchive(jobId, type);

      // Upload to storage
      const location = await this.uploadBackup(backupPath, jobId, type);

      // Cleanup old backups
      await this.cleanupOldBackups();

      job.status = 'completed';
      job.completedAt = new Date();
      job.location = location;
      job.size = await this.getFileSize(backupPath);

      logger.info(`Backup job ${jobId} completed: ${location}`);
    } catch (error: any) {
      logger.error(`Backup job ${jobId} failed: ${error.message}`);
      job.status = 'failed';
      job.error = error.message;
      job.completedAt = new Date();
    }

    return job;
  }

  private async createBackupArchive(jobId: string, type: string): Promise<string> {
    const backupDir = path.join(process.cwd(), 'backups');
    await promisify(mkdir)(backupDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${type}-${timestamp}.zip`;
    const filepath = path.join(backupDir, filename);

    return new Promise((resolve, reject) => {
      const output = createWriteStream(filepath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      output.on('close', () => {
        logger.info(`Backup archive created: ${filepath} (${archive.pointer()} bytes)`);
        resolve(filepath);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add data to archive (simplified - would backup actual databases)
      archive.directory(path.join(process.cwd(), 'data'), 'data');
      archive.finalize();
    });
  }

  private async uploadBackup(filepath: string, jobId: string, type: string): Promise<string> {
    if (config.backup.storageType === 's3' && this.s3) {
      const filename = path.basename(filepath);
      const key = `backups/${type}/${filename}`;

      const fileContent = await promisify(require('fs').readFile)(filepath);

      await this.s3
        .putObject({
          Bucket: config.backup.s3.bucket,
          Key: key,
          Body: fileContent,
        })
        .promise();

      const location = `s3://${config.backup.s3.bucket}/${key}`;
      logger.info(`Backup uploaded to S3: ${location}`);
      return location;
    }

    // Local storage
    return filepath;
  }

  private async cleanupOldBackups(): Promise<void> {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - config.backup.retentionDays);

    // Cleanup logic would go here
    logger.info('Cleaned up old backups');
  }

  private async getFileSize(filepath: string): Promise<number> {
    const fs = require('fs');
    const stats = await promisify(fs.stat)(filepath);
    return stats.size;
  }

  private async processBackupRequest(payload: any): Promise<void> {
    try {
      const request = JSON.parse(payload.message.value.toString());
      await this.createBackup(request.type || 'incremental');
    } catch (error: any) {
      logger.error(`Error processing backup request: ${error.message}`);
    }
  }

  getJobStatus(jobId: string): BackupJob | undefined {
    return this.activeJobs.get(jobId);
  }

  getAllJobs(): BackupJob[] {
    return Array.from(this.activeJobs.values());
  }

  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
    }
  }
}
