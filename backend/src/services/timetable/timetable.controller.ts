import { Request, Response, NextFunction } from 'express';
import { TimetableService, TimetableGenerationOptions } from './timetable.service';
import { validate } from '../../shared/utils/validation';
import { z } from 'zod';
import { ApiResponse } from '../../shared/types';
import { paginationSchema } from '../../shared/utils/validation';

const timetableService = new TimetableService();

// Validation schemas
const createSchoolTimingSchema = z.object({
  academicYearId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  periodDurationMinutes: z.number().int().min(15).max(120),
  totalPeriods: z.number().int().min(1).max(15),
  schoolDays: z.number().int().min(1).max(127), // Bitmask
  shiftName: z.string().optional(),
  shiftNumber: z.number().int().min(1).optional(),
});

const createBreakScheduleSchema = z.object({
  schoolTimingId: z.string().uuid(),
  name: z.string().min(1),
  breakType: z.enum(['break', 'activity', 'special_period', 'assembly']),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  days: z.number().int().min(1).max(127),
  isOptional: z.boolean().optional(),
  requiresAttendance: z.boolean().optional(),
  location: z.string().optional(),
  sequenceOrder: z.number().int().optional(),
});

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  building: z.string().optional(),
  floor: z.number().int().optional(),
  roomType: z.string().min(1),
  capacity: z.number().int().positive().optional(),
  hasProjector: z.boolean().optional(),
  hasComputerLab: z.boolean().optional(),
  hasScienceLab: z.boolean().optional(),
  specialEquipment: z.array(z.string()).optional(),
});

const createTimetableSchema = z.object({
  sectionId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid().optional(),
  name: z.string().optional(),
  schoolTimingId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
});

const createPeriodSchema = z.object({
  timetableId: z.string().uuid(),
  dayOfWeek: z.number().int().min(0).max(6),
  periodNumber: z.number().int().positive(),
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid().optional(),
  roomId: z.string().uuid().optional(),
  roomNumber: z.string().optional(),
  building: z.string().optional(),
});

const updatePeriodSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/).optional(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional().nullable(),
  roomId: z.string().uuid().optional().nullable(),
  roomNumber: z.string().optional(),
  building: z.string().optional(),
  isActive: z.boolean().optional(),
});

const generateTimetableSchema = z.object({
  mode: z.enum(['balanced', 'teacher_preference', 'student_focus', 'room_optimization', 'ai_powered']),
  targetSections: z.array(z.string().uuid()).min(1),
  academicYearId: z.string().uuid(),
  termId: z.string().uuid().optional(),
  constraints: z.object({
    maxPeriodsPerDay: z.number().int().positive().optional(),
    maxConsecutivePeriods: z.number().int().positive().optional(),
    avoidBackToBackSubjects: z.boolean().optional(),
    preferredTimeSlots: z.record(z.any()).optional(),
    roomPreferences: z.record(z.any()).optional(),
  }).optional(),
  optimizationSettings: z.object({
    balanceWorkload: z.boolean().optional(),
    minimizeRoomChanges: z.boolean().optional(),
    maximizeFreePeriods: z.boolean().optional(),
  }).optional(),
});

export class TimetableController {
  // ==================== School Timing ====================
  
  createSchoolTiming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createSchoolTimingSchema, req.body);
      const tenantId = req.user!.schoolId || req.body.tenantId;
      
      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const timing = await timetableService.createSchoolTiming({
        tenantId,
        ...data,
      });

      const response: ApiResponse = {
        success: true,
        data: timing,
        message: 'School timing created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getSchoolTiming = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { academicYearId } = validate(z.object({
        academicYearId: z.string().uuid(),
      }), req.params);
      
      const shiftNumber = parseInt(req.query.shiftNumber as string) || 1;
      const tenantId = req.user!.schoolId || req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const timing = await timetableService.getSchoolTiming(tenantId, academicYearId, shiftNumber);

      if (!timing) {
        return res.status(404).json({
          success: false,
          error: 'School timing not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: timing,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Break Schedules ====================
  
  createBreakSchedule = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createBreakScheduleSchema, req.body);
      const tenantId = req.user!.schoolId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const breakSchedule = await timetableService.createBreakSchedule({
        tenantId,
        ...data,
      });

      const response: ApiResponse = {
        success: true,
        data: breakSchedule,
        message: 'Break schedule created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getBreakSchedules = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { schoolTimingId } = validate(z.object({
        schoolTimingId: z.string().uuid(),
      }), req.params);

      const schedules = await timetableService.getBreakSchedules(schoolTimingId);

      const response: ApiResponse = {
        success: true,
        data: schedules,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Rooms ====================
  
  createRoom = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createRoomSchema, req.body);
      const tenantId = req.user!.schoolId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const room = await timetableService.createRoom({
        tenantId,
        ...data,
      });

      const response: ApiResponse = {
        success: true,
        data: room,
        message: 'Room created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getRooms = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.user!.schoolId || req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const filters: any = {};
      if (req.query.roomType) {
        filters.roomType = req.query.roomType as string;
      }
      if (req.query.isAvailable !== undefined) {
        filters.isAvailable = req.query.isAvailable === 'true';
      }

      const rooms = await timetableService.getRooms(tenantId, filters);

      const response: ApiResponse = {
        success: true,
        data: rooms,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Teacher Availability ====================
  
  setTeacherAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(z.object({
        teacherId: z.string().uuid(),
        academicYearId: z.string().uuid(),
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
        maxPeriodsPerDay: z.number().int().positive().optional(),
        maxPeriodsPerWeek: z.number().int().positive().optional(),
        preferredTimeSlots: z.any().optional(),
      }), req.body);

      const tenantId = req.user!.schoolId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const availability = await timetableService.setTeacherAvailability({
        tenantId,
        ...data,
      });

      const response: ApiResponse = {
        success: true,
        data: availability,
        message: 'Teacher availability set successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTeacherAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { teacherId } = validate(z.object({
        teacherId: z.string().uuid(),
      }), req.params);

      const { academicYearId } = validate(z.object({
        academicYearId: z.string().uuid(),
      }), req.query);

      const availability = await timetableService.getTeacherAvailability(teacherId, academicYearId);

      const response: ApiResponse = {
        success: true,
        data: availability,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Timetables ====================
  
  createTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createTimetableSchema, req.body);
      const tenantId = req.user!.schoolId || req.body.tenantId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          error: 'Tenant ID is required',
        });
      }

      const timetable = await timetableService.createTimetable({
        tenantId,
        ...data,
      });

      const response: ApiResponse = {
        success: true,
        data: timetable,
        message: 'Timetable created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(z.object({
        id: z.string().uuid(),
      }), req.params);

      const timetable = await timetableService.getTimetable(id);

      if (!timetable) {
        return res.status(404).json({
          success: false,
          error: 'Timetable not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: timetable,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTimetableBySection = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sectionId } = validate(z.object({
        sectionId: z.string().uuid(),
      }), req.params);

      const { academicYearId } = validate(z.object({
        academicYearId: z.string().uuid(),
      }), req.query);

      const termId = req.query.termId as string | undefined;

      const timetable = await timetableService.getTimetableBySection(sectionId, academicYearId, termId);

      if (!timetable) {
        return res.status(404).json({
          success: false,
          error: 'Timetable not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: timetable,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Timetable Periods ====================
  
  createPeriod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = validate(createPeriodSchema, req.body);

      const period = await timetableService.createPeriod(data);

      const response: ApiResponse = {
        success: true,
        data: period,
        message: 'Period created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  updatePeriod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(z.object({
        id: z.string().uuid(),
      }), req.params);

      const data = validate(updatePeriodSchema, req.body);

      const period = await timetableService.updatePeriod(id, data);

      const response: ApiResponse = {
        success: true,
        data: period,
        message: 'Period updated successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  deletePeriod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = validate(z.object({
        id: z.string().uuid(),
      }), req.params);

      await timetableService.deletePeriod(id);

      const response: ApiResponse = {
        success: true,
        message: 'Period deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  getTimetablePeriods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { timetableId } = validate(z.object({
        timetableId: z.string().uuid(),
      }), req.params);

      const periods = await timetableService.getTimetablePeriods(timetableId);

      const response: ApiResponse = {
        success: true,
        data: periods,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Conflicts ====================
  
  getConflicts = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { timetableId } = validate(z.object({
        timetableId: z.string().uuid(),
      }), req.params);

      const filters: any = {};
      if (req.query.isResolved !== undefined) {
        filters.isResolved = req.query.isResolved === 'true';
      }
      if (req.query.severity) {
        filters.severity = req.query.severity as string;
      }

      const conflicts = await timetableService.getConflicts(timetableId, filters);

      const response: ApiResponse = {
        success: true,
        data: conflicts,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  // ==================== Generation ====================
  
  generateTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const options = validate(generateTimetableSchema, req.body);
      const generatedBy = req.user!.userId;

      const result = await timetableService.generateTimetable(options, generatedBy);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: result.timetables.length > 0 
          ? `Timetable generated successfully for ${result.timetables.length} section(s)`
          : 'Timetable generation completed (empty timetables created - AI service unavailable)',
      };

      res.status(200).json(response);
    } catch (error: any) {
      // Provide more detailed error messages
      const errorMessage = error.message || 'Failed to generate timetable';
      
      if (errorMessage.includes('School timing not configured')) {
        return res.status(400).json({
          success: false,
          error: 'Please configure school timings before generating timetable',
        });
      }

      if (errorMessage.includes('AI service') || errorMessage.includes('ECONNREFUSED')) {
        return res.status(503).json({
          success: false,
          error: 'AI service is unavailable. Please ensure the AI service is running or use a different generation mode.',
        });
      }

      next(error);
    }
  };

  // ==================== Bulk Operations ====================
  
  bulkCreatePeriods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const periods = validate(z.array(createPeriodSchema), req.body.periods);

      const created = await timetableService.bulkCreatePeriods(periods);

      const response: ApiResponse = {
        success: true,
        data: created,
        message: `${created.length} periods created successfully`,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  copyTimetable = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sourceTimetableId } = validate(z.object({
        sourceTimetableId: z.string().uuid(),
      }), req.params);

      const { targetSectionId, academicYearId } = validate(z.object({
        targetSectionId: z.string().uuid(),
        academicYearId: z.string().uuid(),
      }), req.body);

      const timetable = await timetableService.copyTimetable(
        sourceTimetableId,
        targetSectionId,
        academicYearId
      );

      const response: ApiResponse = {
        success: true,
        data: timetable,
        message: 'Timetable copied successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
