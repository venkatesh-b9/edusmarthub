import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { DataRecord } from '../types';

export class PredictiveAnalyticsService {
  async startPredictiveService(): Promise<void> {
    logger.info('Starting predictive analytics data preparation service');

    // Create Kafka topics
    await kafkaClient.createTopics([config.kafka.topics.predictive]);

    // Consume from analytics topic
    await kafkaClient.consume(
      'predictive-processor',
      [config.kafka.topics.analytics],
      async (payload) => {
        await this.prepareForPredictiveAnalytics(payload);
      }
    );

    logger.info('Predictive analytics service started');
  }

  private async prepareForPredictiveAnalytics(payload: any): Promise<void> {
    try {
      const data = JSON.parse(payload.message.value.toString());

      // Feature engineering
      const features = this.extractFeatures(data);

      // Data normalization
      const normalized = this.normalizeFeatures(features);

      // Create time series data
      const timeSeries = this.createTimeSeries(normalized);

      // Send to predictive analytics topic
      await kafkaClient.sendMessage(
        config.kafka.topics.predictive,
        {
          features: normalized,
          timeSeries,
          metadata: {
            preparedAt: new Date().toISOString(),
            source: data._source,
            type: data._type,
          },
        },
        data.id
      );

      logger.debug(`Prepared data for predictive analytics: ${data.id}`);
    } catch (error: any) {
      logger.error(`Error preparing predictive analytics data: ${error.message}`);
    }
  }

  private extractFeatures(data: any): Record<string, number> {
    const features: Record<string, number> = {};

    // Extract numeric features
    if (data.percentage !== undefined) features.percentage = data.percentage;
    if (data.score !== undefined) features.score = data.score;
    if (data.attendanceRate !== undefined) features.attendanceRate = data.attendanceRate;
    if (data.completionRate !== undefined) features.completionRate = data.completionRate;

    // Extract derived features
    if (data.isPresent !== undefined) features.isPresent = data.isPresent ? 1 : 0;
    if (data.isPassing !== undefined) features.isPassing = data.isPassing ? 1 : 0;

    // Extract temporal features
    if (data.timestamp) {
      const date = new Date(data.timestamp);
      features.dayOfWeek = date.getDay();
      features.hourOfDay = date.getHours();
      features.month = date.getMonth();
    }

    return features;
  }

  private normalizeFeatures(features: Record<string, number>): Record<string, number> {
    const normalized: Record<string, number> = {};

    // Min-max normalization for numeric features
    const maxValues: Record<string, number> = {
      percentage: 100,
      score: 100,
      attendanceRate: 100,
      completionRate: 100,
    };

    for (const [key, value] of Object.entries(features)) {
      if (maxValues[key]) {
        normalized[key] = value / maxValues[key];
      } else {
        normalized[key] = value;
      }
    }

    return normalized;
  }

  private createTimeSeries(data: any): any[] {
    // Create time series representation
    // This would aggregate data over time windows
    return [
      {
        timestamp: new Date().toISOString(),
        values: data,
      },
    ];
  }
}
