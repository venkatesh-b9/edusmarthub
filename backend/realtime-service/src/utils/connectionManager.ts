import { Server as SocketIOServer, Socket } from 'socket.io';
import { RedisAdapter } from 'socket.io-redis';
import { v4 as uuidv4 } from 'uuid';
import { SocketConnection, User, Room } from '../types';
import logger from './logger';
import { config } from '../config';
import Redis from 'ioredis';
import http from 'http';

export class ConnectionManager {
  private connections: Map<string, SocketConnection> = new Map();
  private rooms: Map<string, Room> = new Map();
  private redisAdapter: RedisAdapter;
  private redisClient: Redis;

  constructor(io: SocketIOServer) {
    // Setup Redis adapter for scaling
    this.redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
    });

    this.redisAdapter = new RedisAdapter({
      pubClient: this.redisClient,
      subClient: this.redisClient.duplicate(),
    });

    io.adapter(this.redisAdapter);

    // Setup connection tracking
    this.setupConnectionTracking(io);
  }

  private setupConnectionTracking(io: SocketIOServer) {
    io.on('connection', (socket: Socket) => {
      this.handleConnection(socket, io);
    });
  }

  private async handleConnection(socket: Socket, io: SocketIOServer) {
    try {
      // Authenticate user
      const user = await this.authenticateSocket(socket);
      if (!user) {
        socket.disconnect();
        return;
      }

      // Create connection record
      const connection: SocketConnection = {
        socketId: socket.id,
        userId: user.id,
        user,
        rooms: new Set(),
        connectedAt: new Date(),
        lastActivity: new Date(),
      };

      this.connections.set(socket.id, connection);

      // Join user's default rooms
      await this.joinDefaultRooms(socket, user);

      // Setup event handlers
      this.setupEventHandlers(socket, io, connection);

      logger.info(`User ${user.id} connected: ${socket.id}`);
    } catch (error) {
      logger.error(`Connection error: ${error}`);
      socket.disconnect();
    }
  }

  private async authenticateSocket(socket: Socket): Promise<User | null> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return null;
      }

      // Verify token with main backend
      return new Promise((resolve) => {
        const url = new URL(`${config.backend.apiUrl}/api/v1/auth/verify`);
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: url.pathname,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                const jsonData = JSON.parse(data);
                resolve(jsonData.data as User);
              } catch (error) {
                logger.error(`Error parsing auth response: ${error}`);
                resolve(null);
              }
            } else {
              resolve(null);
            }
          });
        });

        req.on('error', (error) => {
          logger.error(`Authentication request error: ${error}`);
          resolve(null);
        });

        req.end();
      });
    } catch (error) {
      logger.error(`Authentication error: ${error}`);
      return null;
    }
  }

  private async joinDefaultRooms(socket: Socket, user: User) {
    // Join user's personal room
    socket.join(`user:${user.id}`);

    // Join school room if applicable
    if (user.schoolId) {
      socket.join(`school:${user.schoolId}`);
    }

    // Join role-based room
    socket.join(`role:${user.role}`);
  }

  private setupEventHandlers(socket: Socket, io: SocketIOServer, connection: SocketConnection) {
    // Join room
    socket.on('join_room', async (data: { roomId: string; metadata?: any }) => {
      await this.joinRoom(socket, data.roomId, data.metadata);
    });

    // Leave room
    socket.on('leave_room', async (data: { roomId: string }) => {
      await this.leaveRoom(socket, data.roomId);
    });

    // Disconnect
    socket.on('disconnect', () => {
      this.handleDisconnection(socket, connection);
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      connection.lastActivity = new Date();
    });

    // Get connection info
    socket.on('get_connection_info', () => {
      socket.emit('connection_info', {
        socketId: socket.id,
        userId: connection.userId,
        rooms: Array.from(connection.rooms),
        connectedAt: connection.connectedAt,
      });
    });
  }

  private async joinRoom(socket: Socket, roomId: string, metadata?: any) {
    try {
      const connection = this.connections.get(socket.id);
      if (!connection) return;

      // Get or create room
      let room = this.rooms.get(roomId);
      if (!room) {
        room = await this.createRoom(roomId, connection.user, metadata);
      }

      // Check room capacity
      if (room.settings.maxParticipants && room.participants.size >= room.settings.maxParticipants) {
        socket.emit('room_error', { roomId, error: 'Room is full' });
        return;
      }

      // Join socket room
      socket.join(roomId);

      // Update connection
      connection.rooms.add(roomId);
      connection.lastActivity = new Date();

      // Update room
      room.participants.add(connection.userId);

      // Notify others
      socket.to(roomId).emit('user_joined', {
        userId: connection.userId,
        userName: connection.user.name,
        roomId,
      });

      // Send room info to user
      socket.emit('room_joined', {
        roomId,
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          participants: Array.from(room.participants),
        },
      });

      logger.info(`User ${connection.userId} joined room ${roomId}`);
    } catch (error) {
      logger.error(`Error joining room: ${error}`);
      socket.emit('room_error', { roomId, error: 'Failed to join room' });
    }
  }

  private async leaveRoom(socket: Socket, roomId: string) {
    try {
      const connection = this.connections.get(socket.id);
      if (!connection) return;

      socket.leave(roomId);
      connection.rooms.delete(roomId);

      const room = this.rooms.get(roomId);
      if (room) {
        room.participants.delete(connection.userId);

        // Notify others
        socket.to(roomId).emit('user_left', {
          userId: connection.userId,
          userName: connection.user.name,
          roomId,
        });

        // Clean up empty rooms
        if (room.participants.size === 0) {
          this.rooms.delete(roomId);
        }
      }

      logger.info(`User ${connection.userId} left room ${roomId}`);
    } catch (error) {
      logger.error(`Error leaving room: ${error}`);
    }
  }

  private async createRoom(roomId: string, user: User, metadata?: any): Promise<Room> {
    const room: Room = {
      id: roomId,
      name: metadata?.name || roomId,
      type: metadata?.type || 'chat',
      schoolId: user.schoolId,
      participants: new Set([user.id]),
      createdBy: user.id,
      createdAt: new Date(),
      settings: {
        maxParticipants: metadata?.maxParticipants,
        allowScreenShare: metadata?.allowScreenShare ?? true,
        allowWhiteboard: metadata?.allowWhiteboard ?? true,
        requireAuth: true,
        isPrivate: metadata?.isPrivate ?? false,
      },
      metadata,
    };

    this.rooms.set(roomId, room);
    return room;
  }

  private handleDisconnection(socket: Socket, connection: SocketConnection) {
    // Leave all rooms
    connection.rooms.forEach((roomId) => {
      this.leaveRoom(socket, roomId);
    });

    // Remove connection
    this.connections.delete(socket.id);

    logger.info(`User ${connection.userId} disconnected: ${socket.id}`);
  }

  public getConnection(socketId: string): SocketConnection | undefined {
    return this.connections.get(socketId);
  }

  public getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  public getConnectionsByUser(userId: string): SocketConnection[] {
    return Array.from(this.connections.values()).filter((conn) => conn.userId === userId);
  }

  public getRoomParticipants(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.participants) : [];
  }

  public async cleanup() {
    await this.redisClient.quit();
  }
}
