import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse, AttendanceStatus, AttendanceMethod } from '../../shared/types';
import { idSchema } from '../../shared/utils/validation';

const markAttendanceSchema = z.object({
  studentId: z.string().uuid(),
  classId: z.string().uuid(),
  schoolId: z.string().uuid(),
  date: z.string().transform((str) => new Date(str)),
  status: z.nativeEnum(AttendanceStatus),
  method: z.nativeEnum(AttendanceMethod),
  notes: z.string().optional(),
});

const bulkMarkSchema = z.object({
  records: z.array(z.object({
    studentId: z.string().uuid(),
    status: z.nativeEnum(AttendanceStatus),
    notes: z.string().optional(),
  })),
  classId: z.string().uuid(),
  schoolId: z.string().uuid(),
  date: z.string().transform((str) => new Date(str)),
  method: z.nativeEnum(AttendanceMethod),
});

export class AttendanceController {
  private attendanceService: AttendanceService;

  constructor() {
    this.attendanceService = new AttendanceService();
  }

  markAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(markAttendanceSchema, req.body);
      const attendance = await this.attendanceService.markAttendance({
        ...data,
        markedBy: req.user!.userId,
      });

      const response: ApiResponse = {
        success: true,
        data: attendance,
        message: 'Attendance marked successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  bulkMarkAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(bulkMarkSchema, req.body);
      const result = await this.attendanceService.bulkMarkAttendance(
        data.records,
        data.classId,
        data.schoolId,
        data.date,
        req.user!.userId,
        data.method
      );

      const response: ApiResponse = {
        success: true,
        data: result,
        message: `Marked attendance for ${result.success} students`,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAttendanceByStudent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = validate(z.object({ studentId: z.string().uuid() }), req.params);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const attendance = await this.attendanceService.getAttendanceByStudent(
        studentId,
        startDate,
        endDate
      );

      const response: ApiResponse = {
        success: true,
        data: attendance,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getAttendanceStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { studentId } = validate(z.object({ studentId: z.string().uuid() }), req.params);
      const startDate = new Date(req.query.startDate as string);
      const endDate = new Date(req.query.endDate as string);

      const stats = await this.attendanceService.getAttendanceStats(
        studentId,
        startDate,
        endDate
      );

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
