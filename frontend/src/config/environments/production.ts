/**
 * Production Environment Configuration
 */

export const productionConfig = {
  // API Configuration
  api: {
    baseURL: import.meta.env.VITE_API_BASE_URL || process.env.VITE_API_BASE_URL,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    circuitBreaker: {
      threshold: 5,
      timeout: 30000,
    },
  },

  // AI Services
  aiServices: {
    timetable: {
      endpoint: import.meta.env.VITE_AI_TIMETABLE_URL || process.env.VITE_AI_TIMETABLE_URL,
      timeout: 60000,
      fallback: true,
    },
    performance: {
      endpoint: import.meta.env.VITE_AI_PERFORMANCE_URL || process.env.VITE_AI_PERFORMANCE_URL,
      timeout: 30000,
    },
    attendance: {
      endpoint: import.meta.env.VITE_AI_ATTENDANCE_URL || process.env.VITE_AI_ATTENDANCE_URL,
      timeout: 45000,
    },
    nlq: {
      endpoint: import.meta.env.VITE_AI_NLQ_URL || process.env.VITE_AI_NLQ_URL,
      timeout: 30000,
    },
  },

  // Real-time Configuration
  realtime: {
    websocket: {
      url: import.meta.env.VITE_WS_URL || process.env.VITE_WS_URL,
      reconnectAttempts: 10,
      reconnectDelay: 5000,
    },
    polling: {
      enabled: true,
      interval: 30000,
      timeout: 10000,
    },
  },

  // Performance Configuration
  performance: {
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000,
    },
    compression: {
      enabled: true,
      level: 6,
    },
    monitoring: {
      enabled: true,
      sampleRate: 0.1,
    },
  },

  // Security Configuration
  security: {
    cors: {
      origin: (import.meta.env.VITE_ALLOWED_ORIGINS || process.env.VITE_ALLOWED_ORIGINS || '').split(',').filter(Boolean),
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
    helmet: {
      enabled: true,
    },
  },

  // Monitoring & Logging
  monitoring: {
    sentry: {
      dsn: import.meta.env.VITE_SENTRY_DSN || process.env.VITE_SENTRY_DSN,
      environment: 'production',
      tracesSampleRate: 0.2,
    },
    logLevel: 'warn',
    logToFile: false, // Browser doesn't support file logging
  },
};

export default productionConfig;
