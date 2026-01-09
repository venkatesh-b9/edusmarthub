import { Server as SocketIOServer, Socket } from 'socket.io';
import { Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { config } from '../config';

export class NotificationService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private redisClient: Redis;
  private notificationQueue: Map<string, any[]> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.messagePersistence = new MessagePersistence();
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });
    this.setupEventHandlers();
    this.setupNotificationQueue();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Subscribe to notifications
      socket.on('subscribe_notifications', (data: { userId: string; types?: string[] }) => {
        this.subscribeToNotifications(socket, data);
      });

      // Unsubscribe from notifications
      socket.on('unsubscribe_notifications', () => {
        this.unsubscribeFromNotifications(socket);
      });

      // Mark notification as read
      socket.on('mark_notification_read', (data: { notificationId: string }) => {
        this.markAsRead(socket, data.notificationId);
      });

      // Get unread notifications
      socket.on('get_unread_notifications', () => {
        this.getUnreadNotifications(socket);
      });
    });
  }

  private subscribeToNotifications(socket: Socket, data: { userId: string; types?: string[] }) {
    // Join user's notification room
    socket.join(`notifications:${data.userId}`);

    // Join type-specific rooms if specified
    if (data.types) {
      data.types.forEach((type) => {
        socket.join(`notifications:${data.userId}:${type}`);
      });
    }

    logger.info(`User ${data.userId} subscribed to notifications`);
  }

  private unsubscribeFromNotifications(socket: Socket) {
    // Leave all notification rooms
    const rooms = Array.from(socket.rooms).filter((room) => room.startsWith('notifications:'));
    rooms.forEach((room) => socket.leave(room));
  }

  public async sendNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionUrl?: string;
      metadata?: any;
    }
  ): Promise<void> {
    const notificationMessage: Message = {
      id: uuidv4(),
      roomId: `notifications:${userId}`,
      senderId: 'system',
      senderName: 'System',
      type: MessageType.NOTIFICATION,
      content: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority || 'medium',
        actionUrl: notification.actionUrl,
        read: false,
        ...notification.metadata,
      },
      timestamp: new Date(),
    };

    // Send to user if online
    this.io.to(`notifications:${userId}`).emit('notification', notificationMessage);

    // Store in Redis for offline users
    await this.storeNotification(userId, notificationMessage);

    // Persist message
    await this.messagePersistence.saveMessage(notificationMessage);

    logger.info(`Notification sent to user ${userId}: ${notification.title}`);
  }

  public async sendBulkNotification(
    userIds: string[],
    notification: {
      title: string;
      message: string;
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionUrl?: string;
      metadata?: any;
    }
  ): Promise<void> {
    const promises = userIds.map((userId) => this.sendNotification(userId, notification));
    await Promise.all(promises);
  }

  public async sendToRole(
    role: string,
    schoolId: string | undefined,
    notification: {
      title: string;
      message: string;
      type: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      actionUrl?: string;
      metadata?: any;
    }
  ): Promise<void> {
    const roomId = schoolId ? `notifications:role:${role}:school:${schoolId}` : `notifications:role:${role}`;
    
    const notificationMessage: Message = {
      id: uuidv4(),
      roomId,
      senderId: 'system',
      senderName: 'System',
      type: MessageType.NOTIFICATION,
      content: {
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority || 'medium',
        actionUrl: notification.actionUrl,
        read: false,
        ...notification.metadata,
      },
      timestamp: new Date(),
    };

    // Broadcast to role-based room
    this.io.to(roomId).emit('notification', notificationMessage);

    logger.info(`Notification sent to role ${role}`);
  }

  private async storeNotification(userId: string, notification: Message): Promise<void> {
    const key = `notifications:${userId}:unread`;
    await this.redisClient.lpush(key, JSON.stringify(notification));
    await this.redisClient.expire(key, 7 * 24 * 60 * 60); // 7 days
  }

  private async markAsRead(socket: Socket, notificationId: string): Promise<void> {
    const userId = socket.data.userId;
    if (!userId) return;

    const key = `notifications:${userId}:unread`;
    const notifications = await this.redisClient.lrange(key, 0, -1);

    // Remove notification from unread list
    const updatedNotifications = notifications
      .map((n) => JSON.parse(n))
      .filter((n) => n.id !== notificationId);

    await this.redisClient.del(key);
    if (updatedNotifications.length > 0) {
      for (const notif of updatedNotifications) {
        await this.redisClient.lpush(key, JSON.stringify(notif));
      }
    }

    socket.emit('notification_read', { notificationId });
  }

  private async getUnreadNotifications(socket: Socket): Promise<void> {
    const userId = socket.data.userId;
    if (!userId) return;

    const key = `notifications:${userId}:unread`;
    const notifications = await this.redisClient.lrange(key, 0, 99); // Last 100

    const parsedNotifications = notifications.map((n) => JSON.parse(n));

    socket.emit('unread_notifications', parsedNotifications);
  }

  private setupNotificationQueue() {
    // Process queued notifications periodically
    setInterval(() => {
      this.processNotificationQueue();
    }, 5000);
  }

  private async processNotificationQueue() {
    // Process any queued notifications
    // This would handle retries and offline delivery
  }
}
