import { kafkaClient } from '../utils/kafkaClient';
import { config } from '../config';
import logger from '../utils/logger';
import { DataRecord } from '../types';
import _ from 'lodash';

export class DataCleansingService {
  async startCleansing(): Promise<void> {
    logger.info('Starting data cleansing service');

    // Create Kafka topics
    await kafkaClient.createTopics([
      config.kafka.topics.ingestion,
      config.kafka.topics.validation,
    ]);

    // Consume from ingestion topic
    await kafkaClient.consume(
      'data-cleanser',
      [config.kafka.topics.ingestion],
      async (payload) => {
        await this.cleanseRecord(payload);
      }
    );

    logger.info('Data cleansing service started');
  }

  private async cleanseRecord(payload: any): Promise<void> {
    try {
      const record: DataRecord = JSON.parse(payload.message.value.toString());

      // Perform cleansing operations
      const cleansed = await this.cleanse(record);

      // Send to validation topic
      await kafkaClient.sendMessage(
        config.kafka.topics.validation,
        cleansed,
        record.id
      );

      logger.debug(`Cleansed record: ${record.id}`);
    } catch (error: any) {
      logger.error(`Error cleansing record: ${error.message}`);
    }
  }

  private async cleanse(record: DataRecord): Promise<DataRecord> {
    let cleansed = _.cloneDeep(record);

    // Remove null/undefined values
    cleansed.data = this.removeNullValues(cleansed.data);

    // Normalize strings
    cleansed.data = this.normalizeStrings(cleansed.data);

    // Remove duplicates
    cleansed.data = this.removeDuplicates(cleansed.data);

    // Standardize formats
    cleansed.data = this.standardizeFormats(cleansed.data);

    // Add cleansing metadata
    cleansed.metadata = {
      ...cleansed.metadata,
      cleansed: true,
      cleansingTime: new Date().toISOString(),
    };

    return cleansed;
  }

  private removeNullValues(data: any): any {
    if (Array.isArray(data)) {
      return data.filter((item) => item !== null && item !== undefined);
    }

    if (typeof data === 'object' && data !== null) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
          cleaned[key] = this.removeNullValues(value);
        }
      }
      return cleaned;
    }

    return data;
  }

  private normalizeStrings(data: any): any {
    if (typeof data === 'string') {
      return data.trim().replace(/\s+/g, ' ');
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.normalizeStrings(item));
    }

    if (typeof data === 'object' && data !== null) {
      const normalized: any = {};
      for (const [key, value] of Object.entries(data)) {
        normalized[key] = this.normalizeStrings(value);
      }
      return normalized;
    }

    return data;
  }

  private removeDuplicates(data: any): any {
    if (Array.isArray(data)) {
      return _.uniqBy(data, JSON.stringify);
    }
    return data;
  }

  private standardizeFormats(data: any): any {
    if (typeof data === 'object' && data !== null) {
      const standardized: any = {};

      for (const [key, value] of Object.entries(data)) {
        // Standardize date formats
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
          standardized[key] = this.standardizeDate(value);
        }
        // Standardize email formats
        else if (key.toLowerCase().includes('email')) {
          standardized[key] = this.standardizeEmail(value);
        }
        // Standardize phone formats
        else if (key.toLowerCase().includes('phone')) {
          standardized[key] = this.standardizePhone(value);
        }
        else {
          standardized[key] = value;
        }
      }

      return standardized;
    }

    return data;
  }

  private standardizeDate(value: any): string | any {
    if (!value) return value;

    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      // Invalid date, return as is
    }

    return value;
  }

  private standardizeEmail(value: any): string | any {
    if (typeof value === 'string') {
      return value.toLowerCase().trim();
    }
    return value;
  }

  private standardizePhone(value: any): string | any {
    if (typeof value === 'string') {
      // Remove all non-digit characters
      return value.replace(/\D/g, '');
    }
    return value;
  }
}
