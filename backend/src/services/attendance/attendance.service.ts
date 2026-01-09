import { Attendance, AttendanceStatus, AttendanceMethod } from '../../shared/types';
import { NotFoundError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';
import { publishMessage } from '../../config/rabbitmq';
import redis from '../../config/redis';

export class AttendanceService {
  async markAttendance(data: {
    studentId: string;
    classId: string;
    schoolId: string;
    date: Date;
    status: AttendanceStatus;
    method: AttendanceMethod;
    markedBy: string;
    notes?: string;
  }): Promise<Attendance> {
    const [result] = await sequelize.query(
      `INSERT INTO attendance (id, "studentId", "classId", "schoolId", date, status, method, "markedBy", notes, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), :studentId, :classId, :schoolId, :date, :status, :method, :markedBy, :notes, NOW(), NOW())
       RETURNING *`,
      {
        replacements: {
          studentId: data.studentId,
          classId: data.classId,
          schoolId: data.schoolId,
          date: data.date,
          status: data.status,
          method: data.method,
          markedBy: data.markedBy,
          notes: data.notes || null,
        },
        type: QueryTypes.SELECT,
      }
    ) as Attendance[];

    // Publish real-time update
    await publishMessage('notifications', {
      type: 'attendance_marked',
      data: result,
      schoolId: data.schoolId,
    });

    // Cache attendance for quick access
    await redis.setex(
      `attendance:${data.studentId}:${data.date.toISOString().split('T')[0]}`,
      86400, // 24 hours
      JSON.stringify(result)
    );

    logger.info(`Attendance marked for student ${data.studentId}`);
    return result;
  }

  async bulkMarkAttendance(
    records: Array<{
      studentId: string;
      status: AttendanceStatus;
      notes?: string;
    }>,
    classId: string,
    schoolId: string,
    date: Date,
    markedBy: string,
    method: AttendanceMethod
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const record of records) {
      try {
        await this.markAttendance({
          ...record,
          classId,
          schoolId,
          date,
          method,
          markedBy,
        });
        success++;
      } catch (error) {
        logger.error(`Failed to mark attendance for ${record.studentId}:`, error);
        failed++;
      }
    }

    return { success, failed };
  }

  async getAttendanceByStudent(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Attendance[]> {
    const attendance = await sequelize.query(
      `SELECT * FROM attendance 
       WHERE "studentId" = :studentId 
       AND date >= :startDate 
       AND date <= :endDate 
       ORDER BY date DESC`,
      {
        replacements: { studentId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as Attendance[];

    return attendance;
  }

  async getAttendanceByClass(
    classId: string,
    date: Date
  ): Promise<Attendance[]> {
    const attendance = await sequelize.query(
      `SELECT * FROM attendance 
       WHERE "classId" = :classId 
       AND date = :date 
       ORDER BY "studentId"`,
      {
        replacements: { classId, date },
        type: QueryTypes.SELECT,
      }
    ) as Attendance[];

    return attendance;
  }

  async updateAttendance(
    id: string,
    data: { status?: AttendanceStatus; notes?: string }
  ): Promise<Attendance> {
    const attendance = await this.findById(id);
    if (!attendance) {
      throw new NotFoundError('Attendance', id);
    }

    const updateFields: string[] = [];
    const replacements: any = { id };

    if (data.status) {
      updateFields.push('status = :status');
      replacements.status = data.status;
    }

    if (data.notes !== undefined) {
      updateFields.push('notes = :notes');
      replacements.notes = data.notes;
    }

    updateFields.push('"updatedAt" = NOW()');

    const [result] = await sequelize.query(
      `UPDATE attendance SET ${updateFields.join(', ')} WHERE id = :id RETURNING *`,
      {
        replacements,
        type: QueryTypes.SELECT,
      }
    ) as Attendance[];

    // Publish update
    await publishMessage('notifications', {
      type: 'attendance_updated',
      data: result,
      schoolId: attendance.schoolId,
    });

    return result;
  }

  async findById(id: string): Promise<Attendance | null> {
    const [attendance] = await sequelize.query(
      `SELECT * FROM attendance WHERE id = :id LIMIT 1`,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
      }
    ) as Attendance[];

    return attendance || null;
  }

  async getAttendanceStats(
    studentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: number;
  }> {
    const stats = await sequelize.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'present') as present,
        COUNT(*) FILTER (WHERE status = 'absent') as absent,
        COUNT(*) FILTER (WHERE status = 'late') as late,
        COUNT(*) FILTER (WHERE status = 'excused') as excused
       FROM attendance 
       WHERE "studentId" = :studentId 
       AND date >= :startDate 
       AND date <= :endDate`,
      {
        replacements: { studentId, startDate, endDate },
        type: QueryTypes.SELECT,
      }
    ) as any[];

    const stat = stats[0];
    const total = parseInt(stat.total) || 0;
    const present = parseInt(stat.present) || 0;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return {
      total,
      present: parseInt(stat.present) || 0,
      absent: parseInt(stat.absent) || 0,
      late: parseInt(stat.late) || 0,
      excused: parseInt(stat.excused) || 0,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    };
  }
}
