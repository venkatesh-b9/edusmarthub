import { DataRecord } from '../types';
import logger from './logger';

export class DataTransformer {
  transform(record: DataRecord): any {
    try {
      const transformed = {
        ...record.data,
        _transformed: true,
        _transformationTime: new Date().toISOString(),
        _source: record.source,
        _type: record.type,
      };

      // Type-specific transformations
      switch (record.type) {
        case 'attendance':
          return this.transformAttendance(transformed);
        case 'grade':
          return this.transformGrade(transformed);
        case 'user':
          return this.transformUser(transformed);
        default:
          return transformed;
      }
    } catch (error: any) {
      logger.error(`Transformation error: ${error.message}`);
      throw error;
    }
  }

  private transformAttendance(data: any): any {
    return {
      ...data,
      date: this.normalizeDate(data.date),
      statusCode: this.getStatusCode(data.status),
      isPresent: data.status === 'present',
    };
  }

  private transformGrade(data: any): any {
    const percentage = data.maxScore > 0 
      ? (data.score / data.maxScore) * 100 
      : 0;

    return {
      ...data,
      percentage: Math.round(percentage * 100) / 100,
      grade: this.calculateGrade(percentage),
      isPassing: percentage >= 60,
    };
  }

  private transformUser(data: any): any {
    return {
      ...data,
      fullName: `${data.firstName} ${data.lastName}`,
      nameInitials: `${data.firstName?.[0] || ''}${data.lastName?.[0] || ''}`,
    };
  }

  private normalizeDate(date: any): string {
    if (date instanceof Date) {
      return date.toISOString();
    }
    if (typeof date === 'string') {
      return new Date(date).toISOString();
    }
    return new Date().toISOString();
  }

  private getStatusCode(status: string): number {
    const codes: Record<string, number> = {
      present: 1,
      absent: 0,
      late: 2,
      excused: 3,
    };
    return codes[status] || 0;
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}
