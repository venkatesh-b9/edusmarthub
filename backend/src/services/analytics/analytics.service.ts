import mongoose from 'mongoose';
import { connectMongoDB } from '../../config/mongodb';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';

interface AnalyticsData {
  schoolId: string;
  date: Date;
  metrics: {
    totalStudents: number;
    totalTeachers: number;
    attendanceRate: number;
    averageGrade: number;
    revenue: number;
  };
  createdAt: Date;
}

const AnalyticsSchema = new mongoose.Schema({
  schoolId: { type: String, required: true, index: true },
  date: { type: Date, required: true, index: true },
  metrics: {
    totalStudents: Number,
    totalTeachers: Number,
    attendanceRate: Number,
    averageGrade: Number,
    revenue: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

const AnalyticsModel = mongoose.model<AnalyticsData>('Analytics', AnalyticsSchema);

export class AnalyticsService {
  async aggregateData(schoolId: string, startDate: Date, endDate: Date): Promise<AnalyticsData> {
    // Aggregate data from various sources
    const [studentCount] = await sequelize.query(
      `SELECT COUNT(*) as total FROM users WHERE "schoolId" = :schoolId AND role = 'student' AND "isActive" = true`,
      {
        replacements: { schoolId },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    const [teacherCount] = await sequelize.query(
      `SELECT COUNT(*) as total FROM users WHERE "schoolId" = :schoolId AND role = 'teacher' AND "isActive" = true`,
      {
        replacements: { schoolId },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    // Calculate attendance rate
    const [attendanceStats] = await sequelize.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'present') * 100.0 / NULLIF(COUNT(*), 0) as rate
       FROM attendance 
       WHERE "schoolId" = :schoolId 
       AND date >= :startDate 
       AND date <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    // Calculate average grade
    const [gradeStats] = await sequelize.query(
      `SELECT AVG(percentage) as average
       FROM grades g
       JOIN assessments a ON g."assessmentId" = a.id
       WHERE a."schoolId" = :schoolId
       AND g."createdAt" >= :startDate
       AND g."createdAt" <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    // Calculate revenue
    const [revenueStats] = await sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM payments
       WHERE "schoolId" = :schoolId
       AND status = 'completed'
       AND "paidAt" >= :startDate
       AND "paidAt" <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    const analyticsData: AnalyticsData = {
      schoolId,
      date: new Date(),
      metrics: {
        totalStudents: parseInt(studentCount?.total || '0'),
        totalTeachers: parseInt(teacherCount?.total || '0'),
        attendanceRate: parseFloat(attendanceStats?.rate || '0'),
        averageGrade: parseFloat(gradeStats?.average || '0'),
        revenue: parseFloat(revenueStats?.total || '0'),
      },
      createdAt: new Date(),
    };

    // Store in MongoDB
    await connectMongoDB();
    await AnalyticsModel.create(analyticsData);

    logger.info(`Analytics aggregated for school ${schoolId}`);
    return analyticsData;
  }

  async getAnalytics(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AnalyticsData[]> {
    await connectMongoDB();
    const analytics = await AnalyticsModel.find({
      schoolId,
      date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });

    return analytics;
  }

  async generateReport(
    schoolId: string,
    reportType: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // Generate custom reports based on type
    switch (reportType) {
      case 'attendance':
        return this.generateAttendanceReport(schoolId, startDate, endDate);
      case 'academic':
        return this.generateAcademicReport(schoolId, startDate, endDate);
      case 'financial':
        return this.generateFinancialReport(schoolId, startDate, endDate);
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async generateAttendanceReport(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const stats = await sequelize.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late
       FROM attendance
       WHERE "schoolId" = :schoolId
       AND date >= :startDate
       AND date <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    return {
      type: 'attendance',
      period: { startDate, endDate },
      statistics: stats[0],
    };
  }

  private async generateAcademicReport(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const stats = await sequelize.query(
      `SELECT 
        COUNT(DISTINCT g."studentId") as students,
        COUNT(g.id) as totalGrades,
        AVG(g.percentage) as averageGrade,
        MIN(g.percentage) as minGrade,
        MAX(g.percentage) as maxGrade
       FROM grades g
       JOIN assessments a ON g."assessmentId" = a.id
       WHERE a."schoolId" = :schoolId
       AND g."createdAt" >= :startDate
       AND g."createdAt" <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    return {
      type: 'academic',
      period: { startDate, endDate },
      statistics: stats[0],
    };
  }

  private async generateFinancialReport(
    schoolId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const stats = await sequelize.query(
      `SELECT 
        COUNT(*) as totalPayments,
        SUM(amount) FILTER (WHERE status = 'completed') as totalRevenue,
        SUM(amount) FILTER (WHERE status = 'pending') as pendingAmount,
        AVG(amount) FILTER (WHERE status = 'completed') as averagePayment
       FROM payments
       WHERE "schoolId" = :schoolId
       AND "createdAt" >= :startDate
       AND "createdAt" <= :endDate`,
      {
        replacements: { schoolId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    return {
      type: 'financial',
      period: { startDate, endDate },
      statistics: stats[0],
    };
  }
}
