import { Router } from 'express';
import { TimetableController } from './timetable.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const timetableController = new TimetableController();

router.use(authenticate);

// School Timing Configuration
router.post(
  '/school-timings',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.createSchoolTiming
);

router.get(
  '/school-timings/:academicYearId',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getSchoolTiming
);

// Break Schedules
router.post(
  '/break-schedules',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.createBreakSchedule
);

router.get(
  '/break-schedules/:schoolTimingId',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getBreakSchedules
);

// Rooms
router.post(
  '/rooms',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.createRoom
);

router.get(
  '/rooms',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getRooms
);

// Teacher Availability
router.post(
  '/teacher-availability',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.setTeacherAvailability
);

router.get(
  '/teacher-availability/:teacherId',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getTeacherAvailability
);

// Timetables
router.post(
  '/timetables',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.createTimetable
);

router.get(
  '/timetables/:id',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getTimetable
);

router.get(
  '/timetables/section/:sectionId',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getTimetableBySection
);

// Timetable Periods
router.post(
  '/periods',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.createPeriod
);

router.put(
  '/periods/:id',
  generalLimiter,
  authorize(Permission.TIMETABLE_UPDATE),
  timetableController.updatePeriod
);

router.delete(
  '/periods/:id',
  generalLimiter,
  authorize(Permission.TIMETABLE_DELETE),
  timetableController.deletePeriod
);

router.get(
  '/timetables/:timetableId/periods',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getTimetablePeriods
);

// Conflicts
router.get(
  '/timetables/:timetableId/conflicts',
  generalLimiter,
  authorize(Permission.TIMETABLE_READ),
  timetableController.getConflicts
);

// Generation
router.post(
  '/generate',
  generalLimiter,
  authorize(Permission.TIMETABLE_GENERATE),
  timetableController.generateTimetable
);

// Bulk Operations
router.post(
  '/periods/bulk',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.bulkCreatePeriods
);

router.post(
  '/timetables/:sourceTimetableId/copy',
  generalLimiter,
  authorize(Permission.TIMETABLE_CREATE),
  timetableController.copyTimetable
);

export default router;
