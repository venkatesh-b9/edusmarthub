import sequelize from '../../config/database';
import { QueryTypes } from 'sequelize';
import { NotFoundError, ConflictError } from '../../shared/utils/errors';
import logger from '../../shared/utils/logger';
import axios from 'axios';

// Types
export interface SchoolTiming {
  id: string;
  tenantId: string;
  academicYearId: string;
  startTime: string;
  endTime: string;
  periodDurationMinutes: number;
  totalPeriods: number;
  schoolDays: number; // Bitmask
  shiftName?: string;
  shiftNumber: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BreakSchedule {
  id: string;
  tenantId: string;
  schoolTimingId: string;
  name: string;
  breakType: 'break' | 'activity' | 'special_period' | 'assembly';
  startTime: string;
  endTime: string;
  days: number; // Bitmask
  isOptional: boolean;
  requiresAttendance: boolean;
  location?: string;
  sequenceOrder: number;
  isActive: boolean;
}

export interface Timetable {
  id: string;
  tenantId: string;
  sectionId: string;
  academicYearId: string;
  termId?: string;
  name?: string;
  versionId?: string;
  templateId?: string;
  schoolTimingId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimetablePeriod {
  id: string;
  timetableId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  periodNumber: number;
  startTime: string;
  endTime: string;
  subjectId: string;
  teacherId?: string;
  roomId?: string;
  roomNumber?: string;
  building?: string;
  isActive: boolean;
}

export interface Room {
  id: string;
  tenantId: string;
  roomNumber: string;
  building?: string;
  floor?: number;
  roomType: string;
  capacity?: number;
  hasProjector: boolean;
  hasComputerLab: boolean;
  hasScienceLab: boolean;
  specialEquipment?: string[];
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeacherAvailability {
  id: string;
  teacherId: string;
  tenantId: string;
  academicYearId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxPeriodsPerDay?: number;
  maxPeriodsPerWeek?: number;
  preferredTimeSlots?: any;
  isActive: boolean;
}

export interface TimetableConflict {
  id: string;
  tenantId: string;
  timetableId?: string;
  conflictType: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  affectedTeacherId?: string;
  affectedSectionId?: string;
  affectedPeriodId?: string;
  affectedRoomId?: string;
  conflictData?: any;
  conflictingPeriods?: string[];
  isResolved: boolean;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: Date;
  detectedAt: Date;
}

export interface TimetableGenerationOptions {
  mode: 'balanced' | 'teacher_preference' | 'student_focus' | 'room_optimization' | 'ai_powered';
  targetSections: string[];
  academicYearId: string;
  termId?: string;
  constraints?: {
    maxPeriodsPerDay?: number;
    maxConsecutivePeriods?: number;
    avoidBackToBackSubjects?: boolean;
    preferredTimeSlots?: Record<string, any>;
    roomPreferences?: Record<string, any>;
  };
  optimizationSettings?: {
    balanceWorkload?: boolean;
    minimizeRoomChanges?: boolean;
    maximizeFreePeriods?: boolean;
  };
}

export class TimetableService {
  // ==================== School Timing Configuration ====================
  
  async createSchoolTiming(data: {
    tenantId: string;
    academicYearId: string;
    startTime: string;
    endTime: string;
    periodDurationMinutes: number;
    totalPeriods: number;
    schoolDays: number;
    shiftName?: string;
    shiftNumber?: number;
  }): Promise<SchoolTiming> {
    const [result] = await sequelize.query(
      `INSERT INTO school_timings (
        id, tenant_id, academic_year_id, start_time, end_time, 
        period_duration_minutes, total_periods, school_days, 
        shift_name, shift_number, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), :tenantId, :academicYearId, :startTime, :endTime,
        :periodDurationMinutes, :totalPeriods, :schoolDays,
        :shiftName, :shiftNumber, true, NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          tenantId: data.tenantId,
          academicYearId: data.academicYearId,
          startTime: data.startTime,
          endTime: data.endTime,
          periodDurationMinutes: data.periodDurationMinutes,
          totalPeriods: data.totalPeriods,
          schoolDays: data.schoolDays,
          shiftName: data.shiftName || null,
          shiftNumber: data.shiftNumber || 1,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as SchoolTiming[];

    logger.info(`School timing created: ${result.id}`);
    return result;
  }

  async getSchoolTiming(tenantId: string, academicYearId: string, shiftNumber: number = 1): Promise<SchoolTiming | null> {
    const [result] = await sequelize.query(
      `SELECT * FROM school_timings 
       WHERE tenant_id = :tenantId 
       AND academic_year_id = :academicYearId 
       AND shift_number = :shiftNumber 
       AND is_active = true
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        replacements: { tenantId, academicYearId, shiftNumber },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as SchoolTiming[];

    return result || null;
  }

  // ==================== Break Schedule Management ====================
  
  async createBreakSchedule(data: {
    tenantId: string;
    schoolTimingId: string;
    name: string;
    breakType: 'break' | 'activity' | 'special_period' | 'assembly';
    startTime: string;
    endTime: string;
    days: number;
    isOptional?: boolean;
    requiresAttendance?: boolean;
    location?: string;
    sequenceOrder?: number;
  }): Promise<BreakSchedule> {
    const [result] = await sequelize.query(
      `INSERT INTO break_schedules (
        id, tenant_id, school_timing_id, name, break_type, 
        start_time, end_time, days, is_optional, requires_attendance,
        location, sequence_order, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), :tenantId, :schoolTimingId, :name, :breakType,
        :startTime, :endTime, :days, :isOptional, :requiresAttendance,
        :location, :sequenceOrder, true, NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          tenantId: data.tenantId,
          schoolTimingId: data.schoolTimingId,
          name: data.name,
          breakType: data.breakType,
          startTime: data.startTime,
          endTime: data.endTime,
          days: data.days,
          isOptional: data.isOptional || false,
          requiresAttendance: data.requiresAttendance || false,
          location: data.location || null,
          sequenceOrder: data.sequenceOrder || 0,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as BreakSchedule[];

    return result;
  }

  async getBreakSchedules(schoolTimingId: string): Promise<BreakSchedule[]> {
    const results = await sequelize.query(
      `SELECT * FROM break_schedules 
       WHERE school_timing_id = :schoolTimingId 
       AND is_active = true
       ORDER BY sequence_order, start_time`,
      {
        replacements: { schoolTimingId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as BreakSchedule[];

    return results;
  }

  // ==================== Room Management ====================
  
  async createRoom(data: {
    tenantId: string;
    roomNumber: string;
    building?: string;
    floor?: number;
    roomType: string;
    capacity?: number;
    hasProjector?: boolean;
    hasComputerLab?: boolean;
    hasScienceLab?: boolean;
    specialEquipment?: string[];
  }): Promise<Room> {
    // Check for duplicate
    const existing = await this.getRoomByNumber(data.tenantId, data.roomNumber, data.building);
    if (existing) {
      throw new ConflictError('Room with this number already exists');
    }

    const [result] = await sequelize.query(
      `INSERT INTO rooms (
        id, tenant_id, room_number, building, floor, room_type, capacity,
        has_projector, has_computer_lab, has_science_lab, special_equipment,
        is_available, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), :tenantId, :roomNumber, :building, :floor, :roomType, :capacity,
        :hasProjector, :hasComputerLab, :hasScienceLab, :specialEquipment,
        true, NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          tenantId: data.tenantId,
          roomNumber: data.roomNumber,
          building: data.building || null,
          floor: data.floor || null,
          roomType: data.roomType,
          capacity: data.capacity || null,
          hasProjector: data.hasProjector || false,
          hasComputerLab: data.hasComputerLab || false,
          hasScienceLab: data.hasScienceLab || false,
          specialEquipment: data.specialEquipment ? JSON.stringify(data.specialEquipment) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Room[];

    return result;
  }

  async getRoomByNumber(tenantId: string, roomNumber: string, building?: string): Promise<Room | null> {
    const [result] = await sequelize.query(
      `SELECT * FROM rooms 
       WHERE tenant_id = :tenantId 
       AND room_number = :roomNumber 
       AND (building = :building OR (building IS NULL AND :building IS NULL))
       LIMIT 1`,
      {
        replacements: { tenantId, roomNumber, building: building || null },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Room[];

    return result || null;
  }

  async getRooms(tenantId: string, filters?: { roomType?: string; isAvailable?: boolean }): Promise<Room[]> {
    let query = `SELECT * FROM rooms WHERE tenant_id = :tenantId`;
    const replacements: any = { tenantId };

    if (filters?.roomType) {
      query += ` AND room_type = :roomType`;
      replacements.roomType = filters.roomType;
    }

    if (filters?.isAvailable !== undefined) {
      query += ` AND is_available = :isAvailable`;
      replacements.isAvailable = filters.isAvailable;
    }

    query += ` ORDER BY building, room_number`;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as Room[];

    return results;
  }

  // ==================== Teacher Availability ====================
  
  async setTeacherAvailability(data: {
    teacherId: string;
    tenantId: string;
    academicYearId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    maxPeriodsPerDay?: number;
    maxPeriodsPerWeek?: number;
    preferredTimeSlots?: any;
  }): Promise<TeacherAvailability> {
    const [result] = await sequelize.query(
      `INSERT INTO teacher_availability (
        id, teacher_id, tenant_id, academic_year_id, day_of_week,
        start_time, end_time, max_periods_per_day, max_periods_per_week,
        preferred_time_slots, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), :teacherId, :tenantId, :academicYearId, :dayOfWeek,
        :startTime, :endTime, :maxPeriodsPerDay, :maxPeriodsPerWeek,
        :preferredTimeSlots, true, NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          teacherId: data.teacherId,
          tenantId: data.tenantId,
          academicYearId: data.academicYearId,
          dayOfWeek: data.dayOfWeek,
          startTime: data.startTime,
          endTime: data.endTime,
          maxPeriodsPerDay: data.maxPeriodsPerDay || null,
          maxPeriodsPerWeek: data.maxPeriodsPerWeek || null,
          preferredTimeSlots: data.preferredTimeSlots ? JSON.stringify(data.preferredTimeSlots) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TeacherAvailability[];

    return result;
  }

  async getTeacherAvailability(teacherId: string, academicYearId: string): Promise<TeacherAvailability[]> {
    const results = await sequelize.query(
      `SELECT * FROM teacher_availability 
       WHERE teacher_id = :teacherId 
       AND academic_year_id = :academicYearId 
       AND is_active = true
       ORDER BY day_of_week, start_time`,
      {
        replacements: { teacherId, academicYearId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TeacherAvailability[];

    return results;
  }

  // ==================== Timetable CRUD ====================
  
  async createTimetable(data: {
    tenantId: string;
    sectionId: string;
    academicYearId: string;
    termId?: string;
    name?: string;
    schoolTimingId?: string;
    templateId?: string;
  }): Promise<Timetable> {
    const [result] = await sequelize.query(
      `INSERT INTO timetables (
        id, tenant_id, section_id, academic_year_id, term_id,
        name, school_timing_id, template_id, is_active, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), :tenantId, :sectionId, :academicYearId, :termId,
        :name, :schoolTimingId, :templateId, true, NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          tenantId: data.tenantId,
          sectionId: data.sectionId,
          academicYearId: data.academicYearId,
          termId: data.termId || null,
          name: data.name || null,
          schoolTimingId: data.schoolTimingId || null,
          templateId: data.templateId || null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Timetable[];

    logger.info(`Timetable created: ${result.id} for section ${data.sectionId}`);
    return result;
  }

  async getTimetable(id: string): Promise<Timetable | null> {
    const [result] = await sequelize.query(
      `SELECT * FROM timetables WHERE id = :id`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as Timetable[];

    return result || null;
  }

  async getTimetableBySection(sectionId: string, academicYearId: string, termId?: string): Promise<Timetable | null> {
    let query = `SELECT * FROM timetables 
                 WHERE section_id = :sectionId 
                 AND academic_year_id = :academicYearId`;
    const replacements: any = { sectionId, academicYearId };

    if (termId) {
      query += ` AND term_id = :termId`;
      replacements.termId = termId;
    }

    query += ` AND is_active = true ORDER BY created_at DESC LIMIT 1`;

    const [result] = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as Timetable[];

    return result || null;
  }

  // ==================== Timetable Periods ====================
  
  async createPeriod(data: {
    timetableId: string;
    dayOfWeek: number;
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectId: string;
    teacherId?: string;
    roomId?: string;
    roomNumber?: string;
    building?: string;
  }): Promise<TimetablePeriod> {
    // Check for conflicts before creating
    const conflicts = await this.detectPeriodConflicts({
      timetableId: data.timetableId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      teacherId: data.teacherId,
      roomId: data.roomId,
      excludePeriodId: undefined,
    });

    if (conflicts.length > 0) {
      const criticalConflicts = conflicts.filter(c => c.severity === 'error' || c.severity === 'critical');
      if (criticalConflicts.length > 0) {
        throw new ConflictError(`Cannot create period: ${criticalConflicts[0].conflictData?.message || 'Conflict detected'}`);
      }
    }

    const [result] = await sequelize.query(
      `INSERT INTO timetable_periods (
        id, timetable_id, day_of_week, period_number, start_time, end_time,
        subject_id, teacher_id, room_id, room_number, building, is_active
      )
      VALUES (
        gen_random_uuid(), :timetableId, :dayOfWeek, :periodNumber, :startTime, :endTime,
        :subjectId, :teacherId, :roomId, :roomNumber, :building, true
      )
      RETURNING *`,
      {
        replacements: {
          timetableId: data.timetableId,
          dayOfWeek: data.dayOfWeek,
          periodNumber: data.periodNumber,
          startTime: data.startTime,
          endTime: data.endTime,
          subjectId: data.subjectId,
          teacherId: data.teacherId || null,
          roomId: data.roomId || null,
          roomNumber: data.roomNumber || null,
          building: data.building || null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TimetablePeriod[];

    // Re-detect conflicts after creation
    await this.detectAndLogConflicts(data.timetableId);

    return result;
  }

  async updatePeriod(id: string, data: Partial<TimetablePeriod>): Promise<TimetablePeriod> {
    const period = await this.getPeriod(id);
    if (!period) {
      throw new NotFoundError('Timetable period', id);
    }

    // Check for conflicts if time/teacher/room changed
    if (data.startTime || data.endTime || data.teacherId || data.roomId) {
      const conflicts = await this.detectPeriodConflicts({
        timetableId: period.timetableId,
        dayOfWeek: data.dayOfWeek ?? period.dayOfWeek,
        startTime: data.startTime ?? period.startTime,
        endTime: data.endTime ?? period.endTime,
        teacherId: data.teacherId ?? period.teacherId,
        roomId: data.roomId ?? period.roomId,
        excludePeriodId: id,
      });

      const criticalConflicts = conflicts.filter(c => c.severity === 'error' || c.severity === 'critical');
      if (criticalConflicts.length > 0) {
        throw new ConflictError(`Cannot update period: ${criticalConflicts[0].conflictData?.message || 'Conflict detected'}`);
      }
    }

    const updateFields: string[] = [];
    const replacements: any = { id };

    if (data.startTime !== undefined) {
      updateFields.push('start_time = :startTime');
      replacements.startTime = data.startTime;
    }
    if (data.endTime !== undefined) {
      updateFields.push('end_time = :endTime');
      replacements.endTime = data.endTime;
    }
    if (data.subjectId !== undefined) {
      updateFields.push('subject_id = :subjectId');
      replacements.subjectId = data.subjectId;
    }
    if (data.teacherId !== undefined) {
      updateFields.push('teacher_id = :teacherId');
      replacements.teacherId = data.teacherId || null;
    }
    if (data.roomId !== undefined) {
      updateFields.push('room_id = :roomId');
      replacements.roomId = data.roomId || null;
    }
    if (data.roomNumber !== undefined) {
      updateFields.push('room_number = :roomNumber');
      replacements.roomNumber = data.roomNumber || null;
    }
    if (data.building !== undefined) {
      updateFields.push('building = :building');
      replacements.building = data.building || null;
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = :isActive');
      replacements.isActive = data.isActive;
    }

    if (updateFields.length === 0) {
      return period;
    }

    const [result] = await sequelize.query(
      `UPDATE timetable_periods 
       SET ${updateFields.join(', ')} 
       WHERE id = :id 
       RETURNING *`,
      {
        replacements,
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TimetablePeriod[];

    // Re-detect conflicts after update
    await this.detectAndLogConflicts(period.timetableId);

    return result;
  }

  async deletePeriod(id: string): Promise<void> {
    const period = await this.getPeriod(id);
    if (!period) {
      throw new NotFoundError('Timetable period', id);
    }

    await sequelize.query(
      `DELETE FROM timetable_periods WHERE id = :id`,
      {
        replacements: { id },
      }
    );

    // Re-detect conflicts after deletion
    await this.detectAndLogConflicts(period.timetableId);
  }

  async getPeriod(id: string): Promise<TimetablePeriod | null> {
    const [result] = await sequelize.query(
      `SELECT * FROM timetable_periods WHERE id = :id`,
      {
        replacements: { id },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TimetablePeriod[];

    return result || null;
  }

  async getTimetablePeriods(timetableId: string): Promise<TimetablePeriod[]> {
    const results = await sequelize.query(
      `SELECT * FROM timetable_periods 
       WHERE timetable_id = :timetableId 
       AND is_active = true
       ORDER BY day_of_week, period_number`,
      {
        replacements: { timetableId },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as TimetablePeriod[];

    return results;
  }

  // ==================== Conflict Detection ====================
  
  async detectPeriodConflicts(data: {
    timetableId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    teacherId?: string;
    roomId?: string;
    excludePeriodId?: string;
  }): Promise<TimetableConflict[]> {
    const conflicts: TimetableConflict[] = [];

    // Check teacher overlap
    if (data.teacherId) {
      const overlapping = await sequelize.query(
        `SELECT tp.* FROM timetable_periods tp
         WHERE tp.timetable_id != :timetableId
         AND tp.teacher_id = :teacherId
         AND tp.day_of_week = :dayOfWeek
         AND tp.is_active = true
         AND (
           (tp.start_time < :endTime AND tp.end_time > :startTime)
         )
         ${data.excludePeriodId ? 'AND tp.id != :excludePeriodId' : ''}`,
        {
          replacements: {
            timetableId: data.timetableId,
            teacherId: data.teacherId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            excludePeriodId: data.excludePeriodId || null,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      ) as TimetablePeriod[];

      if (overlapping.length > 0) {
        conflicts.push({
          id: '',
          tenantId: '',
          conflictType: 'teacher_overlap',
          severity: 'error',
          affectedTeacherId: data.teacherId,
          conflictData: {
            message: `Teacher is already assigned to another class at this time`,
            overlappingPeriods: overlapping.map(p => p.id),
          },
          conflictingPeriods: overlapping.map(p => p.id),
          isResolved: false,
          detectedAt: new Date(),
        });
      }
    }

    // Check room double booking
    if (data.roomId) {
      const overlapping = await sequelize.query(
        `SELECT tp.* FROM timetable_periods tp
         WHERE tp.room_id = :roomId
         AND tp.day_of_week = :dayOfWeek
         AND tp.is_active = true
         AND (
           (tp.start_time < :endTime AND tp.end_time > :startTime)
         )
         ${data.excludePeriodId ? 'AND tp.id != :excludePeriodId' : ''}`,
        {
          replacements: {
            roomId: data.roomId,
            dayOfWeek: data.dayOfWeek,
            startTime: data.startTime,
            endTime: data.endTime,
            excludePeriodId: data.excludePeriodId || null,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      ) as TimetablePeriod[];

      if (overlapping.length > 0) {
        conflicts.push({
          id: '',
          tenantId: '',
          conflictType: 'room_double_booking',
          severity: 'error',
          affectedRoomId: data.roomId,
          conflictData: {
            message: `Room is already booked at this time`,
            overlappingPeriods: overlapping.map(p => p.id),
          },
          conflictingPeriods: overlapping.map(p => p.id),
          isResolved: false,
          detectedAt: new Date(),
        });
      }
    }

    return conflicts;
  }

  async detectAndLogConflicts(timetableId: string): Promise<TimetableConflict[]> {
    const timetable = await this.getTimetable(timetableId);
    if (!timetable) {
      return [];
    }

    const periods = await this.getTimetablePeriods(timetableId);
    const allConflicts: TimetableConflict[] = [];

    // Detect conflicts for each period
    for (const period of periods) {
      if (!period.teacherId && !period.roomId) continue;

      const conflicts = await this.detectPeriodConflicts({
        timetableId,
        dayOfWeek: period.dayOfWeek,
        startTime: period.startTime,
        endTime: period.endTime,
        teacherId: period.teacherId || undefined,
        roomId: period.roomId || undefined,
        excludePeriodId: period.id,
      });

      // Log conflicts to database
      for (const conflict of conflicts) {
        const [logged] = await sequelize.query(
          `INSERT INTO timetable_conflicts (
            id, tenant_id, timetable_id, conflict_type, severity,
            affected_teacher_id, affected_room_id, affected_period_id,
            conflict_data, conflicting_periods, is_resolved, detected_at, created_at
          )
          VALUES (
            gen_random_uuid(), :tenantId, :timetableId, :conflictType, :severity,
            :affectedTeacherId, :affectedRoomId, :affectedPeriodId,
            :conflictData, :conflictingPeriods, false, NOW(), NOW()
          )
          ON CONFLICT DO NOTHING
          RETURNING *`,
          {
            replacements: {
              tenantId: timetable.tenantId,
              timetableId,
              conflictType: conflict.conflictType,
              severity: conflict.severity,
              affectedTeacherId: conflict.affectedTeacherId || null,
              affectedRoomId: conflict.affectedRoomId || null,
              affectedPeriodId: period.id,
              conflictData: conflict.conflictData ? JSON.stringify(conflict.conflictData) : null,
              conflictingPeriods: conflict.conflictingPeriods ? JSON.stringify(conflict.conflictingPeriods) : null,
            },
            type: sequelize.QueryTypes.SELECT,
          }
        ) as TimetableConflict[];

        if (logged) {
          allConflicts.push(logged);
        }
      }
    }

    return allConflicts;
  }

  async getConflicts(timetableId: string, filters?: { isResolved?: boolean; severity?: string }): Promise<TimetableConflict[]> {
    let query = `SELECT * FROM timetable_conflicts WHERE timetable_id = :timetableId`;
    const replacements: any = { timetableId };

    if (filters?.isResolved !== undefined) {
      query += ` AND is_resolved = :isResolved`;
      replacements.isResolved = filters.isResolved;
    }

    if (filters?.severity) {
      query += ` AND severity = :severity`;
      replacements.severity = filters.severity;
    }

    query += ` ORDER BY severity DESC, detected_at DESC`;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT,
    }) as TimetableConflict[];

    return results;
  }

  // ==================== Timetable Generation ====================
  
  async generateTimetable(options: TimetableGenerationOptions, generatedBy: string): Promise<{
    generationLogId: string;
    timetables: Timetable[];
    conflicts: TimetableConflict[];
  }> {
    // Create generation log
    const [log] = await sequelize.query(
      `INSERT INTO timetable_generation_logs (
        id, tenant_id, generated_by, generation_mode, target_sections,
        academic_year_id, term_id, constraints, optimization_settings,
        status, started_at, created_at
      )
      VALUES (
        gen_random_uuid(), 
        (SELECT tenant_id FROM sections WHERE id = :firstSectionId LIMIT 1),
        :generatedBy, :mode, :targetSections,
        :academicYearId, :termId, :constraints, :optimizationSettings,
        'in_progress', NOW(), NOW()
      )
      RETURNING *`,
      {
        replacements: {
          firstSectionId: options.targetSections[0],
          generatedBy,
          mode: options.mode,
          targetSections: JSON.stringify(options.targetSections),
          academicYearId: options.academicYearId,
          termId: options.termId || null,
          constraints: options.constraints ? JSON.stringify(options.constraints) : null,
          optimizationSettings: options.optimizationSettings ? JSON.stringify(options.optimizationSettings) : null,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    ) as any[];

    const generationLogId = log.id;

    try {
      const timetables: Timetable[] = [];
      const allConflicts: TimetableConflict[] = [];

      // Get school timing and other required data
      const tenantId = await sequelize.query(
        `SELECT tenant_id FROM sections WHERE id = :firstSectionId LIMIT 1`,
        {
          replacements: { firstSectionId: options.targetSections[0] },
          type: sequelize.QueryTypes.SELECT,
        }
      ) as any[];

      if (!tenantId || tenantId.length === 0) {
        throw new Error('Could not determine tenant ID');
      }

      const schoolTiming = await this.getSchoolTiming(
        tenantId[0].tenant_id,
        options.academicYearId
      );

      if (!schoolTiming) {
        throw new Error('School timing not configured. Please set up school timings first.');
      }

      // Get required data for AI generation
      const sectionsData = await sequelize.query(
        `SELECT s.*, g.name as grade_name, g.level as grade_level 
         FROM sections s 
         JOIN grades g ON s.grade_id = g.id 
         WHERE s.id = ANY(:sectionIds)`,
        {
          replacements: { sectionIds: options.targetSections },
          type: QueryTypes.SELECT,
        }
      ) as any[];

      const sections = Array.isArray(sectionsData) && sectionsData.length > 0 
        ? sectionsData 
        : (sectionsData ? [sectionsData] : []);

      // Get teachers, subjects, rooms
      const teachersData = await sequelize.query(
        `SELECT u.id, u."firstName", u."lastName", u.email 
         FROM users u 
         WHERE u.role = 'teacher' 
         AND (u."schoolId" = :tenantId OR u."schoolId" IS NULL)
         AND u."isActive" = true`,
        {
          replacements: { tenantId: tenantId[0].tenant_id },
          type: QueryTypes.SELECT,
        }
      ) as any[];

      const teachers = Array.isArray(teachersData) && teachersData.length > 0
        ? teachersData 
        : (teachersData ? [teachersData] : []);

      const subjectsData = await sequelize.query(
        `SELECT * FROM subjects WHERE tenant_id = :tenantId AND is_active = true`,
        {
          replacements: { tenantId: tenantId[0].tenant_id },
          type: QueryTypes.SELECT,
        }
      ) as any[];

      const subjects = Array.isArray(subjectsData) && subjectsData.length > 0
        ? subjectsData 
        : (subjectsData ? [subjectsData] : []);

      const rooms = await this.getRooms(tenantId[0].tenant_id);

      // Get break schedules
      const breakSchedules = await this.getBreakSchedules(schoolTiming.id);

      // Call AI service for generation if mode is ai_powered
      if (options.mode === 'ai_powered') {
        const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
        try {
          logger.info(`Calling AI service at ${aiServiceUrl}/api/v1/ai/timetable/generate`);
          
          const response = await axios.post(
            `${aiServiceUrl}/api/v1/ai/timetable/generate`,
            {
              sections: sections.map((s: any) => ({
                id: s.id,
                name: s.name,
                grade: s.grade_level || parseInt(s.grade_name?.match(/\d+/)?.[0] || '1'),
                subjects: [], // Would need to get from curriculum
              })),
              teachers: teachers.map((t: any) => ({
                id: t.id,
                name: `${t.firstName} ${t.lastName}`,
                email: t.email,
                subjects: [], // Would need to get from teacher profile
                can_teach_all: true, // Default
              })),
              subjects: subjects.map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code,
              })),
              rooms: rooms.map((r: any) => ({
                id: r.id,
                room_number: r.room_number,
                building: r.building,
                room_type: r.room_type,
                capacity: r.capacity,
                is_available: r.is_available,
              })),
              school_timing: {
                start_time: schoolTiming.startTime,
                end_time: schoolTiming.endTime,
                period_duration_minutes: schoolTiming.periodDurationMinutes,
                total_periods: schoolTiming.totalPeriods,
                school_days: schoolTiming.schoolDays,
              },
              break_schedules: breakSchedules.map((b: any) => ({
                name: b.name,
                break_type: b.breakType,
                start_time: b.startTime,
                end_time: b.endTime,
                days: b.days,
              })),
              constraints: options.constraints,
              population_size: 100,
              generations: 1000,
              mutation_rate: 0.1,
              crossover_rate: 0.8,
            },
            {
              timeout: 120000, // 2 minutes timeout
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          const aiResult = response.data;
          
          if (aiResult.success && aiResult.timetable) {
            // Create timetables and periods from AI result
            for (const section of sections) {
              // Create timetable for this section
              const timetable = await this.createTimetable({
                tenantId: tenantId[0].tenant_id,
                sectionId: section.id,
                academicYearId: options.academicYearId,
                termId: options.termId,
                schoolTimingId: schoolTiming.id,
              });

              timetables.push(timetable);

              // Get periods for this section from AI result
              const sectionPeriods = aiResult.timetable.periods.filter(
                (p: any) => p.section_id === section.id
              );

              // Create periods
              for (const periodData of sectionPeriods) {
                try {
                  await this.createPeriod({
                    timetableId: timetable.id,
                    dayOfWeek: periodData.day_of_week,
                    periodNumber: periodData.period_number,
                    startTime: periodData.start_time,
                    endTime: periodData.end_time,
                    subjectId: periodData.subject_id,
                    teacherId: periodData.teacher_id || undefined,
                    roomId: periodData.room_id || undefined,
                  });
                } catch (error) {
                  logger.error(`Error creating period: ${error}`);
                }
              }

              // Detect conflicts
              const conflicts = await this.detectAndLogConflicts(timetable.id);
              allConflicts.push(...conflicts);
            }
          } else {
            throw new Error('AI service did not return valid timetable data');
          }
        } catch (error: any) {
          logger.error('AI generation error:', error);
          
          // Check if it's a connection error
          if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message?.includes('Network Error')) {
            logger.warn('AI service unavailable, falling back to basic generation');
            
            // Fall back to basic generation without AI
            for (const sectionId of options.targetSections) {
              const section = sections.find((s: any) => s.id === sectionId);
              if (!section) continue;

              const timetable = await this.createTimetable({
                tenantId: tenantId[0].tenant_id,
                sectionId: section.id,
                academicYearId: options.academicYearId,
                termId: options.termId,
                schoolTimingId: schoolTiming.id,
              });

              timetables.push(timetable);
              
              // Create basic periods structure (empty timetable that can be filled manually)
              logger.info(`Created empty timetable for section ${section.name}`);
            }
          } else {
            // For other errors, throw them
            throw new Error(`AI generation failed: ${error.message || 'Unknown error'}`);
          }
        }
      } else {
        // For non-AI modes, create basic timetables (can be enhanced later)
        for (const sectionId of options.targetSections) {
          const section = sections.find((s: any) => s.id === sectionId);
          if (!section) continue;

          const timetable = await this.createTimetable({
            tenantId: tenantId[0].tenant_id,
            sectionId: section.id,
            academicYearId: options.academicYearId,
            termId: options.termId,
            schoolTimingId: schoolTiming.id,
          });

          timetables.push(timetable);
        }
      }

      // Update generation log
      await sequelize.query(
        `UPDATE timetable_generation_logs 
         SET status = 'completed', 
             completed_at = NOW(),
             generated_timetables = :timetableIds,
             conflicts_detected = :conflictsDetected,
             generation_time_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))
         WHERE id = :id`,
        {
          replacements: {
            id: generationLogId,
            timetableIds: JSON.stringify(timetables.map(t => t.id)),
            conflictsDetected: allConflicts.length,
          },
        }
      );

      return { generationLogId, timetables, conflicts: allConflicts };
    } catch (error) {
      // Update generation log with error
      await sequelize.query(
        `UPDATE timetable_generation_logs 
         SET status = 'failed', 
             completed_at = NOW(),
             error_message = :errorMessage
         WHERE id = :id`,
        {
          replacements: {
            id: generationLogId,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        }
      );

      throw error;
    }
  }

  // ==================== Bulk Operations ====================
  
  async bulkCreatePeriods(periods: Array<Omit<TimetablePeriod, 'id'>>): Promise<TimetablePeriod[]> {
    const created: TimetablePeriod[] = [];

    for (const period of periods) {
      try {
        const createdPeriod = await this.createPeriod(period);
        created.push(createdPeriod);
      } catch (error) {
        logger.error(`Failed to create period: ${error}`);
        // Continue with other periods
      }
    }

    return created;
  }

  async copyTimetable(sourceTimetableId: string, targetSectionId: string, academicYearId: string): Promise<Timetable> {
    const sourceTimetable = await this.getTimetable(sourceTimetableId);
    if (!sourceTimetable) {
      throw new NotFoundError('Source timetable', sourceTimetableId);
    }

    const sourcePeriods = await this.getTimetablePeriods(sourceTimetableId);

    // Create new timetable
    const newTimetable = await this.createTimetable({
      tenantId: sourceTimetable.tenantId,
      sectionId: targetSectionId,
      academicYearId,
      termId: sourceTimetable.termId || undefined,
      name: `Copy of ${sourceTimetable.name || 'Timetable'}`,
      schoolTimingId: sourceTimetable.schoolTimingId || undefined,
    });

    // Copy periods
    const periodsToCreate = sourcePeriods.map(p => ({
      timetableId: newTimetable.id,
      dayOfWeek: p.dayOfWeek,
      periodNumber: p.periodNumber,
      startTime: p.startTime,
      endTime: p.endTime,
      subjectId: p.subjectId,
      teacherId: p.teacherId,
      roomId: p.roomId,
      roomNumber: p.roomNumber,
      building: p.building,
    }));

    await this.bulkCreatePeriods(periodsToCreate);

    return newTimetable;
  }
}
