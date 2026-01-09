import { Server as SocketIOServer, Socket } from 'socket.io';
import { EmergencyBroadcast, EmergencyType, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { config } from '../config';

export class EmergencyBroadcastService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private redisClient: Redis;
  private activeBroadcasts: Map<string, EmergencyBroadcast> = new Map();

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
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Subscribe to emergency broadcasts
      socket.on('subscribe_emergency', (data: { schoolId: string; roles?: string[] }) => {
        this.subscribeToEmergency(socket, data);
      });

      // Create emergency broadcast
      socket.on('create_emergency_broadcast', (data: {
        schoolId: string;
        type: EmergencyType;
        priority: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        targetAudience: string[];
      }) => {
        this.createEmergencyBroadcast(socket, data);
      });

      // Acknowledge emergency
      socket.on('acknowledge_emergency', (data: { broadcastId: string }) => {
        this.acknowledgeEmergency(socket, data);
      });

      // Get active emergencies
      socket.on('get_active_emergencies', (data: { schoolId: string }) => {
        this.getActiveEmergencies(socket, data);
      });
    });
  }

  private subscribeToEmergency(socket: Socket, data: { schoolId: string; roles?: string[] }) {
    // Join school emergency room
    socket.join(`emergency:school:${data.schoolId}`);

    // Join role-based rooms
    if (data.roles) {
      data.roles.forEach((role) => {
        socket.join(`emergency:school:${data.schoolId}:role:${role}`);
      });
    }

    logger.info(`User subscribed to emergency broadcasts for school ${data.schoolId}`);
  }

  private createEmergencyBroadcast(socket: Socket, data: {
    schoolId: string;
    type: EmergencyType;
    priority: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    targetAudience: string[];
  }) {
    const broadcast: EmergencyBroadcast = {
      id: uuidv4(),
      schoolId: data.schoolId,
      type: data.type,
      priority: data.priority,
      message: data.message,
      targetAudience: data.targetAudience,
      broadcastedAt: new Date(),
      acknowledgedBy: [],
    };

    this.activeBroadcasts.set(broadcast.id, broadcast);

    // Store in Redis for persistence
    const key = `emergency:${broadcast.id}`;
    this.redisClient.setex(key, 3600, JSON.stringify(broadcast)); // 1 hour TTL

    // Broadcast to school
    this.io.to(`emergency:school:${data.schoolId}`).emit('emergency_broadcast', {
      ...broadcast,
      sound: true, // Play sound for critical/high priority
      vibration: data.priority === 'critical' || data.priority === 'high',
    });

    // Broadcast to specific roles if specified
    data.targetAudience.forEach((role) => {
      this.io.to(`emergency:school:${data.schoolId}:role:${role}`).emit('emergency_broadcast', broadcast);
    });

    // Persist broadcast
    const message: Message = {
      id: broadcast.id,
      roomId: `emergency:school:${data.schoolId}`,
      senderId: socket.data.userId,
      senderName: socket.data.userName || 'Administrator',
      type: MessageType.EMERGENCY,
      content: {
        type: data.type,
        priority: data.priority,
        message: data.message,
        targetAudience: data.targetAudience,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    // Set timeout for critical emergencies
    if (data.priority === 'critical') {
      setTimeout(() => {
        this.checkAcknowledgment(broadcast.id);
      }, config.emergency.timeout);
    }

    logger.warn(`Emergency broadcast created: ${data.type} (${data.priority}) for school ${data.schoolId}`);
  }

  private acknowledgeEmergency(socket: Socket, data: { broadcastId: string }) {
    const broadcast = this.activeBroadcasts.get(data.broadcastId);
    if (!broadcast) {
      socket.emit('error', { message: 'Emergency broadcast not found' });
      return;
    }

    if (!broadcast.acknowledgedBy.includes(socket.data.userId)) {
      broadcast.acknowledgedBy.push(socket.data.userId);

      // Notify administrators
      this.io.to(`emergency:school:${broadcast.schoolId}:role:admin`).emit('emergency_acknowledged', {
        broadcastId: data.broadcastId,
        acknowledgedBy: socket.data.userId,
        userName: socket.data.userName,
        timestamp: new Date(),
        totalAcknowledged: broadcast.acknowledgedBy.length,
      });

      logger.info(`Emergency acknowledged: ${data.broadcastId} by ${socket.data.userId}`);
    }
  }

  private getActiveEmergencies(socket: Socket, data: { schoolId: string }) {
    const activeEmergencies = Array.from(this.activeBroadcasts.values()).filter(
      (b) => b.schoolId === data.schoolId
    );

    socket.emit('active_emergencies', {
      schoolId: data.schoolId,
      emergencies: activeEmergencies,
      total: activeEmergencies.length,
    });
  }

  private checkAcknowledgment(broadcastId: string) {
    const broadcast = this.activeBroadcasts.get(broadcastId);
    if (!broadcast) return;

    // Check if critical emergency was acknowledged by key personnel
    // This would check against a required acknowledgment list
    const requiredAcks = ['admin', 'principal', 'security'];
    const hasRequiredAcks = requiredAcks.some((role) =>
      broadcast.acknowledgedBy.some((userId) => {
        // Would check user roles in production
        return true;
      })
    );

    if (!hasRequiredAcks) {
      // Escalate - notify higher authorities
      this.io.to(`emergency:school:${broadcast.schoolId}:role:admin`).emit('emergency_escalation', {
        broadcastId,
        reason: 'Required acknowledgments not received',
        timestamp: new Date(),
      });

      logger.error(`Emergency escalation: ${broadcastId} - required acknowledgments not received`);
    }
  }

  public async broadcastEmergency(broadcast: EmergencyBroadcast): Promise<void> {
    // Public method for external systems to create emergency broadcasts
    this.createEmergencyBroadcast({ data: broadcast } as any, {
      schoolId: broadcast.schoolId,
      type: broadcast.type,
      priority: broadcast.priority,
      message: broadcast.message,
      targetAudience: broadcast.targetAudience,
    });
  }
}
