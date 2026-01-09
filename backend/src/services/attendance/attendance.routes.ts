import { Router } from 'express';
import { AttendanceController } from './attendance.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const attendanceController = new AttendanceController();

router.use(authenticate);

router.post(
  '/',
  generalLimiter,
  authorize(Permission.ATTENDANCE_CREATE),
  attendanceController.markAttendance
);

router.post(
  '/bulk',
  generalLimiter,
  authorize(Permission.ATTENDANCE_CREATE),
  attendanceController.bulkMarkAttendance
);

router.get(
  '/student/:studentId',
  generalLimiter,
  authorize(Permission.ATTENDANCE_READ),
  attendanceController.getAttendanceByStudent
);

router.get(
  '/student/:studentId/stats',
  generalLimiter,
  authorize(Permission.ATTENDANCE_READ),
  attendanceController.getAttendanceStats
);

export default router;
