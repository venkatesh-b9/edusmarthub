import { Message } from '../types';
import { Sequelize, DataTypes, Op } from 'sequelize';
import { config } from '../config';
import logger from './logger';

const sequelize = new Sequelize(
  config.database.postgres.database,
  config.database.postgres.user,
  config.database.postgres.password,
  {
    host: config.database.postgres.host,
    port: config.database.postgres.port,
    dialect: 'postgres',
    logging: false,
  }
);

const MessageModel = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    roomId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'realtime_messages',
    indexes: [
      { fields: ['roomId', 'timestamp'] },
      { fields: ['senderId'] },
      { fields: ['type'] },
    ],
  }
);

export class MessagePersistence {
  async initialize() {
    try {
      await sequelize.authenticate();
      await MessageModel.sync({ alter: false });
      logger.info('Message persistence initialized');
    } catch (error) {
      logger.error(`Message persistence initialization error: ${error}`);
    }
  }

  async saveMessage(message: Message): Promise<void> {
    try {
      if (!config.persistence.enabled) return;

      await MessageModel.create({
        id: message.id,
        roomId: message.roomId,
        senderId: message.senderId,
        senderName: message.senderName,
        type: message.type,
        content: message.content,
        metadata: message.metadata,
        timestamp: message.timestamp,
      });
    } catch (error) {
      logger.error(`Error saving message: ${error}`);
    }
  }

  async getRecentMessages(roomId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messages = await MessageModel.findAll({
        where: { roomId },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return messages.map((msg: any) => ({
        id: msg.id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        type: msg.type as any,
        content: msg.content,
        metadata: msg.metadata,
        timestamp: msg.timestamp,
      }));
    } catch (error) {
      logger.error(`Error getting messages: ${error}`);
      return [];
    }
  }

  async getMessagesByType(roomId: string, type: string, limit: number = 50): Promise<Message[]> {
    try {
      const messages = await MessageModel.findAll({
        where: { roomId, type },
        order: [['timestamp', 'DESC']],
        limit,
      });

      return messages.map((msg: any) => ({
        id: msg.id,
        roomId: msg.roomId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        type: msg.type as any,
        content: msg.content,
        metadata: msg.metadata,
        timestamp: msg.timestamp,
      }));
    } catch (error) {
      logger.error(`Error getting messages by type: ${error}`);
      return [];
    }
  }

  async cleanupOldMessages(): Promise<void> {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.persistence.retentionDays);

      await MessageModel.destroy({
        where: {
          timestamp: {
            [Op.lt]: retentionDate,
          },
        },
      });

      logger.info('Cleaned up old messages');
    } catch (error) {
      logger.error(`Error cleaning up messages: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    await this.cleanupOldMessages();
  }
}
