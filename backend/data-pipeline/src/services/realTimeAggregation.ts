import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { AggregationResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';

export class RealTimeAggregationService {
  private redisClient: Redis;
  private aggregationWindows: Map<string, any[]> = new Map();
  private aggregationInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });
  }

  async startAggregation(): Promise<void> {
    logger.info('Starting real-time aggregation service');

    // Create Kafka topics
    await kafkaClient.createTopics([
      config.kafka.topics.aggregation,
      config.kafka.topics.analytics,
    ]);

    // Consume from analytics topic
    await kafkaClient.consume(
      'aggregation-processor',
      [config.kafka.topics.analytics],
      async (payload) => {
        await this.processForAggregation(payload);
      }
    );

    // Start aggregation interval
    this.aggregationInterval = setInterval(() => {
      this.aggregateWindows();
    }, config.aggregation.intervalSeconds * 1000);

    logger.info('Real-time aggregation service started');
  }

  private async processForAggregation(payload: any): Promise<void> {
    try {
      const data = JSON.parse(payload.message.value.toString());
      const windowKey = this.getWindowKey(data);

      if (!this.aggregationWindows.has(windowKey)) {
        this.aggregationWindows.set(windowKey, []);
      }

      this.aggregationWindows.get(windowKey)!.push(data);

      // Store in Redis for persistence
      await this.redisClient.lpush(`aggregation:${windowKey}`, JSON.stringify(data));
      await this.redisClient.expire(`aggregation:${windowKey}`, config.aggregation.windowSeconds * 2);
    } catch (error: any) {
      logger.error(`Error processing for aggregation: ${error.message}`);
    }
  }

  private async aggregateWindows(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.aggregation.windowSeconds * 1000);

    for (const [windowKey, data] of this.aggregationWindows.entries()) {
      if (data.length > 0) {
        const aggregation = await this.aggregateData(windowKey, data, windowStart, now);

        // Send to aggregation topic
        await kafkaClient.sendMessage(
          config.kafka.topics.aggregation,
          aggregation,
          windowKey
        );

        // Clear window
        this.aggregationWindows.set(windowKey, []);
      }
    }
  }

  private async aggregateData(
    windowKey: string,
    data: any[],
    start: Date,
    end: Date
  ): Promise<AggregationResult> {
    // Calculate aggregations
    const metrics = this.calculateMetrics(data);

    const result: AggregationResult = {
      id: uuidv4(),
      metric: windowKey,
      value: metrics.average,
      timestamp: new Date(),
      window: { start, end },
      dimensions: {
        count: data.length,
        sum: metrics.sum,
        min: metrics.min,
        max: metrics.max,
        average: metrics.average,
      },
    };

    logger.debug(`Aggregated ${data.length} records for window ${windowKey}`);
    return result;
  }

  private calculateMetrics(data: any[]): {
    sum: number;
    min: number;
    max: number;
    average: number;
  } {
    if (data.length === 0) {
      return { sum: 0, min: 0, max: 0, average: 0 };
    }

    // Extract numeric values (simplified - would be more sophisticated in production)
    const values = data
      .map((d) => {
        if (d.percentage !== undefined) return d.percentage;
        if (d.score !== undefined) return d.score;
        if (d.value !== undefined) return d.value;
        return 0;
      })
      .filter((v) => !isNaN(v));

    if (values.length === 0) {
      return { sum: 0, min: 0, max: 0, average: 0 };
    }

    return {
      sum: values.reduce((a, b) => a + b, 0),
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
    };
  }

  private getWindowKey(data: any): string {
    // Create window key based on data type and time window
    const type = data._type || 'unknown';
    const timestamp = new Date(data.timestamp || Date.now());
    const windowStart = Math.floor(
      timestamp.getTime() / (config.aggregation.windowSeconds * 1000)
    );
    return `${type}-${windowStart}`;
  }

  async getAggregation(metric: string, startTime: Date, endTime: Date): Promise<AggregationResult[]> {
    // Retrieve aggregations from Redis
    const results: AggregationResult[] = [];
    const keys = await this.redisClient.keys(`aggregation:${metric}-*`);

    for (const key of keys) {
      const data = await this.redisClient.lrange(key, 0, -1);
      for (const item of data) {
        const result = JSON.parse(item);
        const timestamp = new Date(result.timestamp);
        if (timestamp >= startTime && timestamp <= endTime) {
          results.push(result);
        }
      }
    }

    return results;
  }

  stop(): void {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    this.redisClient.quit();
  }
}
