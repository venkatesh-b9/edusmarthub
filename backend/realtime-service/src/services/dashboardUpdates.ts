import { Server as SocketIOServer, Socket } from 'socket.io';
import { DashboardUpdate, DashboardUpdateType, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { config } from '../config';

export class DashboardUpdatesService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private redisClient: Redis;
  private updateStreams: Map<string, NodeJS.Timeout> = new Map();

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
      // Subscribe to dashboard updates
      socket.on('subscribe_dashboard', (data: { schoolId: string; types?: DashboardUpdateType[] }) => {
        this.subscribeToDashboard(socket, data);
      });

      // Unsubscribe from dashboard
      socket.on('unsubscribe_dashboard', () => {
        this.unsubscribeFromDashboard(socket);
      });

      // Request dashboard data
      socket.on('get_dashboard_data', (data: { schoolId: string; type: DashboardUpdateType }) => {
        this.getDashboardData(socket, data);
      });
    });
  }

  private subscribeToDashboard(socket: Socket, data: { schoolId: string; types?: DashboardUpdateType[] }) {
    // Join school dashboard room
    socket.join(`dashboard:school:${data.schoolId}`);

    // Join type-specific rooms
    if (data.types) {
      data.types.forEach((type) => {
        socket.join(`dashboard:school:${data.schoolId}:type:${type}`);
      });
    } else {
      // Subscribe to all types
      Object.values(DashboardUpdateType).forEach((type) => {
        socket.join(`dashboard:school:${data.schoolId}:type:${type}`);
      });
    }

    logger.info(`User subscribed to dashboard updates for school ${data.schoolId}`);
  }

  private unsubscribeFromDashboard(socket: Socket) {
    // Leave all dashboard rooms
    const rooms = Array.from(socket.rooms).filter((room) => room.startsWith('dashboard:'));
    rooms.forEach((room) => socket.leave(room));
  }

  public async broadcastUpdate(update: DashboardUpdate): Promise<void> {
    const roomId = `dashboard:school:${update.schoolId}`;
    const typeRoomId = `dashboard:school:${update.schoolId}:type:${update.type}`;

    // Broadcast to all subscribers
    this.io.to(roomId).emit('dashboard_update', update);

    // Broadcast to type-specific subscribers
    this.io.to(typeRoomId).emit('dashboard_update', update);

    // Store in Redis for caching
    const key = `dashboard:${update.schoolId}:${update.type}:latest`;
    await this.redisClient.setex(key, 3600, JSON.stringify(update)); // 1 hour TTL

    // Persist update
    const message: Message = {
      id: update.id,
      roomId,
      senderId: 'system',
      senderName: 'Dashboard System',
      type: MessageType.DASHBOARD_UPDATE,
      content: {
        type: update.type,
        data: update.data,
      },
      timestamp: update.timestamp,
    };

    this.messagePersistence.saveMessage(message);

    logger.debug(`Dashboard update broadcasted: ${update.type} for school ${update.schoolId}`);
  }

  public async startDataStream(schoolId: string, type: DashboardUpdateType, interval: number = 5000): Promise<void> {
    const streamKey = `${schoolId}:${type}`;

    if (this.updateStreams.has(streamKey)) {
      // Stream already running
      return;
    }

    const stream = setInterval(async () => {
      try {
        // Fetch latest data (would integrate with main backend API)
        const data = await this.fetchDashboardData(schoolId, type);

        const update: DashboardUpdate = {
          id: uuidv4(),
          schoolId,
          type,
          data,
          timestamp: new Date(),
        };

        await this.broadcastUpdate(update);
      } catch (error) {
        logger.error(`Error in data stream ${streamKey}: ${error}`);
      }
    }, interval);

    this.updateStreams.set(streamKey, stream);
    logger.info(`Started data stream: ${streamKey}`);
  }

  public stopDataStream(schoolId: string, type: DashboardUpdateType): void {
    const streamKey = `${schoolId}:${type}`;
    const stream = this.updateStreams.get(streamKey);

    if (stream) {
      clearInterval(stream);
      this.updateStreams.delete(streamKey);
      logger.info(`Stopped data stream: ${streamKey}`);
    }
  }

  private async getDashboardData(socket: Socket, data: { schoolId: string; type: DashboardUpdateType }) {
    try {
      // Try to get from cache first
      const key = `dashboard:${data.schoolId}:${data.type}:latest`;
      const cached = await this.redisClient.get(key);

      if (cached) {
        const update = JSON.parse(cached);
        socket.emit('dashboard_data', update);
        return;
      }

      // Fetch fresh data
      const freshData = await this.fetchDashboardData(data.schoolId, data.type);

      const update: DashboardUpdate = {
        id: uuidv4(),
        schoolId: data.schoolId,
        type: data.type,
        data: freshData,
        timestamp: new Date(),
      };

      socket.emit('dashboard_data', update);
    } catch (error) {
      logger.error(`Error getting dashboard data: ${error}`);
      socket.emit('error', { message: 'Failed to fetch dashboard data' });
    }
  }

  private async fetchDashboardData(schoolId: string, type: DashboardUpdateType): Promise<any> {
    // This would integrate with the main backend API to fetch data
    // For now, return mock data structure
    switch (type) {
      case DashboardUpdateType.ATTENDANCE:
        return {
          totalStudents: 500,
          present: 480,
          absent: 20,
          attendanceRate: 96,
        };
      case DashboardUpdateType.GRADES:
        return {
          averageGrade: 85,
          totalAssessments: 120,
          gradeDistribution: {
            A: 45,
            B: 35,
            C: 20,
          },
        };
      case DashboardUpdateType.ANALYTICS:
        return {
          studentEngagement: 88,
          teacherPerformance: 92,
          resourceUtilization: 75,
        };
      case DashboardUpdateType.NOTIFICATIONS:
        return {
          unread: 5,
          recent: [],
        };
      case DashboardUpdateType.SYSTEM_STATUS:
        return {
          status: 'healthy',
          uptime: 99.9,
          activeUsers: 250,
        };
      default:
        return {};
    }
  }
}
