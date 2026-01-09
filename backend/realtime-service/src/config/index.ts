import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3001'),
    socketPort: parseInt(process.env.SOCKET_PORT || '3002'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  database: {
    postgres: {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      database: process.env.POSTGRES_DB || 'edusmarthub',
    },
    mongodb: {
      uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/edusmarthub',
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
  },
  backend: {
    apiUrl: process.env.BACKEND_API_URL || 'http://localhost:3000',
    apiKey: process.env.BACKEND_API_KEY || '',
  },
  socket: {
    corsOrigin: process.env.SOCKET_CORS_ORIGIN?.split(',') || ['http://localhost:8080'],
    pingTimeout: parseInt(process.env.SOCKET_PING_TIMEOUT || '60000'),
    pingInterval: parseInt(process.env.SOCKET_PING_INTERVAL || '25000'),
    maxHttpBufferSize: parseInt(process.env.SOCKET_MAX_HTTP_BUFFER_SIZE || '100000000'),
  },
  clustering: {
    enabled: process.env.ENABLE_CLUSTERING === 'true',
    workers: parseInt(process.env.CLUSTER_WORKERS || '4'),
  },
  persistence: {
    enabled: process.env.ENABLE_MESSAGE_PERSISTENCE === 'true',
    retentionDays: parseInt(process.env.MESSAGE_RETENTION_DAYS || '30'),
  },
  failover: {
    enabled: process.env.ENABLE_FAILOVER === 'true',
    heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '5000'),
    heartbeatTimeout: parseInt(process.env.HEARTBEAT_TIMEOUT || '15000'),
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    maxConnections: parseInt(process.env.RATE_LIMIT_MAX_CONNECTIONS || '100'),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  },
  whiteboard: {
    maxUsers: parseInt(process.env.WHITEBOARD_MAX_USERS || '50'),
    historyLimit: parseInt(process.env.WHITEBOARD_HISTORY_LIMIT || '1000'),
  },
  screenShare: {
    maxBitrate: parseInt(process.env.SCREEN_SHARE_MAX_BITRATE || '3000000'),
    frameRate: parseInt(process.env.SCREEN_SHARE_FRAME_RATE || '30'),
  },
  location: {
    updateInterval: parseInt(process.env.LOCATION_UPDATE_INTERVAL || '5000'),
    accuracyThreshold: parseInt(process.env.LOCATION_ACCURACY_THRESHOLD || '50'),
  },
  emergency: {
    priority: process.env.EMERGENCY_BROADCAST_PRIORITY || 'high',
    timeout: parseInt(process.env.EMERGENCY_BROADCAST_TIMEOUT || '30000'),
  },
};
