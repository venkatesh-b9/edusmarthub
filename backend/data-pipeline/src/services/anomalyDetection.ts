import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { AnomalyDetectionResult } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { mean, standardDeviation } from 'simple-statistics';

export class AnomalyDetectionService {
  private dataWindows: Map<string, number[]> = new Map();
  private anomalyHistory: AnomalyDetectionResult[] = [];

  async startAnomalyDetection(): Promise<void> {
    if (!config.anomaly.enabled) {
      logger.info('Anomaly detection is disabled');
      return;
    }

    logger.info('Starting anomaly detection service');

    // Create Kafka topics
    await kafkaClient.createTopics([
      config.kafka.topics.anomaly,
      config.kafka.topics.analytics,
    ]);

    // Consume from analytics topic
    await kafkaClient.consume(
      'anomaly-detector',
      [config.kafka.topics.analytics],
      async (payload) => {
        await this.detectAnomaly(payload);
      }
    );

    logger.info('Anomaly detection service started');
  }

  private async detectAnomaly(payload: any): Promise<void> {
    try {
      const data = JSON.parse(payload.message.value.toString());
      const value = this.extractNumericValue(data);

      if (value === null) {
        return; // Skip non-numeric data
      }

      const key = this.getDataKey(data);
      
      // Maintain sliding window
      if (!this.dataWindows.has(key)) {
        this.dataWindows.set(key, []);
      }

      const window = this.dataWindows.get(key)!;
      window.push(value);

      // Keep window size
      if (window.length > config.anomaly.windowSize) {
        window.shift();
      }

      // Detect anomaly if we have enough data
      if (window.length >= 10) {
        const isAnomaly = this.isAnomaly(value, window);

        if (isAnomaly) {
          const result: AnomalyDetectionResult = {
            recordId: data.id || uuidv4(),
            isAnomaly: true,
            score: this.calculateAnomalyScore(value, window),
            reason: this.getAnomalyReason(value, window),
            timestamp: new Date(),
          };

          // Send to anomaly topic
          await kafkaClient.sendMessage(
            config.kafka.topics.anomaly,
            {
              ...result,
              originalData: data,
            },
            result.recordId
          );

          this.anomalyHistory.push(result);
          logger.warn(`Anomaly detected: ${result.reason} (score: ${result.score})`);
        }
      }
    } catch (error: any) {
      logger.error(`Error detecting anomaly: ${error.message}`);
    }
  }

  private extractNumericValue(data: any): number | null {
    if (typeof data === 'number') {
      return data;
    }

    if (data.percentage !== undefined) return data.percentage;
    if (data.score !== undefined) return data.score;
    if (data.value !== undefined) return data.value;
    if (data.amount !== undefined) return data.amount;

    return null;
  }

  private getDataKey(data: any): string {
    return `${data._type || 'unknown'}-${data._source || 'unknown'}`;
  }

  private isAnomaly(value: number, window: number[]): boolean {
    if (window.length < 10) return false;

    const avg = mean(window);
    const stdDev = standardDeviation(window);

    if (stdDev === 0) return false; // No variation

    const zScore = Math.abs((value - avg) / stdDev);
    return zScore > config.anomaly.threshold;
  }

  private calculateAnomalyScore(value: number, window: number[]): number {
    const avg = mean(window);
    const stdDev = standardDeviation(window);

    if (stdDev === 0) return 0;

    const zScore = Math.abs((value - avg) / stdDev);
    return Math.min(zScore, 10); // Cap at 10
  }

  private getAnomalyReason(value: number, window: number[]): string {
    const avg = mean(window);
    const stdDev = standardDeviation(window);
    const zScore = (value - avg) / stdDev;

    if (zScore > config.anomaly.threshold) {
      return `Value ${value.toFixed(2)} is ${zScore.toFixed(2)} standard deviations above mean`;
    } else if (zScore < -config.anomaly.threshold) {
      return `Value ${value.toFixed(2)} is ${Math.abs(zScore).toFixed(2)} standard deviations below mean`;
    }

    return 'Statistical anomaly detected';
  }

  getAnomalyHistory(limit: number = 100): AnomalyDetectionResult[] {
    return this.anomalyHistory.slice(-limit);
  }
}
