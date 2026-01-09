import { Server as SocketIOServer, Socket } from 'socket.io';
import { BusLocation, Message, MessageType } from '../types';
import logger from '../utils/logger';
import { MessagePersistence } from '../utils/messagePersistence';
import Redis from 'ioredis';
import { config } from '../config';

export class BusTrackingService {
  private io: SocketIOServer;
  private messagePersistence: MessagePersistence;
  private redisClient: Redis;
  private busLocations: Map<string, BusLocation> = new Map();

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
    this.setupLocationUpdates();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      // Subscribe to bus tracking
      socket.on('subscribe_bus_tracking', (data: { busId?: string; routeId?: string; schoolId?: string }) => {
        this.subscribeToBusTracking(socket, data);
      });

      // Update bus location (from bus device/app)
      socket.on('update_bus_location', (data: BusLocation) => {
        this.updateBusLocation(socket, data);
      });

      // Get bus location
      socket.on('get_bus_location', (data: { busId: string }) => {
        this.getBusLocation(socket, data);
      });

      // Get route buses
      socket.on('get_route_buses', (data: { routeId: string }) => {
        this.getRouteBuses(socket, data);
      });
    });
  }

  private subscribeToBusTracking(socket: Socket, data: { busId?: string; routeId?: string; schoolId?: string }) {
    if (data.busId) {
      socket.join(`bus:${data.busId}`);
    }
    if (data.routeId) {
      socket.join(`route:${data.routeId}`);
    }
    if (data.schoolId) {
      socket.join(`school:${data.schoolId}:buses`);
    }

    logger.info(`User subscribed to bus tracking: ${JSON.stringify(data)}`);
  }

  private updateBusLocation(socket: Socket, data: BusLocation) {
    // Validate location data
    if (!this.isValidLocation(data)) {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }

    // Update location
    this.busLocations.set(data.busId, {
      ...data,
      timestamp: new Date(),
    });

    // Store in Redis for persistence
    const key = `bus:location:${data.busId}`;
    this.redisClient.setex(key, 3600, JSON.stringify(data)); // 1 hour TTL

    // Broadcast to subscribers
    this.io.to(`bus:${data.busId}`).emit('bus_location_update', data);
    this.io.to(`route:${data.routeId}`).emit('bus_location_update', data);

    // Persist location update
    const message: Message = {
      id: `location_${Date.now()}`,
      roomId: `route:${data.routeId}`,
      senderId: data.busId,
      senderName: `Bus ${data.busId}`,
      type: MessageType.LOCATION,
      content: {
        busId: data.busId,
        routeId: data.routeId,
        location: {
          latitude: data.latitude,
          longitude: data.longitude,
        },
        speed: data.speed,
        heading: data.heading,
      },
      timestamp: new Date(),
    };

    this.messagePersistence.saveMessage(message);

    logger.debug(`Bus location updated: ${data.busId}`);
  }

  private getBusLocation(socket: Socket, data: { busId: string }) {
    const location = this.busLocations.get(data.busId);
    if (location) {
      socket.emit('bus_location', location);
    } else {
      // Try to get from Redis
      this.redisClient.get(`bus:location:${data.busId}`, (err, result) => {
        if (result) {
          const location = JSON.parse(result);
          socket.emit('bus_location', location);
        } else {
          socket.emit('error', { message: 'Bus location not found' });
        }
      });
    }
  }

  private getRouteBuses(socket: Socket, data: { routeId: string }) {
    const routeBuses = Array.from(this.busLocations.values()).filter(
      (location) => location.routeId === data.routeId
    );

    socket.emit('route_buses', {
      routeId: data.routeId,
      buses: routeBuses,
    });
  }

  private isValidLocation(data: BusLocation): boolean {
    return (
      data.busId &&
      data.routeId &&
      typeof data.latitude === 'number' &&
      typeof data.longitude === 'number' &&
      data.latitude >= -90 &&
      data.latitude <= 90 &&
      data.longitude >= -180 &&
      data.longitude <= 180
    );
  }

  private setupLocationUpdates() {
    // Periodic cleanup of stale locations
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 10 * 60 * 1000; // 10 minutes

      this.busLocations.forEach((location, busId) => {
        const age = now - new Date(location.timestamp).getTime();
        if (age > staleThreshold) {
          this.busLocations.delete(busId);
        }
      });
    }, 60000); // Check every minute
  }
}
