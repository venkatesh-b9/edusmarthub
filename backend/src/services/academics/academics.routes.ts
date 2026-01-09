import { Router } from 'express';
import { AcademicsController } from './academics.controller';
import { authenticate, authorize, Permission } from '../../shared/middleware/auth';
import { generalLimiter } from '../../shared/middleware/rateLimit';

const router = Router();
const academicsController = new AcademicsController();

router.use(authenticate);

router.post(
  '/assessments',
  generalLimiter,
  authorize(Permission.GRADE_CREATE),
  academicsController.createAssessment
);

router.post(
  '/grades',
  generalLimiter,
  authorize(Permission.GRADE_CREATE),
  academicsController.createGrade
);

router.get(
  '/grades/student/:studentId',
  generalLimiter,
  authorize(Permission.GRADE_READ),
  academicsController.getGrades
);

router.get(
  '/progress/student/:studentId',
  generalLimiter,
  authorize(Permission.GRADE_READ),
  academicsController.getProgress
);

export default router;
