import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { PipelineMetrics, DataQualityMetric } from '../types';
import axios from 'axios';
import Redis from 'ioredis';
import * as promClient from 'prom-client';

const { Registry, Counter, Histogram, Gauge } = promClient;

export class MonitoringAlertingService {
  private redisClient: Redis;
  private metricsRegistry: Registry;
  private metrics: {
    recordsProcessed: Counter;
    recordsFailed: Counter;
    processingLatency: Histogram;
    throughput: Gauge;
    errorRate: Gauge;
  };
  private qualityMetrics: DataQualityMetric[] = [];

  constructor() {
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });

    this.metricsRegistry = new Registry();
    this.setupMetrics();
  }

  private setupMetrics(): void {
    this.metrics = {
      recordsProcessed: new Counter({
        name: 'pipeline_records_processed_total',
        help: 'Total number of records processed',
        registers: [this.metricsRegistry],
      }),
      recordsFailed: new Counter({
        name: 'pipeline_records_failed_total',
        help: 'Total number of records failed',
        registers: [this.metricsRegistry],
      }),
      processingLatency: new Histogram({
        name: 'pipeline_processing_latency_seconds',
        help: 'Processing latency in seconds',
        buckets: [0.1, 0.5, 1, 2, 5, 10],
        registers: [this.metricsRegistry],
      }),
      throughput: new Gauge({
        name: 'pipeline_throughput_records_per_second',
        help: 'Current throughput in records per second',
        registers: [this.metricsRegistry],
      }),
      errorRate: new Gauge({
        name: 'pipeline_error_rate',
        help: 'Current error rate as percentage',
        registers: [this.metricsRegistry],
      }),
    };
  }

  async startMonitoring(): Promise<void> {
    if (!config.monitoring.enabled) {
      logger.info('Monitoring is disabled');
      return;
    }

    logger.info('Starting monitoring and alerting service');

    // Start metrics collection
    this.startMetricsCollection();

    // Start quality metrics collection
    if (config.dataQuality.enabled) {
      this.startQualityMetricsCollection();
    }

    logger.info('Monitoring and alerting service started');
  }

  recordProcessed(latency: number = 0): void {
    this.metrics.recordsProcessed.inc();
    this.metrics.processingLatency.observe(latency);
  }

  recordFailed(): void {
    this.metrics.recordsFailed.inc();
  }

  updateThroughput(throughput: number): void {
    this.metrics.throughput.set(throughput);
  }

  updateErrorRate(errorRate: number): void {
    this.metrics.errorRate.set(errorRate);
  }

  private startMetricsCollection(): void {
    setInterval(async () => {
      const metrics = await this.calculateMetrics();
      await this.storeMetrics(metrics);
      await this.checkAlerts(metrics);
    }, 60000); // Every minute
  }

  private async calculateMetrics(): Promise<PipelineMetrics> {
    const processed = await this.redisClient.get('metrics:processed') || '0';
    const failed = await this.redisClient.get('metrics:failed') || '0';
    const total = parseInt(processed) + parseInt(failed);

    const throughput = parseFloat(await this.redisClient.get('metrics:throughput') || '0');
    const latency = parseFloat(await this.redisClient.get('metrics:latency') || '0');
    const errorRate = total > 0 ? (parseInt(failed) / total) * 100 : 0;

    return {
      recordsProcessed: parseInt(processed),
      recordsFailed: parseInt(failed),
      throughput,
      latency,
      errorRate,
      timestamp: new Date(),
    };
  }

  private async storeMetrics(metrics: PipelineMetrics): Promise<void> {
    await this.redisClient.setex(
      `metrics:${Date.now()}`,
      3600,
      JSON.stringify(metrics)
    );
  }

  private async checkAlerts(metrics: PipelineMetrics): Promise<void> {
    if (!config.alerting.enabled) return;

    // Check error rate
    if (metrics.errorRate > 5) {
      await this.sendAlert('high_error_rate', {
        errorRate: metrics.errorRate,
        threshold: 5,
        message: `Error rate is ${metrics.errorRate.toFixed(2)}%, exceeding threshold of 5%`,
      });
    }

    // Check throughput
    if (metrics.throughput < 10) {
      await this.sendAlert('low_throughput', {
        throughput: metrics.throughput,
        threshold: 10,
        message: `Throughput is ${metrics.throughput.toFixed(2)} records/sec, below threshold of 10`,
      });
    }

    // Check latency
    if (metrics.latency > 5000) {
      await this.sendAlert('high_latency', {
        latency: metrics.latency,
        threshold: 5000,
        message: `Processing latency is ${metrics.latency}ms, exceeding threshold of 5000ms`,
      });
    }
  }

  private async sendAlert(type: string, data: any): Promise<void> {
    logger.warn(`Alert: ${type} - ${data.message}`);

    // Send webhook if configured
    if (config.alerting.webhookUrl) {
      try {
        await axios.post(config.alerting.webhookUrl, {
          type,
          ...data,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(`Failed to send alert webhook: ${error}`);
      }
    }
  }

  private startQualityMetricsCollection(): void {
    setInterval(async () => {
      const qualityMetrics = await this.calculateQualityMetrics();
      this.qualityMetrics = qualityMetrics;

      // Check quality thresholds
      for (const metric of qualityMetrics) {
        if (metric.status === 'fail') {
          await this.sendAlert('data_quality_failure', {
            metric: metric.metric,
            value: metric.value,
            threshold: metric.threshold,
            message: `Data quality metric ${metric.metric} failed: ${metric.value} < ${metric.threshold}`,
          });
        }
      }
    }, config.dataQuality.metricsInterval);
  }

  private async calculateQualityMetrics(): Promise<DataQualityMetric[]> {
    // Calculate data quality metrics
    const completeness = await this.calculateCompleteness();
    const accuracy = await this.calculateAccuracy();
    const consistency = await this.calculateConsistency();

    return [
      {
        metric: 'completeness',
        value: completeness,
        threshold: config.dataQuality.threshold,
        status: completeness >= config.dataQuality.threshold ? 'pass' : 'fail',
        timestamp: new Date(),
      },
      {
        metric: 'accuracy',
        value: accuracy,
        threshold: config.dataQuality.threshold,
        status: accuracy >= config.dataQuality.threshold ? 'pass' : 'fail',
        timestamp: new Date(),
      },
      {
        metric: 'consistency',
        value: consistency,
        threshold: config.dataQuality.threshold,
        status: consistency >= config.dataQuality.threshold ? 'pass' : 'fail',
        timestamp: new Date(),
      },
    ];
  }

  private async calculateCompleteness(): Promise<number> {
    // Calculate data completeness (simplified)
    return 0.98; // Would be calculated from actual data
  }

  private async calculateAccuracy(): Promise<number> {
    // Calculate data accuracy (simplified)
    return 0.95; // Would be calculated from validation results
  }

  private async calculateConsistency(): Promise<number> {
    // Calculate data consistency (simplified)
    return 0.97; // Would be calculated from data checks
  }

  async getMetrics(): Promise<string> {
    return this.metricsRegistry.metrics();
  }

  getQualityMetrics(): DataQualityMetric[] {
    return this.qualityMetrics;
  }

  async cleanup(): Promise<void> {
    await this.redisClient.quit();
  }
}
