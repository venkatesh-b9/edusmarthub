import { Kafka, KafkaConfig, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { config } from '../config';
import logger from './logger';

export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor() {
    const kafkaConfig: KafkaConfig = {
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: config.kafka.retry,
    };

    this.kafka = new Kafka(kafkaConfig);
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      logger.info('Kafka producer connected');
    } catch (error) {
      logger.error(`Failed to connect Kafka producer: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      for (const consumer of this.consumers.values()) {
        await consumer.disconnect();
      }
      logger.info('Kafka client disconnected');
    } catch (error) {
      logger.error(`Error disconnecting Kafka client: ${error}`);
    }
  }

  async sendMessage(topic: string, message: any, key?: string): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            key: key || undefined,
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
      logger.debug(`Message sent to topic ${topic}`);
    } catch (error) {
      logger.error(`Error sending message to topic ${topic}: ${error}`);
      throw error;
    }
  }

  async sendBatch(topic: string, messages: Array<{ key?: string; value: any }>): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages: messages.map((msg) => ({
          key: msg.key,
          value: JSON.stringify(msg.value),
          timestamp: Date.now().toString(),
        })),
      });
      logger.debug(`Batch of ${messages.length} messages sent to topic ${topic}`);
    } catch (error) {
      logger.error(`Error sending batch to topic ${topic}: ${error}`);
      throw error;
    }
  }

  async createConsumer(groupId: string, topics: string[]): Promise<Consumer> {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topics, fromBeginning: false });
    this.consumers.set(groupId, consumer);
    logger.info(`Consumer created for group ${groupId}, topics: ${topics.join(', ')}`);
    return consumer;
  }

  async consume(
    groupId: string,
    topics: string[],
    handler: (payload: EachMessagePayload) => Promise<void>
  ): Promise<void> {
    try {
      let consumer = this.consumers.get(groupId);
      if (!consumer) {
        consumer = await this.createConsumer(groupId, topics);
      }

      await consumer.run({
        eachMessage: async (payload) => {
          try {
            await handler(payload);
          } catch (error) {
            logger.error(`Error processing message: ${error}`);
            // Handle error (retry, dead letter queue, etc.)
            throw error;
          }
        },
      });

      logger.info(`Started consuming from topics: ${topics.join(', ')}`);
    } catch (error) {
      logger.error(`Error setting up consumer: ${error}`);
      throw error;
    }
  }

  async createTopics(topics: string[]): Promise<void> {
    const admin = this.kafka.admin();
    await admin.connect();

    try {
      const existingTopics = await admin.listTopics();
      const topicsToCreate = topics.filter((topic) => !existingTopics.includes(topic));

      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map((topic) => ({
            topic,
            numPartitions: 3,
            replicationFactor: 1,
          })),
        });
        logger.info(`Created topics: ${topicsToCreate.join(', ')}`);
      }
    } catch (error) {
      logger.error(`Error creating topics: ${error}`);
      throw error;
    } finally {
      await admin.disconnect();
    }
  }
}

export const kafkaClient = new KafkaClient();
