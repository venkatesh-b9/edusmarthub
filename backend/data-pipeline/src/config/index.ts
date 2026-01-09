import dotenv from 'dotenv';

dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || '3003'),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'edusmarthub-data-pipeline',
    groupId: process.env.KAFKA_GROUP_ID || 'data-pipeline-group',
    retry: {
      retries: parseInt(process.env.KAFKA_RETRY_ATTEMPTS || '5'),
      initialRetryTime: parseInt(process.env.KAFKA_RETRY_DELAY || '1000'),
    },
    topics: {
      ingestion: process.env.KAFKA_TOPIC_INGESTION || 'data-ingestion',
      analytics: process.env.KAFKA_TOPIC_ANALYTICS || 'analytics-data',
      batch: process.env.KAFKA_TOPIC_BATCH || 'batch-processing',
      aggregation: process.env.KAFKA_TOPIC_AGGREGATION || 'real-time-aggregation',
      validation: process.env.KAFKA_TOPIC_VALIDATION || 'data-validation',
      anomaly: process.env.KAFKA_TOPIC_ANOMALY || 'anomaly-detection',
      backup: process.env.KAFKA_TOPIC_BACKUP || 'backup-requests',
      sync: process.env.KAFKA_TOPIC_SYNC || 'data-sync',
      gdpr: process.env.KAFKA_TOPIC_GDPR || 'gdpr-processing',
      predictive: process.env.KAFKA_TOPIC_PREDICTIVE || 'predictive-analytics',
    },
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
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '1'),
  },
  dataSources: {
    attendance: process.env.DATA_SOURCE_ATTENDANCE || 'http://localhost:3000/api/v1/attendance',
    grades: process.env.DATA_SOURCE_GRADES || 'http://localhost:3000/api/v1/academics',
    users: process.env.DATA_SOURCE_USERS || 'http://localhost:3000/api/v1/users',
    analytics: process.env.DATA_SOURCE_ANALYTICS || 'http://localhost:3000/api/v1/analytics',
  },
  etl: {
    batchSize: parseInt(process.env.ETL_BATCH_SIZE || '1000'),
    parallelWorkers: parseInt(process.env.ETL_PARALLEL_WORKERS || '5'),
    retryAttempts: parseInt(process.env.ETL_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.ETL_RETRY_DELAY || '5000'),
  },
  batch: {
    schedule: process.env.BATCH_PROCESSING_SCHEDULE || '0 2 * * *',
    windowSizeHours: parseInt(process.env.BATCH_WINDOW_SIZE_HOURS || '24'),
    outputFormat: process.env.BATCH_OUTPUT_FORMAT || 'json',
  },
  aggregation: {
    windowSeconds: parseInt(process.env.AGGREGATION_WINDOW_SECONDS || '60'),
    intervalSeconds: parseInt(process.env.AGGREGATION_INTERVAL_SECONDS || '10'),
  },
  validation: {
    enabled: process.env.VALIDATION_ENABLED === 'true',
    strictMode: process.env.VALIDATION_STRICT_MODE === 'true',
    schemaPath: process.env.VALIDATION_SCHEMA_PATH || './schemas',
  },
  anomaly: {
    enabled: process.env.ANOMALY_DETECTION_ENABLED === 'true',
    threshold: parseFloat(process.env.ANOMALY_THRESHOLD || '3.0'),
    windowSize: parseInt(process.env.ANOMALY_WINDOW_SIZE || '100'),
  },
  backup: {
    enabled: process.env.BACKUP_ENABLED === 'true',
    schedule: process.env.BACKUP_SCHEDULE || '0 3 * * *',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '90'),
    storageType: process.env.BACKUP_STORAGE_TYPE || 's3',
    s3: {
      bucket: process.env.BACKUP_S3_BUCKET || 'edusmarthub-backups',
      region: process.env.BACKUP_S3_REGION || 'us-east-1',
    },
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    s3Bucket: process.env.AWS_S3_BUCKET || 'edusmarthub-backups',
  },
  gdpr: {
    enabled: process.env.GDPR_ENABLED === 'true',
    dataRetentionDays: parseInt(process.env.GDPR_DATA_RETENTION_DAYS || '365'),
    autoDelete: process.env.GDPR_AUTO_DELETE === 'true',
    encryptionEnabled: process.env.GDPR_ENCRYPTION_ENABLED === 'true',
  },
  monitoring: {
    enabled: process.env.MONITORING_ENABLED === 'true',
    prometheusPort: parseInt(process.env.PROMETHEUS_PORT || '9091'),
    metricsEnabled: process.env.METRICS_ENABLED === 'true',
  },
  alerting: {
    enabled: process.env.ALERTING_ENABLED === 'true',
    webhookUrl: process.env.ALERT_WEBHOOK_URL || '',
    email: {
      enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
      to: process.env.ALERT_EMAIL_TO || '',
    },
  },
  dataQuality: {
    enabled: process.env.DATA_QUALITY_ENABLED === 'true',
    threshold: parseFloat(process.env.DATA_QUALITY_THRESHOLD || '0.95'),
    metricsInterval: parseInt(process.env.DATA_QUALITY_METRICS_INTERVAL || '300000'),
  },
  errorHandling: {
    retryAttempts: parseInt(process.env.ERROR_HANDLING_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(process.env.ERROR_HANDLING_RETRY_DELAY || '5000'),
    deadLetterQueue: process.env.ERROR_HANDLING_DEAD_LETTER_QUEUE === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
};
