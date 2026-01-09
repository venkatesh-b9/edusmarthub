import apiClient from '../config';

export interface AnalyticsData {
  schoolId: string;
  date: string;
  metrics: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    averageGrade: number;
    revenue: number;
  };
}

export interface ReportData {
  type: string;
  period: {
    startDate: string;
    endDate: string;
  };
  statistics: any;
}

export const analyticsService = {
  async aggregateData(
    schoolId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsData> {
    const response = await apiClient.get('/analytics/aggregate', {
      params: { schoolId, startDate, endDate },
    });
    return response.data.data;
  },

  async getAnalytics(
    schoolId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsData[]> {
    const response = await apiClient.get('/analytics', {
      params: { schoolId, startDate, endDate },
    });
    return response.data.data;
  },

  async generateReport(
    schoolId: string,
    reportType: 'attendance' | 'academic' | 'financial',
    startDate: string,
    endDate: string
  ): Promise<ReportData> {
    const response = await apiClient.get(`/analytics/reports/${reportType}`, {
      params: { schoolId, startDate, endDate },
    });
    return response.data.data;
  },
};
