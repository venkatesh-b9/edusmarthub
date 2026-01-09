/**
 * Enhanced AI Service Integration
 * Provides comprehensive AI service orchestration with polling, status monitoring, and error handling
 */

import { apiService } from '../apiService';

const AI_SERVICE_BASE = '/ai';

// Types
export interface TimetableConstraints {
  teacher_workload?: Record<string, number>;
  room_availability?: Record<string, string[]>;
  subject_preferences?: Record<string, string[]>;
  time_slots?: string[];
  [key: string]: any;
}

export interface TimetablePreferences {
  optimization_goal?: 'balanced_workload' | 'minimize_gaps' | 'maximize_efficiency';
  include_visualization?: boolean;
  school_id: string;
}

export interface PerformancePrediction {
  student_id: string;
  predictions: {
    subject: string;
    predicted_grade: number;
    confidence: number;
    risk_level: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
  period: string;
}

export interface AttendancePattern {
  class_id: string;
  patterns: {
    day_of_week: string;
    attendance_rate: number;
    anomalies: number;
  }[];
  insights: string[];
  recommendations: string[];
}

export interface NLQResponse {
  query: string;
  intent: string;
  entities: Record<string, any>;
  response: any;
  recommendations?: any[];
}

export interface SmartReport {
  report_id: string;
  report_type: string;
  url: string;
  format: string;
  generated_at: string;
  metadata?: Record<string, any>;
}

export interface AIServiceStatus {
  service: string;
  status: 'active' | 'degraded' | 'offline' | 'loading';
  response_time?: number;
  last_check?: string;
  error?: string;
}

/**
 * Enhanced AI Service
 */
export const enhancedAIService = {
  /**
   * Timetable Optimization AI
   */
  async optimizeTimetable(
    constraints: TimetableConstraints,
    preferences: TimetablePreferences
  ): Promise<any> {
    try {
      const response = await apiService.post<{
        status: string;
        job_id?: string;
        result?: any;
        data?: any;
      }>(`${AI_SERVICE_BASE}/timetable/optimize`, {
        constraints,
        preferences,
        school_id: preferences.school_id,
      });

      // If async processing, poll for results
      if (response.status === 'processing' && response.job_id) {
        return await apiService.pollResult(
          response.job_id,
          `${AI_SERVICE_BASE}/timetable/optimize`,
          2000,
          60 // 2 minutes max
        );
      }

      return response.result || response.data;
    } catch (error) {
      console.error('Timetable optimization failed:', error);
      throw error;
    }
  },

  /**
   * Student Performance Prediction
   */
  async predictStudentPerformance(
    studentId: string,
    period: 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<PerformancePrediction> {
    try {
      const response = await apiService.post<{ data: PerformancePrediction }>(
        `${AI_SERVICE_BASE}/students/${studentId}/predict`,
        {
          period,
          include_recommendations: true,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Performance prediction failed:', error);
      throw error;
    }
  },

  /**
   * Attendance Pattern Analysis
   */
  async analyzeAttendancePatterns(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendancePattern> {
    try {
      const response = await apiService.post<{ data: AttendancePattern }>(
        `${AI_SERVICE_BASE}/attendance/patterns/${classId}`,
        {
          start_date: startDate,
          end_date: endDate,
          generate_insights: true,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Attendance pattern analysis failed:', error);
      throw error;
    }
  },

  /**
   * Natural Language Query Processing
   */
  async processNLQ(query: string, context?: Record<string, any>): Promise<NLQResponse> {
    try {
      const userRole = localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user')!).role
        : null;

      const response = await apiService.post<{ data: NLQResponse }>(
        `${AI_SERVICE_BASE}/nlq/process`,
        {
          query,
          context,
          user_role: userRole,
        }
      );

      return response.data;
    } catch (error) {
      console.error('NLQ processing failed:', error);
      throw error;
    }
  },

  /**
   * Automated Report Generation
   */
  async generateSmartReport(
    reportType: string,
    filters: Record<string, any>,
    format: 'pdf' | 'excel' | 'json' = 'pdf'
  ): Promise<SmartReport> {
    try {
      const response = await apiService.post<{ data: SmartReport }>(
        `${AI_SERVICE_BASE}/reports/generate`,
        {
          report_type: reportType,
          filters,
          format,
          include_visualizations: true,
        }
      );

      return response.data;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  },

  /**
   * Check AI Service Health
   */
  async checkServiceHealth(serviceName?: string): Promise<AIServiceStatus | AIServiceStatus[]> {
    try {
      const endpoint = serviceName
        ? `${AI_SERVICE_BASE}/${serviceName}/health`
        : `${AI_SERVICE_BASE}/health`;

      const response = await apiService.get<{ data: AIServiceStatus | AIServiceStatus[] }>(
        endpoint
      );

      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        service: serviceName || 'unknown',
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Get AI Service Status for all services
   */
  async getAllServiceStatus(): Promise<Record<string, AIServiceStatus>> {
    try {
      const services = [
        'timetable',
        'performance',
        'attendance',
        'nlq',
        'early-warning',
        'essay-grading',
        'sentiment',
        'learning-path',
      ];

      const statusPromises = services.map(async (service) => {
        const status = await enhancedAIService.checkServiceHealth(service);
        return [service, Array.isArray(status) ? status[0] : status] as [string, AIServiceStatus];
      });

      const results = await Promise.allSettled(statusPromises);
      const statusMap: Record<string, AIServiceStatus> = {};

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const [service, status] = result.value;
          statusMap[service] = status;
        } else {
          statusMap[services[index]] = {
            service: services[index],
            status: 'offline',
            error: result.reason?.message || 'Unknown error',
          };
        }
      });

      return statusMap;
    } catch (error) {
      console.error('Failed to get all service status:', error);
      return {};
    }
  },

  /**
   * Get Model Versions
   */
  async getModelVersions(): Promise<Record<string, string>> {
    try {
      const response = await apiService.get<{ data: Record<string, string> }>(
        `${AI_SERVICE_BASE}/models/versions`
      );

      return response.data;
    } catch (error) {
      console.error('Failed to get model versions:', error);
      return {};
    }
  },

  /**
   * Subscribe to AI service updates
   */
  subscribeToUpdates(callback: (update: any) => void): () => void {
    return apiService.subscribe('ai.updates', callback);
  },

  /**
   * Subscribe to AI service alerts
   */
  subscribeToAlerts(callback: (alert: any) => void): () => void {
    return apiService.subscribe('ai.alerts', callback);
  },
};

export default enhancedAIService;
