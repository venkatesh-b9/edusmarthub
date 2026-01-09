import amqp from 'amqplib';
import logger from '../shared/utils/logger';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const queuePrefix = process.env.RABBITMQ_QUEUE_PREFIX || 'edusmarthub';

export const connectRabbitMQ = async (): Promise<void> => {
  try {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    
    logger.info('RabbitMQ connected successfully');
    
    // Ensure queues exist
    await channel.assertQueue(`${queuePrefix}.notifications`, { durable: true });
    await channel.assertQueue(`${queuePrefix}.emails`, { durable: true });
    await channel.assertQueue(`${queuePrefix}.analytics`, { durable: true });
    
    connection.on('error', (error) => {
      logger.error('RabbitMQ connection error:', error);
    });
    
    connection.on('close', () => {
      logger.warn('RabbitMQ connection closed');
    });
  } catch (error) {
    logger.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = (): amqp.Channel => {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized');
  }
  return channel;
};

export const publishMessage = async (
  queue: string,
  message: any
): Promise<void> => {
  try {
    const ch = getChannel();
    const queueName = `${queuePrefix}.${queue}`;
    await ch.assertQueue(queueName, { durable: true });
    ch.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    logger.debug(`Message published to queue: ${queueName}`);
  } catch (error) {
    logger.error(`Failed to publish message to ${queue}:`, error);
    throw error;
  }
};

export const consumeMessage = async (
  queue: string,
  callback: (message: any) => Promise<void>
): Promise<void> => {
  try {
    const ch = getChannel();
    const queueName = `${queuePrefix}.${queue}`;
    await ch.assertQueue(queueName, { durable: true });
    ch.consume(queueName, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          ch.ack(msg);
        } catch (error) {
          logger.error(`Error processing message from ${queueName}:`, error);
          ch.nack(msg, false, false); // Reject and don't requeue
        }
      }
    });
    logger.info(`Started consuming from queue: ${queueName}`);
  } catch (error) {
    logger.error(`Failed to consume from ${queue}:`, error);
    throw error;
  }
};

export const disconnectRabbitMQ = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close();
    }
    if (connection) {
      await connection.close();
    }
    logger.info('RabbitMQ disconnected');
  } catch (error) {
    logger.error('Error disconnecting RabbitMQ:', error);
    throw error;
  }
};
