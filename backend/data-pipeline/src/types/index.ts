export interface DataRecord {
  id: string;
  source: string;
  type: string;
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface ETLJob {
  id: string;
  name: string;
  source: string;
  destination: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  recordsProcessed: number;
  recordsFailed: number;
  error?: string;
}

export interface BatchJob {
  id: string;
  type: string;
  startTime: Date;
  endTime: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsProcessed: number;
  outputPath?: string;
  error?: string;
}

export interface AggregationResult {
  id: string;
  metric: string;
  value: number;
  timestamp: Date;
  window: {
    start: Date;
    end: Date;
  };
  dimensions?: Record<string, any>;
}

export interface ValidationResult {
  recordId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

export interface AnomalyDetectionResult {
  recordId: string;
  isAnomaly: boolean;
  score: number;
  reason: string;
  timestamp: Date;
}

export interface BackupJob {
  id: string;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: Date;
  completedAt?: Date;
  size?: number;
  location?: string;
  error?: string;
}

export interface SyncJob {
  id: string;
  source: string;
  destination: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  recordsSynced: number;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface GDPRRequest {
  id: string;
  type: 'access' | 'deletion' | 'portability' | 'rectification';
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  requestedAt: Date;
  completedAt?: Date;
  data?: any;
  error?: string;
}

export interface DataQualityMetric {
  metric: string;
  value: number;
  threshold: number;
  status: 'pass' | 'fail' | 'warning';
  timestamp: Date;
  details?: Record<string, any>;
}

export interface PipelineMetrics {
  recordsProcessed: number;
  recordsFailed: number;
  throughput: number; // records per second
  latency: number; // average latency in ms
  errorRate: number; // percentage
  timestamp: Date;
}
