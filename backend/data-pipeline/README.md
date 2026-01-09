# Data Pipeline Service - EduSmartHub

Data pipeline service using Apache Kafka and Node.js for real-time data processing, ETL, and analytics.

## Features

### 1. Real-time Data Ingestion
- Multi-source data ingestion
- Automatic retry mechanisms
- Dead letter queue for failed ingestions
- Configurable ingestion intervals

### 2. ETL Processes
- Extract, Transform, Load pipeline
- Data validation and cleansing
- Parallel processing with configurable workers
- Job tracking and monitoring

### 3. Batch Processing
- Scheduled batch jobs (cron-based)
- Configurable time windows
- Multiple output formats (JSON, CSV)
- Report generation

### 4. Real-time Aggregation
- Time-window based aggregations
- Sliding window calculations
- Redis-backed aggregation storage
- Dashboard-ready metrics

### 5. Data Validation and Cleansing
- Schema-based validation using Zod
- Data normalization
- Duplicate removal
- Format standardization

### 6. Anomaly Detection
- Statistical anomaly detection (Z-score based)
- Configurable thresholds
- Sliding window analysis
- Anomaly history tracking

### 7. Automated Backup and Archival
- Scheduled backups (full/incremental)
- S3 integration for cloud storage
- Automatic cleanup of old backups
- Backup job tracking

### 8. Data Synchronization
- Cross-service data synchronization
- Retry mechanisms
- Transformation for destination compatibility
- Sync job monitoring

### 9. GDPR Compliance
- Data access requests
- Data deletion requests
- Data portability
- Automatic data retention cleanup
- Data encryption support

### 10. Predictive Analytics Preparation
- Feature engineering
- Data normalization
- Time series creation
- ML-ready data formatting

## Architecture

### Kafka Topics
- `data-ingestion` - Raw data ingestion
- `analytics-data` - Processed analytics data
- `batch-processing` - Batch job requests
- `real-time-aggregation` - Aggregated metrics
- `data-validation` - Validated data
- `anomaly-detection` - Detected anomalies
- `backup-requests` - Backup job requests
- `data-sync` - Data synchronization requests
- `gdpr-processing` - GDPR compliance requests
- `predictive-analytics` - ML-ready data

### Error Handling
- Retry mechanisms with exponential backoff
- Dead letter queue for failed messages
- Comprehensive error logging
- Error rate monitoring

### Monitoring & Alerting
- Prometheus metrics integration
- Real-time pipeline metrics
- Data quality metrics
- Automated alerting (webhook/email)
- Performance monitoring

### Data Quality
- Completeness metrics
- Accuracy metrics
- Consistency metrics
- Quality threshold monitoring

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## Docker

```bash
# Build
docker build -t data-pipeline .

# Run
docker run -p 3003:3003 -p 9091:9091 data-pipeline
```

## Kafka Setup

Ensure Kafka is running:

```bash
# Using Docker
docker run -p 9092:9092 apache/kafka:latest
```

## Configuration

Key configuration options in `.env`:

- `KAFKA_BROKERS` - Kafka broker addresses
- `ETL_BATCH_SIZE` - ETL processing batch size
- `AGGREGATION_WINDOW_SECONDS` - Aggregation time window
- `ANOMALY_THRESHOLD` - Anomaly detection threshold
- `BACKUP_SCHEDULE` - Backup cron schedule
- `GDPR_DATA_RETENTION_DAYS` - GDPR data retention period

## API Endpoints

- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Monitoring

- Prometheus metrics on port 9091
- Health check endpoint
- Structured logging
- Data quality metrics

## License

MIT
