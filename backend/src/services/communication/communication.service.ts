import { Message, MessageType } from '../../shared/types';
import { NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { publishMessage } from '../../config/rabbitmq';
import { Server as SocketIOServer } from 'socket.io';

export class CommunicationService {
  private io?: SocketIOServer;

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  async sendMessage(data: {
    senderId: string;
    recipientId: string;
    schoolId: string;
    subject?: string;
    content: string;
    type: MessageType;
    attachments?: string[];
  }): Promise<Message> {
    const [result] = await sequelize.query(
      `INSERT INTO messages (id, "senderId", "recipientId", "schoolId", subject, content, type, "isRead", attachments, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :senderId, :recipientId, :schoolId, :subject, :content, :type, false, :attachments, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          senderId: data.senderId,
          recipientId: data.recipientId,
          schoolId: data.schoolId,
          subject: data.subject || null,
          content: data.content,
          type: data.type,
          attachments: data.attachments ? JSON.stringify(data.attachments) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Message[];

    // Emit real-time notification
    if (this.io) {
      this.io.to(data.recipientId).emit('new_message', result);
    }

    // Publish to queue for email/SMS notifications
    await publishMessage('notifications', {
      type: 'message_sent',
      data: result,
      recipientId: data.recipientId,
    });

    logger.info(`Message sent from ${data.senderId} to ${data.recipientId}`);
    return result;
  }

  async getMessages(
    userId: string,
    filters?: {
      type?: MessageType;
      isRead?: boolean;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ messages: Message[]; total: number }> {
    let query = `
      SELECT * FROM messages 
      WHERE "senderId" = :userId OR "recipientId" = :userId
    `;
    const replacements: any = { userId };

    if (filters?.type) {
      query += ` AND type = :type`;
      replacements.type = filters.type;
    }

    if (filters?.isRead !== undefined) {
      query += ` AND "isRead" = :isRead`;
      replacements.isRead = filters.isRead;
    }

    query += ` ORDER BY "createdAt" DESC`;

    if (filters?.limit) {
      query += ` LIMIT :limit`;
      replacements.limit = filters.limit;
    }

    if (filters?.offset) {
      query += ` OFFSET :offset`;
      replacements.offset = filters.offset;
    }

    const messages = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as Message[];

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total FROM messages 
       WHERE "senderId" = :userId OR "recipientId" = :userId`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as any[];

    return {
      messages,
      total: parseInt(countResult?.total || '0'),
    };
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message', messageId);
    }

    // Only recipient can mark as read
    if (message.recipientId !== userId) {
      throw new Error('Unauthorized to mark this message as read');
    }

    const [result] = await sequelize.query(
      `UPDATE messages SET "isRead" = true, "updatedAt" = NOW() 
       WHERE id = :id RETURNING *`,
      {
        replacements: { id: messageId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Message[];

    return result;
  }

  async createAnnouncement(data: {
    senderId: string;
    schoolId: string;
    subject: string;
    content: string;
    targetRoles?: string[];
    targetClasses?: string[];
  }): Promise<Message> {
    const message = await this.sendMessage({
      senderId: data.senderId,
      recipientId: data.senderId, // Announcements are broadcast
      schoolId: data.schoolId,
      subject: data.subject,
      content: data.content,
      type: MessageType.ANNOUNCEMENT,
    });

    // Broadcast to all users in school
    if (this.io) {
      this.io.to(data.schoolId).emit('announcement', {
        ...message,
        targetRoles: data.targetRoles,
        targetClasses: data.targetClasses,
      });
    }

    logger.info(`Announcement created by ${data.senderId} for school ${data.schoolId}`);
    return message;
  }

  async findById(id: string): Promise<Message | null> {
    const [message] = await sequelize.query(
      `SELECT * FROM messages WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Message[];

    return message || null;
  }
}
